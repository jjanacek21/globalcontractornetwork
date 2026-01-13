import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Upload, FileUp, Search, Trash2, ExternalLink, FileText, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface TrainingSession {
  id: string;
  address: string;
  created_at: string;
  ai_estimated_sqft: number | null;
}

interface UploadedReport {
  id: string;
  address: string;
  report_type: string | null;
  report_url: string | null;
  report_uploaded_at: string | null;
  ground_truth_sqft: number | null;
  ai_estimated_sqft: number | null;
  ai_error_percent: number | null;
}

const REPORT_TYPES = [
  { value: "eagleview", label: "EagleView", description: "Premium aerial measurement report" },
  { value: "roofr", label: "RoofR", description: "Roofing software measurement" },
  { value: "insurance", label: "Insurance/Xactimate", description: "Claims report with verified area" },
  { value: "drone", label: "Drone Survey", description: "Photogrammetry-derived measurements" },
  { value: "blueprints", label: "As-Built/Blueprints", description: "Architectural drawings" },
  { value: "other", label: "Other", description: "Other measurement report" },
];

export default function ReportUploadCenter() {
  const [loading, setLoading] = useState(true);
  const [uploadedReports, setUploadedReports] = useState<UploadedReport[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Upload form state
  const [addressSearch, setAddressSearch] = useState("");
  const [matchingSessions, setMatchingSessions] = useState<TrainingSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | "new">("new");
  const [reportType, setReportType] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [verifiedSqft, setVerifiedSqft] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchingAddresses, setSearchingAddresses] = useState(false);

  useEffect(() => {
    fetchUploadedReports();
  }, []);

  const fetchUploadedReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_training_sessions")
        .select("id, address, report_type, report_url, report_uploaded_at, ground_truth_sqft, ai_estimated_sqft, ai_error_percent")
        .not("report_url", "is", null)
        .order("report_uploaded_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setUploadedReports((data || []) as UploadedReport[]);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setMatchingSessions([]);
      return;
    }

    setSearchingAddresses(true);
    try {
      const { data, error } = await supabase
        .from("ai_training_sessions")
        .select("id, address, created_at, ai_estimated_sqft")
        .ilike("address", `%${query}%`)
        .is("report_url", null)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setMatchingSessions((data || []) as TrainingSession[]);
    } catch (error) {
      console.error("Error searching addresses:", error);
    } finally {
      setSearchingAddresses(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchAddresses(addressSearch);
    }, 300);
    return () => clearTimeout(debounce);
  }, [addressSearch, searchAddresses]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("Only PDF, JPG, and PNG files are allowed");
        return;
      }
      // Validate file size (20MB max)
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast.error("File size must be under 20MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const resetForm = () => {
    setAddressSearch("");
    setMatchingSessions([]);
    setSelectedSessionId("new");
    setReportType("");
    setPropertyAddress("");
    setVerifiedSqft("");
    setNotes("");
    setFile(null);
  };

  const handleUpload = async () => {
    if (!reportType) {
      toast.error("Please select a report type");
      return;
    }
    if (!verifiedSqft) {
      toast.error("Please enter the verified square footage");
      return;
    }
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }
    if (selectedSessionId === "new" && !propertyAddress) {
      toast.error("Please enter the property address");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `reports/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("ai-training-reports")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("ai-training-reports")
        .getPublicUrl(filePath);

      const sqft = parseFloat(verifiedSqft);

      if (selectedSessionId === "new") {
        // Create new training session with the report
        const { error: insertError } = await supabase
          .from("ai_training_sessions")
          .insert({
            session_id: `report-${Date.now()}`,
            address: propertyAddress,
            normalized_address: propertyAddress.toLowerCase().trim(),
            latitude: 0,
            longitude: 0,
            service_type: "report_upload",
            ground_truth_sqft: sqft,
            ground_truth_squares: sqft / 100,
            ground_truth_source: reportType,
            ground_truth_notes: notes || null,
            ground_truth_date: new Date().toISOString(),
            report_url: publicUrl,
            report_type: reportType,
            report_uploaded_at: new Date().toISOString(),
            report_uploaded_by: user.id,
            is_usable_for_training: true,
          });

        if (insertError) throw insertError;
      } else {
        // Get the existing session to calculate error
        const { data: session } = await supabase
          .from("ai_training_sessions")
          .select("ai_estimated_sqft, final_accepted_sqft")
          .eq("id", selectedSessionId)
          .single();

        const aiError = session?.ai_estimated_sqft
          ? ((session.ai_estimated_sqft - sqft) / sqft) * 100
          : null;
        const acceptedError = session?.final_accepted_sqft
          ? ((session.final_accepted_sqft - sqft) / sqft) * 100
          : null;

        // Update existing session with report
        const { error: updateError } = await supabase
          .from("ai_training_sessions")
          .update({
            ground_truth_sqft: sqft,
            ground_truth_squares: sqft / 100,
            ground_truth_source: reportType,
            ground_truth_notes: notes || null,
            ground_truth_date: new Date().toISOString(),
            ai_error_percent: aiError,
            accepted_error_percent: acceptedError,
            report_url: publicUrl,
            report_type: reportType,
            report_uploaded_at: new Date().toISOString(),
            report_uploaded_by: user.id,
          })
          .eq("id", selectedSessionId);

        if (updateError) throw updateError;
      }

      toast.success("Report uploaded successfully");
      setUploadDialogOpen(false);
      resetForm();
      fetchUploadedReports();
    } catch (error) {
      console.error("Error uploading report:", error);
      toast.error("Failed to upload report");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteReport = async (sessionId: string, reportUrl: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      // Extract file path from URL
      const urlParts = reportUrl.split("/");
      const filePath = `reports/${urlParts[urlParts.length - 1]}`;

      // Delete from storage
      await supabase.storage.from("ai-training-reports").remove([filePath]);

      // Clear report fields from session
      const { error } = await supabase
        .from("ai_training_sessions")
        .update({
          report_url: null,
          report_type: null,
          report_uploaded_at: null,
          report_uploaded_by: null,
        })
        .eq("id", sessionId);

      if (error) throw error;

      toast.success("Report deleted");
      fetchUploadedReports();
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report");
    }
  };

  const getReportTypeBadge = (type: string | null) => {
    const reportInfo = REPORT_TYPES.find((r) => r.value === type);
    return (
      <Badge variant="secondary" className="gap-1">
        <FileText className="h-3 w-3" />
        {reportInfo?.label || type || "Unknown"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Report Upload Center
            </CardTitle>
            <CardDescription>
              Upload EagleView, RoofR, and other roof measurement reports for AI training
            </CardDescription>
          </div>
          <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Report
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : uploadedReports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reports uploaded yet</p>
              <p className="text-sm">Upload your first measurement report to start training the AI</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Report Type</TableHead>
                  <TableHead className="text-right">Verified Sqft</TableHead>
                  <TableHead className="text-right">AI Estimate</TableHead>
                  <TableHead className="text-right">AI Error</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadedReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {report.address}
                    </TableCell>
                    <TableCell>{getReportTypeBadge(report.report_type)}</TableCell>
                    <TableCell className="text-right">
                      {report.ground_truth_sqft?.toLocaleString() || "—"} sqft
                    </TableCell>
                    <TableCell className="text-right">
                      {report.ai_estimated_sqft?.toLocaleString() || "—"} sqft
                    </TableCell>
                    <TableCell className="text-right">
                      {report.ai_error_percent !== null ? (
                        <span className={Math.abs(report.ai_error_percent) > 10 ? "text-red-600" : "text-green-600"}>
                          {report.ai_error_percent.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.report_uploaded_at
                        ? format(new Date(report.report_uploaded_at), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {report.report_url && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(report.report_url!, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteReport(report.id, report.report_url!)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Measurement Report</DialogTitle>
            <DialogDescription>
              Upload a roof measurement report to add ground truth data for AI training
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Link to Session */}
            <div className="space-y-2">
              <Label>Link to Existing Session (optional)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by address..."
                  value={addressSearch}
                  onChange={(e) => setAddressSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchingAddresses && (
                <p className="text-sm text-muted-foreground">Searching...</p>
              )}
              {matchingSessions.length > 0 && (
                <RadioGroup value={selectedSessionId} onValueChange={setSelectedSessionId} className="space-y-2">
                  {matchingSessions.map((session) => (
                    <div key={session.id} className="flex items-center space-x-2 p-2 border rounded-lg">
                      <RadioGroupItem value={session.id} id={session.id} />
                      <Label htmlFor={session.id} className="flex-1 cursor-pointer">
                        <div className="font-medium text-sm">{session.address}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(session.created_at), "MMM d, yyyy")} •
                          AI: {session.ai_estimated_sqft?.toLocaleString() || "N/A"} sqft
                        </div>
                      </Label>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2 p-2 border rounded-lg border-dashed">
                    <RadioGroupItem value="new" id="new-session" />
                    <Label htmlFor="new-session" className="cursor-pointer">
                      Create new session for this address
                    </Label>
                  </div>
                </RadioGroup>
              )}
            </div>

            {/* Property Address (only for new sessions) */}
            {selectedSessionId === "new" && (
              <div className="space-y-2">
                <Label htmlFor="property-address">Property Address *</Label>
                <Input
                  id="property-address"
                  placeholder="123 Main St, Miami, FL 33101"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                />
              </div>
            )}

            {/* Report Type */}
            <div className="space-y-2">
              <Label>Report Type *</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type..." />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Verified Square Footage */}
            <div className="space-y-2">
              <Label htmlFor="verified-sqft">Verified Square Footage *</Label>
              <Input
                id="verified-sqft"
                type="number"
                placeholder="e.g., 2485"
                value={verifiedSqft}
                onChange={(e) => setVerifiedSqft(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the total roof area from the measurement report
              </p>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Upload File *</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">{file.name}</span>
                    </div>
                  ) : (
                    <>
                      <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Drag & drop or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports: PDF, JPG, PNG (max 20MB)
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information about this report..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
