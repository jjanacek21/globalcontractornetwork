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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText, ExternalLink, CheckCircle, Clock, Brain, 
  Save, Loader2, AlertCircle, RefreshCw, Package, Award
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

interface ExtractedProductApproval {
  manufacturer: string;
  productName: string;
  noaNumber: string | null;
  flApprovalNumber: string | null;
  ulListing: string | null;
  hvhzApproved: boolean;
  expirationDate: string | null;
  category: string;
  pageFound?: number;
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

// Helper to extract product approvals from raw description if parsing failed
function extractProductsFromRaw(raw: string | null): ExtractedProductApproval[] {
  if (!raw || !raw.includes('productApprovals')) return [];
  
  try {
    // Try to find and parse the productApprovals array
    const match = raw.match(/"productApprovals"\s*:\s*\[([\s\S]*?)\](?=\s*,?\s*")/);
    if (match) {
      const arrayContent = '[' + match[1] + ']';
      // Clean up common issues
      const cleaned = arrayContent
        .replace(/,\s*\]/g, ']')
        .replace(/,\s*,/g, ',');
      return JSON.parse(cleaned);
    }
  } catch (e) {
    // Silent fail
  }
  return [];
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
  const [reanalyzing, setReanalyzing] = useState(false);

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

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      // Reset status to pending first
      await supabase
        .from("permit_packet_training")
        .update({ processing_status: "pending" })
        .eq("id", sample.id);

      // Call the analyzer
      const { error } = await supabase.functions.invoke("permit-packet-analyzer", {
        body: {
          mode: "analyze_only",
          trainingId: sample.id,
          fileName: sample.source_file_name,
        },
      });

      if (error) throw error;
      toast.success("Re-analysis started");
      onUpdate();
    } catch (error: any) {
      console.error("Re-analyze error:", error);
      toast.error("Failed to re-analyze: " + (error.message || "Unknown error"));
    } finally {
      setReanalyzing(false);
    }
  };

  const getStatusBadge = () => {
    const configs: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
      pending: { label: "Pending", color: "bg-amber-100 text-amber-800", icon: Clock },
      processing: { label: "Processing", color: "bg-blue-100 text-blue-800", icon: Loader2 },
      completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
      failed: { label: "Failed", color: "bg-red-100 text-red-800", icon: AlertCircle },
      detected: { label: "Detected", color: "bg-purple-100 text-purple-800", icon: Brain },
    };
    const config = configs[sample.processing_status || "pending"] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className={`h-3 w-3 ${sample.processing_status === "processing" ? "animate-spin" : ""}`} />
        {config.label}
      </Badge>
    );
  };

  // Safely parse extracted_documents
  const extractedDocs: ExtractedDocument[] = Array.isArray(sample.extracted_documents)
    ? sample.extracted_documents
    : [];
  
  // Extract data from packet_structure
  const packetData = sample.packet_structure || {};
  const keyFeatures: string[] = Array.isArray(packetData.keyFeatures)
    ? packetData.keyFeatures
    : Array.isArray(packetData.processingNotes) && packetData.processingNotes.length > 0
      ? packetData.processingNotes
      : [];

  // Get product approvals from packet_structure or try to recover from raw description
  const productApprovals: ExtractedProductApproval[] = 
    Array.isArray(packetData.productApprovals) && packetData.productApprovals.length > 0
      ? packetData.productApprovals
      : extractProductsFromRaw(sample.example_description);

  const hasParsingIssues = packetData.processingNotes?.some((note: string) => 
    note.includes("parsing failed") || note.includes("Partial extraction")
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

          {/* Action Buttons */}
          <div className="flex gap-2">
            {sample.file_url && (
              <Button variant="outline" asChild>
                <a href={sample.file_url} target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2 h-4 w-4" />
                  View File
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleReanalyze}
              disabled={reanalyzing || sample.processing_status === "processing"}
            >
              {reanalyzing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Re-analyze
            </Button>
          </div>

          {/* Parsing Warning */}
          {hasParsingIssues && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Parsing Issues Detected</p>
                <p className="text-sm text-amber-700">
                  The AI response couldn't be fully parsed. Some data may be missing or incomplete.
                  Try clicking "Re-analyze" to process the document again.
                </p>
              </div>
            </div>
          )}

          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="products" className="text-xs">Products</TabsTrigger>
              <TabsTrigger value="extracted" className="text-xs">Documents</TabsTrigger>
              <TabsTrigger value="features" className="text-xs">Features</TabsTrigger>
              <TabsTrigger value="admin" className="text-xs">Admin</TabsTrigger>
              <TabsTrigger value="debug" className="text-xs">Debug</TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-4">
              {productApprovals.length > 0 ? (
                <div className="grid gap-3">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Extracted Product Approvals ({productApprovals.length})
                  </p>
                  {productApprovals.map((product, index) => (
                    <Card key={index} className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <p className="font-medium">{product.manufacturer}</p>
                            <p className="text-sm text-muted-foreground">{product.productName}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {product.noaNumber && (
                                <Badge variant="outline" className="text-xs">
                                  <Award className="h-3 w-3 mr-1" />
                                  {product.noaNumber}
                                </Badge>
                              )}
                              {product.flApprovalNumber && (
                                <Badge variant="outline" className="text-xs">
                                  FL: {product.flApprovalNumber}
                                </Badge>
                              )}
                              {product.ulListing && (
                                <Badge variant="outline" className="text-xs">
                                  UL: {product.ulListing}
                                </Badge>
                              )}
                              {product.hvhzApproved && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  HVHZ Approved
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary" className="capitalize shrink-0">
                            {product.category || "other"}
                          </Badge>
                        </div>
                        {product.expirationDate && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Expires: {product.expirationDate}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No product approvals extracted.</p>
                  <p className="text-sm">Try re-analyzing the document.</p>
                </div>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="extracted" className="space-y-4">
              {sample.example_description && !sample.example_description.startsWith("{") && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{sample.example_description}</p>
                </div>
              )}

              {extractedDocs.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Packet Documents:</p>
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

            {/* Features Tab */}
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

              {/* Trade Specific Data */}
              {packetData.tradeSpecificData && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Trade-Specific Data</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {packetData.tradeSpecificData.nailPattern && (
                      <div className="bg-muted/50 p-2 rounded">
                        <span className="text-muted-foreground">Nail Pattern:</span>{" "}
                        {packetData.tradeSpecificData.nailPattern}
                      </div>
                    )}
                    {packetData.tradeSpecificData.roofSlope && (
                      <div className="bg-muted/50 p-2 rounded">
                        <span className="text-muted-foreground">Roof Slope:</span>{" "}
                        {packetData.tradeSpecificData.roofSlope}
                      </div>
                    )}
                    {packetData.tradeSpecificData.deckType && (
                      <div className="bg-muted/50 p-2 rounded">
                        <span className="text-muted-foreground">Deck Type:</span>{" "}
                        {packetData.tradeSpecificData.deckType}
                      </div>
                    )}
                    {packetData.tradeSpecificData.underlaymentProduct && (
                      <div className="bg-muted/50 p-2 rounded">
                        <span className="text-muted-foreground">Underlayment:</span>{" "}
                        {packetData.tradeSpecificData.underlaymentProduct}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Admin Tab */}
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

            {/* Debug Tab */}
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
              {sample.example_description && sample.example_description.length > 200 && (
                <div>
                  <p className="text-sm font-medium mb-2">Raw Example Description</p>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40 whitespace-pre-wrap">
                    {sample.example_description.substring(0, 1000)}
                    {sample.example_description.length > 1000 ? "..." : ""}
                  </pre>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
