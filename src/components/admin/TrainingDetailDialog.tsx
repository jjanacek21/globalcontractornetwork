import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText, ExternalLink, CheckCircle, Clock, Brain, 
  Save, Loader2, AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ExtractedDocument {
  type: string;
  description: string;
  pageRange?: string;
  requirements?: string[];
  fields?: Record<string, string>;
}

interface TrainingSample {
  id: string;
  county: string;
  city: string | null;
  trade_type: string;
  material_type: string | null;
  is_hvhz: boolean | null;
  example_description: string | null;
  quality_score: number | null;
  processing_status: string | null;
  file_url: string | null;
  admin_verified: boolean | null;
  admin_notes: string | null;
  training_usage_count: number | null;
  created_at: string | null;
  uploaded_at: string | null;
  processed_at: string | null;
  extracted_documents: ExtractedDocument[] | null;
  packet_structure: any;
  source_file_name: string | null;
}

interface TrainingDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sample: TrainingSample | null;
  onUpdate: () => void;
}

export default function TrainingDetailDialog({
  open,
  onOpenChange,
  sample,
  onUpdate,
}: TrainingDetailDialogProps) {
  const [adminNotes, setAdminNotes] = useState(sample?.admin_notes || "");
  const [verified, setVerified] = useState(sample?.admin_verified || false);
  const [saving, setSaving] = useState(false);

  if (!sample) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("permit_packet_training")
        .update({
          admin_notes: adminNotes,
          admin_verified: verified,
        })
        .eq("id", sample.id);

      if (error) throw error;
      toast.success("Training sample updated");
      onUpdate();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = () => {
    const configs: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
      pending: { label: "Pending", color: "bg-amber-100 text-amber-800", icon: Clock },
      processing: { label: "Processing", color: "bg-blue-100 text-blue-800", icon: Loader2 },
      completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
      failed: { label: "Failed", color: "bg-red-100 text-red-800", icon: AlertCircle },
    };
    const config = configs[sample.processing_status] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className={`h-3 w-3 ${sample.processing_status === "processing" ? "animate-spin" : ""}`} />
        {config.label}
      </Badge>
    );
  };

  // Safely parse extracted_documents if it's a string
  const extractedDocs: ExtractedDocument[] = Array.isArray(sample.extracted_documents)
    ? sample.extracted_documents
    : [];
  
  // Extract key_features from packet_structure if available
  const packetData = sample.packet_structure || {};
  const keyFeatures: string[] = Array.isArray(packetData.keyFeatures)
    ? packetData.keyFeatures
    : Array.isArray(packetData.processingNotes) && packetData.processingNotes.length > 0
      ? packetData.processingNotes
      : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Training Sample Details
          </DialogTitle>
          <DialogDescription>
            {sample.county}{sample.city ? ` / ${sample.city}` : ""} - {sample.trade_type?.replace("_", " ")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              {getStatusBadge()}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quality Score</p>
              <p className="font-medium">
                {sample.quality_score !== null
                  ? `${Math.round(sample.quality_score * 100)}%`
                  : "Not analyzed"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Usage Count</p>
              <p className="font-medium">{sample.training_usage_count || 0} times</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">HVHZ Zone</p>
              <p className="font-medium">{sample.is_hvhz ? "Yes" : "No"}</p>
            </div>
          </div>

          {/* File Link */}
          {sample.file_url && (
            <div>
              <Button variant="outline" asChild>
                <a href={sample.file_url} target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2 h-4 w-4" />
                  View Original File
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            </div>
          )}

          <Tabs defaultValue="extracted" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="extracted">Extracted Data</TabsTrigger>
              <TabsTrigger value="features">Key Features</TabsTrigger>
              <TabsTrigger value="admin">Admin Notes</TabsTrigger>
              <TabsTrigger value="debug" className="text-xs">Debug</TabsTrigger>
            </TabsList>

            <TabsContent value="extracted" className="space-y-4">
              {sample.example_description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{sample.example_description}</p>
                </div>
              )}

              {extractedDocs.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Extracted Documents:</p>
                  {extractedDocs.map((doc, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{doc.type}</p>
                        {doc.pageRange && (
                          <Badge variant="outline" className="text-xs">
                            Pages: {doc.pageRange}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{doc.description}</p>
                      {doc.requirements && doc.requirements.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {doc.requirements.map((req, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No extracted document data available.</p>
                  <p className="text-sm">Re-run analysis to extract patterns.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              {keyFeatures.length > 0 ? (
                <div className="space-y-2">
                  {keyFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded bg-muted/50">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <p className="text-sm">{feature}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No key features extracted yet.</p>
                </div>
              )}

              {sample.material_type && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Material Type</p>
                  <Badge variant="outline" className="capitalize">
                    {sample.material_type.replace("_", " ")}
                  </Badge>
                </div>
              )}
            </TabsContent>

            <TabsContent value="admin" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verified"
                  checked={verified}
                  onCheckedChange={(checked) => setVerified(checked as boolean)}
                />
                <Label htmlFor="verified">
                  Mark as verified (admin-approved high-quality sample)
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this sample, corrections, or special considerations..."
                  rows={4}
                />
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>

              {/* Timestamps */}
              <div className="pt-4 border-t text-sm text-muted-foreground space-y-1">
                {sample.uploaded_at && (
                  <p>Uploaded: {format(new Date(sample.uploaded_at), "PPp")}</p>
                )}
                {sample.processed_at && (
                  <p>Analyzed: {format(new Date(sample.processed_at), "PPp")}</p>
                )}
                <p>Created: {format(new Date(sample.created_at!), "PPp")}</p>
              </div>
            </TabsContent>

            <TabsContent value="debug" className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Raw Packet Structure (Debug)</p>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap">
                  {JSON.stringify(sample.packet_structure, null, 2) || "No data"}
                </pre>
              </div>
              {packetData.processingNotes && packetData.processingNotes.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 text-amber-600">Processing Notes</p>
                  <ul className="text-sm space-y-1">
                    {packetData.processingNotes.map((note: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
