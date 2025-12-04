import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, FileText, Image } from "lucide-react";

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
}

interface FileUpload {
  file: File;
  type: 'drivers_license' | 'project_photo' | 'hurricane_straps_photo';
  preview?: string;
}

const SERVICE_TYPES = [
  "Roofing Permit",
  "HVAC Permit",
  "Electrical Permit",
  "Plumbing Permit",
  "Solar Permit",
  "Window/Door Replacement",
  "Pool Permit",
  "General Construction",
  "Other"
];

const ROOF_TYPES = [
  "Asphalt Shingle",
  "Metal Standing Seam",
  "Metal Screw Down",
  "Tile - Concrete",
  "Tile - Clay",
  "Flat/TPO",
  "Flat/Modified Bitumen",
  "Slate",
  "Wood Shake",
  "Other"
];

const UNDERLAYMENT_TYPES = [
  "Synthetic Underlayment",
  "Felt (15 lb)",
  "Felt (30 lb)",
  "Self-Adhering (Peel & Stick)",
  "High-Temp Underlayment",
  "Other"
];

const ROOF_ACCESSORIES = [
  "Ridge Vent",
  "Box Vents",
  "Turbine Vents",
  "Solar Powered Vents",
  "Skylights",
  "Solar Tubes",
  "Chimney",
  "Satellite Dish Mount",
  "None"
];

