import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Brain, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const FLORIDA_COUNTIES = [
  "Miami-Dade",
  "Broward",
  "Palm Beach",
  "Monroe",
  "Collier",
  "Lee",
  "Martin",
  "St. Lucie",
  "Indian River",
  "Hillsborough",
  "Pinellas",
  "Orange",
  "Osceola",
  "Seminole",
  "Volusia",
  "Duval",
];

const TRADE_TYPES = [
  { value: "roofing", label: "Roofing" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "mechanical", label: "Mechanical/HVAC" },
  { value: "solar", label: "Solar/PV" },
  { value: "windows_doors", label: "Windows & Doors" },
  { value: "fencing", label: "Fencing" },
  { value: "pool", label: "Pool" },
  { value: "structural", label: "Structural" },
  { value: "general", label: "General Building" },
];

const MATERIAL_TYPES = [
  { value: "shingle", label: "Shingle" },
  { value: "tile", label: "Tile" },
  { value: "metal", label: "Metal" },
  { value: "flat", label: "Flat/Modified Bitumen" },
  { value: "tpo_epdm", label: "TPO/EPDM" },
  { value: "coating", label: "Roof Coating" },
  { value: "impact_windows", label: "Impact Windows" },
  { value: "impact_doors", label: "Impact Doors" },
  { value: "aluminum", label: "Aluminum" },
  { value: "wood", label: "Wood" },
  { value: "vinyl", label: "Vinyl" },
  { value: "other", label: "Other" },
];

interface PermitTrainingUploaderProps {
  onUploadComplete?: () => void;
}

export default function PermitTrainingUploader({ onUploadComplete }: PermitTrainingUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [storageReady, setStorageReady] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  
  // Form state
  const [county, setCounty] = useState("");
  const [city, setCity] = useState("");
  const [tradeType, setTradeType] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [isHvhz, setIsHvhz] = useState(false);
  const [description, setDescription] = useState("");

  // Validate storage access on mount
  useEffect(() => {
    const validateStorageAccess = async () => {
      try {
        const { error } = await supabase.storage
          .from("permit-training-packets")
          .list("test-access", { limit: 1 });
        
        if (error) {
          console.error("[PermitTrainingUploader] Storage access check failed:", error);
          if (error.message.includes("not found")) {
            setStorageError("Training storage bucket not configured. Contact support.");
          } else if (error.message.includes("policy") || error.message.includes("permission") || error.message.includes("denied")) {
            setStorageError("You don't have permission to upload training files. Ensure you're added as a permit admin.");
          } else {
            setStorageError(`Storage error: ${error.message}`);
          }
          setStorageReady(false);
        } else {
          setStorageReady(true);
          setStorageError(null);
        }
      } catch (err) {
        console.error("[PermitTrainingUploader] Storage validation error:", err);
        setStorageReady(false);
        setStorageError("Failed to validate storage access");
      }
    };

    validateStorageAccess();
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload PDF or image files.");
      return false;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 50MB.");
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!selectedFile || !county || !tradeType) {
      toast.error("Please fill in required fields (County, Trade Type) and select a file.");
      return;
    }

    setUploading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}_${crypto.randomUUID()}.${fileExt}`;
      const filePath = `training/${county}/${tradeType}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("permit-training-packets")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("permit-training-packets")
        .getPublicUrl(filePath);

      // Create training record
      const { data: trainingRecord, error: insertError } = await supabase
        .from("permit_packet_training")
        .insert([{
          county,
          city: city || null,
          trade_type: tradeType,
          material_type: materialType || null,
          is_hvhz: isHvhz,
          example_description: description || null,
          file_url: urlData.publicUrl,
          uploaded_by: user.id,
          uploaded_at: new Date().toISOString(),
          processing_status: "pending",
          packet_structure: {}, // Will be populated by AI analyzer
          source_file_name: selectedFile.name,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success("Training packet uploaded successfully!");
      
      // Reset form
      setSelectedFile(null);
      setCity("");
      setDescription("");
      
      // Trigger AI analysis
      await triggerAnalysis(trainingRecord.id, urlData.publicUrl, selectedFile.name);
      
      onUploadComplete?.();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload training packet");
    } finally {
      setUploading(false);
    }
  };

  const triggerAnalysis = async (trainingId: string, fileUrl: string, fileName: string) => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("permit-packet-analyzer", {
        body: { trainingId, fileUrl, fileName },
      });

      if (error) throw error;

      if (data.success) {
        toast.success("AI analysis complete! Patterns extracted.");
      } else {
        toast.warning("Analysis completed with warnings. Check the record for details.");
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error("AI analysis failed. You can retry from the samples table.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="border-dashed border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Upload Training Packet
        </CardTitle>
        <CardDescription>
          Upload completed permit packets to train the AI. The system will extract patterns, 
          field mappings, and jurisdiction-specific requirements.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Storage Access Error Banner */}
        {!storageReady && storageError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-destructive flex-shrink-0" />
            <div>
              <p className="font-medium text-destructive">Storage Access Error</p>
              <p className="text-sm text-destructive/80">{storageError}</p>
            </div>
          </div>
        )}

        {/* File Drop Zone */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${!storageReady ? "opacity-50 pointer-events-none" : ""}
            ${dragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50"}
            ${selectedFile ? "bg-green-50 border-green-300 dark:bg-green-900/20" : ""}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={!storageReady}
          />
          {selectedFile ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-10 w-10 text-green-600" />
              <p className="font-medium text-green-700 dark:text-green-400">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                Choose Different File
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Drag & drop your permit packet here</p>
              <p className="text-sm text-muted-foreground">or click to browse (PDF, JPG, PNG up to 50MB)</p>
            </div>
          )}
        </div>

        {/* Metadata Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="county">County *</Label>
            <Select value={county} onValueChange={setCounty}>
              <SelectTrigger>
                <SelectValue placeholder="Select county" />
              </SelectTrigger>
              <SelectContent>
                {FLORIDA_COUNTIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City (Optional)</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Boca Raton"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tradeType">Trade Type *</Label>
            <Select value={tradeType} onValueChange={setTradeType}>
              <SelectTrigger>
                <SelectValue placeholder="Select trade" />
              </SelectTrigger>
              <SelectContent>
                {TRADE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="materialType">Material Type</Label>
            <Select value={materialType} onValueChange={setMaterialType}>
              <SelectTrigger>
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {MATERIAL_TYPES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="hvhz"
            checked={isHvhz}
            onCheckedChange={(checked) => setIsHvhz(checked as boolean)}
          />
          <Label htmlFor="hvhz" className="text-sm font-normal">
            This permit is for a High Velocity Hurricane Zone (HVHZ)
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what makes this packet a good training example..."
            rows={3}
          />
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={uploading || analyzing || !selectedFile || !county || !tradeType || !storageReady}
          className="w-full"
          size="lg"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : analyzing ? (
            <>
              <Brain className="mr-2 h-4 w-4 animate-pulse" />
              AI Analyzing...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Upload & Analyze
            </>
          )}
        </Button>

        {analyzing && (
          <div className="text-center text-sm text-muted-foreground">
            <p>The AI is extracting patterns from your packet...</p>
            <p>This may take 15-30 seconds.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
