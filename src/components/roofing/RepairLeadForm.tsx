import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, X, Loader2, CheckCircle2, Wrench, Building2, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RepairLeadFormProps {
  propertyType: string | null;
  onSuccess?: () => void;
}

export function RepairLeadForm({ propertyType, onSuccess }: RepairLeadFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    issueDescription: "",
    preferredCallback: ""
  });
  
  // Photo upload
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types (jpg, jpeg, png only)
    const validFiles = files.filter(f => 
      ['image/jpeg', 'image/jpg', 'image/png'].includes(f.type)
    );
    
    if (validFiles.length !== files.length) {
      toast.error("Only JPG and PNG images are allowed");
    }
    
    // Limit to 5 photos max
    const newFiles = [...photos, ...validFiles].slice(0, 5);
    setPhotos(newFiles);
    
    // Create previews
    setPreviews(newFiles.map(f => URL.createObjectURL(f)));
  };

  const removePhoto = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];
    
    setUploading(true);
    const urls: string[] = [];
    
    for (const file of photos) {
      const fileName = `repair-requests/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
      const { error } = await supabase.storage
        .from('homeowner-uploads')
        .upload(fileName, file);
      
      if (!error) {
        const { data } = supabase.storage
          .from('homeowner-uploads')
          .getPublicUrl(fileName);
        urls.push(data.publicUrl);
      }
    }
    
    setUploading(false);
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Upload photos first
      const photoUrls = await uploadPhotos();
      
      // Submit to service_requests table
      const { error } = await supabase
        .from("service_requests")
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            property_address: formData.address,
            message: `[REPAIR REQUEST]\n\nProperty Type: ${propertyType || 'Not specified'}\nPreferred Callback: ${formData.preferredCallback || 'Anytime'}\n\nIssue Description:\n${formData.issueDescription}\n\nPhotos: ${photoUrls.length > 0 ? photoUrls.join('\n') : 'None uploaded'}`,
            referral_source: 'roofing-repair-form'
          }
        ]);

      if (error) throw error;

      // Send Telegram notification
      supabase.functions.invoke('telegram-lead-alert', {
        body: {
          source: '🔧 Roof Repair Request',
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          service: 'Roof Repair',
          urgency: 'repair-request',
          notes: `${propertyType ? `Property: ${propertyType}\n` : ''}${formData.issueDescription}\n\nPhotos attached: ${photoUrls.length}`
        }
      }).catch(err => console.error('Telegram notification failed:', err));

      toast.success("Repair request submitted! We'll contact you within 24 hours.");
      setSubmitted(true);
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting repair request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardContent className="pt-12 pb-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold">Request Submitted!</h3>
          <p className="text-muted-foreground">
            Thank you for your repair request. One of our roofing specialists will contact you within 24 hours to discuss your needs.
          </p>
          <Button onClick={() => window.location.href = '/roofing-services'} variant="outline">
            Back to Roofing Services
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Wrench className="h-6 w-6 text-blue-600" />
          <CardTitle className="text-2xl">Request Roof Repair</CardTitle>
        </div>
        {propertyType && (
          <Badge variant="outline" className="mx-auto">
            {propertyType === 'commercial' ? <Building2 className="h-3 w-3 mr-1" /> : <Home className="h-3 w-3 mr-1" />}
            {propertyType === 'commercial' ? 'Commercial Property' : 'Residential Property'}
          </Badge>
        )}
        <CardDescription>
          Tell us about your roof repair needs and we'll get back to you within 24 hours
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              required
              placeholder="John Smith"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              required
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Property Address *</Label>
            <Input
              id="address"
              required
              placeholder="123 Main St, Miami, FL 33101"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          {/* Issue Description */}
          <div className="space-y-2">
            <Label htmlFor="issue">Describe the Issue *</Label>
            <Textarea
              id="issue"
              required
              rows={4}
              placeholder="Please describe the roof issue you're experiencing (leaks, missing shingles, storm damage, etc.)"
              value={formData.issueDescription}
              onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Damage Photos (Optional - up to 5)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="photo-upload"
                disabled={photos.length >= 5}
              />
              <label htmlFor="photo-upload" className={`cursor-pointer ${photos.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {photos.length >= 5 ? 'Maximum photos reached' : 'Click to upload photos of roof damage'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG up to 20MB each
                </p>
              </label>
            </div>
            
            {/* Photo previews */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {previews.map((preview, idx) => (
                  <div key={idx} className="relative group">
                    <img 
                      src={preview} 
                      alt={`Damage photo ${idx + 1}`}
                      className="rounded-lg object-cover h-24 w-full" 
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preferred Callback Time */}
          <div className="space-y-2">
            <Label htmlFor="callback">Preferred Callback Time</Label>
            <Select 
              value={formData.preferredCallback} 
              onValueChange={(v) => setFormData({ ...formData, preferredCallback: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select preferred time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning (8am - 12pm)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12pm - 5pm)</SelectItem>
                <SelectItem value="evening">Evening (5pm - 8pm)</SelectItem>
                <SelectItem value="anytime">Anytime</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={submitting || uploading}
          >
            {submitting || uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploading ? 'Uploading photos...' : 'Submitting...'}
              </>
            ) : (
              'Submit Repair Request'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