export function AddProjectDialog({ open, onOpenChange, onSuccess, userId }: AddProjectDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    property_address: "",
    city: "",
    state: "FL",
    zip_code: "",
    service_type: "",
    has_hurricane_straps: false,
    notes: "",
    // Roofing specific fields
    roof_type: "",
    roof_color: "",
    underlayment_type: "",
    roof_accessories: "",
    hoa_approval: false,
    architectural_approval: false,
    architectural_approval_required: false
  });
  const [files, setFiles] = useState<FileUpload[]>([]);
  
  const driversLicenseRef = useRef<HTMLInputElement>(null);
  const projectPhotosRef = useRef<HTMLInputElement>(null);
  const hurricaneStrapsRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: FileUpload['type']) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: FileUpload[] = [];
    Array.from(selectedFiles).forEach(file => {
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      newFiles.push({ file, type, preview });
    });

    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFiles = async (projectId: string) => {
    const uploadPromises = files.map(async ({ file, type }) => {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${projectId}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('permit-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: docError } = await supabase
        .from('permit_project_documents')
        .insert({
          project_id: projectId,
          document_type: type,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size
        });

      if (docError) throw docError;
    });

    await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_name || !formData.property_address || !formData.service_type) {
      toast({
        title: "Missing required fields",
        description: "Please fill in customer name, property address, and service type.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: project, error: projectError } = await supabase
        .from('permit_projects')
        .insert({
          user_id: userId,
          ...formData
        })
        .select()
        .single();

      if (projectError) throw projectError;

      if (files.length > 0) {
        await uploadFiles(project.id);
      }

      toast({
        title: "Project created",
        description: "Your permit project has been submitted successfully."
      });

      // Reset form
      setFormData({
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        property_address: "",
        city: "",
        state: "FL",
        zip_code: "",
        service_type: "",
        has_hurricane_straps: false,
        notes: "",
        roof_type: "",
        roof_color: "",
        underlayment_type: "",
        roof_accessories: "",
        hoa_approval: false,
        architectural_approval: false,
        architectural_approval_required: false
      });
      setFiles([]);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilesByType = (type: FileUpload['type']) => files.filter(f => f.type === type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-amber-500/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Add New Permit Project</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Enter your customer's information and upload required documents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-amber-500 uppercase tracking-wide">Customer Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name" className="text-zinc-300">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange("customer_name", e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customer_phone" className="text-zinc-300">Phone Number</Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => handleInputChange("customer_phone", e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customer_email" className="text-zinc-300">Email Address</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => handleInputChange("customer_email", e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* Property Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-amber-500 uppercase tracking-wide">Property Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="property_address" className="text-zinc-300">Property Address *</Label>
              <Input
                id="property_address"
                value={formData.property_address}
                onChange={(e) => handleInputChange("property_address", e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="Street address"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="city" className="text-zinc-300">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state" className="text-zinc-300">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zip_code" className="text-zinc-300">ZIP Code</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => handleInputChange("zip_code", e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* Service Type */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-amber-500 uppercase tracking-wide">Service Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="service_type" className="text-zinc-300">Service Type *</Label>
              <Select
                value={formData.service_type}
                onValueChange={(value) => handleInputChange("service_type", value)}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {SERVICE_TYPES.map(type => (
                    <SelectItem key={type} value={type} className="text-white hover:bg-zinc-700">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hurricane Straps */}
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
              <Checkbox
                id="has_hurricane_straps"
                checked={formData.has_hurricane_straps}
                onCheckedChange={(checked) => handleInputChange("has_hurricane_straps", checked as boolean)}
                className="border-amber-500 data-[state=checked]:bg-amber-500"
              />
              <Label htmlFor="has_hurricane_straps" className="text-zinc-300 cursor-pointer">
                Property has hurricane straps installed
              </Label>
            </div>
          </div>

          {/* Roofing Specific Fields */}
          {formData.service_type === "Roofing Permit" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-amber-500 uppercase tracking-wide">Roofing Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roof_type" className="text-zinc-300">Roof Type *</Label>
                  <Select
                    value={formData.roof_type}
                    onValueChange={(value) => handleInputChange("roof_type", value)}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Select roof type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {ROOF_TYPES.map(type => (
                        <SelectItem key={type} value={type} className="text-white hover:bg-zinc-700">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roof_color" className="text-zinc-300">Roof Color</Label>
                  <Input
                    id="roof_color"
                    value={formData.roof_color}
                    onChange={(e) => handleInputChange("roof_color", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="e.g., Charcoal, Desert Tan, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="underlayment_type" className="text-zinc-300">Underlayment Type</Label>
                  <Select
                    value={formData.underlayment_type}
                    onValueChange={(value) => handleInputChange("underlayment_type", value)}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Select underlayment" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {UNDERLAYMENT_TYPES.map(type => (
                        <SelectItem key={type} value={type} className="text-white hover:bg-zinc-700">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roof_accessories" className="text-zinc-300">Roof Accessories</Label>
                  <Select
                    value={formData.roof_accessories}
                    onValueChange={(value) => handleInputChange("roof_accessories", value)}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Select accessories" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {ROOF_ACCESSORIES.map(type => (
                        <SelectItem key={type} value={type} className="text-white hover:bg-zinc-700">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Approvals Section */}
              <div className="space-y-3 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                <p className="text-zinc-300 text-sm font-medium">Required Approvals</p>
                
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="hoa_approval"
                    checked={formData.hoa_approval}
                    onCheckedChange={(checked) => handleInputChange("hoa_approval", checked as boolean)}
                    className="border-amber-500 data-[state=checked]:bg-amber-500"
                  />
                  <Label htmlFor="hoa_approval" className="text-zinc-300 cursor-pointer">
                    HOA Approval Obtained
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="architectural_approval_required"
                    checked={formData.architectural_approval_required}
                    onCheckedChange={(checked) => handleInputChange("architectural_approval_required", checked as boolean)}
                    className="border-amber-500 data-[state=checked]:bg-amber-500"
                  />
                  <Label htmlFor="architectural_approval_required" className="text-zinc-300 cursor-pointer">
                    Architectural Approval Required by City
                  </Label>
                </div>

                {formData.architectural_approval_required && (
                  <div className="flex items-center space-x-3 ml-6">
                    <Checkbox
                      id="architectural_approval"
                      checked={formData.architectural_approval}
                      onCheckedChange={(checked) => handleInputChange("architectural_approval", checked as boolean)}
                      className="border-amber-500 data-[state=checked]:bg-amber-500"
                    />
                    <Label htmlFor="architectural_approval" className="text-zinc-300 cursor-pointer">
                      Architectural Approval Obtained
                    </Label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Document Uploads */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-amber-500 uppercase tracking-wide">Documents & Photos</h3>
            
            {/* Driver's License */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Driver's License</Label>
              <input
                ref={driversLicenseRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileSelect(e, 'drivers_license')}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => driversLicenseRef.current?.click()}
                className="w-full border-dashed border-zinc-600 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Driver's License
              </Button>
              {getFilesByType('drivers_license').map((f, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-zinc-800 rounded">
                  <FileText className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-zinc-300 flex-1 truncate">{f.file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(files.indexOf(f))}
                    className="h-6 w-6 p-0 text-zinc-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Project Photos */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Project Photos</Label>
              <input
                ref={projectPhotosRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileSelect(e, 'project_photo')}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => projectPhotosRef.current?.click()}
                className="w-full border-dashed border-zinc-600 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <Image className="h-4 w-4 mr-2" />
                Upload Project Photos
              </Button>
              <div className="grid grid-cols-3 gap-2">
                {getFilesByType('project_photo').map((f, idx) => (
                  <div key={idx} className="relative group">
                    {f.preview ? (
                      <img src={f.preview} alt="" className="w-full h-20 object-cover rounded" />
                    ) : (
                      <div className="w-full h-20 bg-zinc-800 rounded flex items-center justify-center">
                        <FileText className="h-6 w-6 text-zinc-500" />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(files.indexOf(f))}
                      className="absolute top-1 right-1 h-5 w-5 p-0 bg-black/50 text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Hurricane Straps Photos */}
            {formData.has_hurricane_straps && (
              <div className="space-y-2">
                <Label className="text-zinc-300">Hurricane Straps Photos</Label>
                <input
                  ref={hurricaneStrapsRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect(e, 'hurricane_straps_photo')}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => hurricaneStrapsRef.current?.click()}
                  className="w-full border-dashed border-zinc-600 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  <Image className="h-4 w-4 mr-2" />
                  Upload Hurricane Straps Photos
                </Button>
                <div className="grid grid-cols-3 gap-2">
                  {getFilesByType('hurricane_straps_photo').map((f, idx) => (
                    <div key={idx} className="relative group">
                      {f.preview ? (
                        <img src={f.preview} alt="" className="w-full h-20 object-cover rounded" />
                      ) : (
                        <div className="w-full h-20 bg-zinc-800 rounded flex items-center justify-center">
                          <FileText className="h-6 w-6 text-zinc-500" />
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(files.indexOf(f))}
                        className="absolute top-1 right-1 h-5 w-5 p-0 bg-black/50 text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-zinc-300">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
              placeholder="Any additional information that may help with the permit..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              {loading ? "Submitting..." : "Submit Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}