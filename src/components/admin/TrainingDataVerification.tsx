import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Search, CheckCircle2, Flag, ExternalLink, FileText } from "lucide-react";
import { format } from "date-fns";

interface TrainingSession {
  id: string;
  created_at: string;
  address: string;
  normalized_address: string;
  property_type: string | null;
  service_type: string;
  ai_estimated_sqft: number | null;
  ai_confidence: string | null;
  final_accepted_sqft: number | null;
  ground_truth_sqft: number | null;
  ground_truth_source: string | null;
  is_usable_for_training: boolean | null;
  report_url: string | null;
  report_type: string | null;
  satellite_image_url: string | null;
}

const VERIFICATION_SOURCES = [
  { value: "contractor_onsite", label: "Contractor On-Site Measurement" },
  { value: "eagleview", label: "EagleView Report" },
  { value: "roofr", label: "RoofR Report" },
  { value: "drone", label: "Drone Measurement" },
  { value: "insurance", label: "Insurance/Xactimate Report" },
  { value: "blueprints", label: "As-Built / Blueprints" },
  { value: "other", label: "Other" },
];

const FLAG_REASONS = [
  { value: "poor_image", label: "Poor satellite image quality" },
  { value: "wrong_building", label: "Wrong building identified" },
  { value: "multiple_buildings", label: "Multiple buildings in frame" },
  { value: "bad_geocoding", label: "Incorrect address geocoding" },
  { value: "test_session", label: "Test/demo session" },
  { value: "other", label: "Other" },
];

export default function TrainingDataVerification() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);

  // Verification form state
  const [verifiedSqft, setVerifiedSqft] = useState("");
  const [verificationSource, setVerificationSource] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [markUnusable, setMarkUnusable] = useState(false);
  const [saving, setSaving] = useState(false);

  // Flag form state
  const [flagReason, setFlagReason] = useState("");
  const [flagNotes, setFlagNotes] = useState("");

  useEffect(() => {
    fetchSessions();
  }, [statusFilter]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("ai_training_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter === "pending") {
        query = query.is("ground_truth_sqft", null).neq("is_usable_for_training", false);
      } else if (statusFilter === "verified") {
        query = query.not("ground_truth_sqft", "is", null);
      } else if (statusFilter === "flagged") {
        query = query.eq("is_usable_for_training", false);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSessions((data || []) as TrainingSession[]);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProperty = propertyFilter === "all" || s.property_type === propertyFilter;
    return matchesSearch && matchesProperty;
  });

  const openVerifyDialog = (session: TrainingSession) => {
    setSelectedSession(session);
    setVerifiedSqft(session.ground_truth_sqft?.toString() || "");
    setVerificationSource(session.ground_truth_source || "");
    setVerificationNotes("");
    setMarkUnusable(false);
    setVerifyDialogOpen(true);
  };

  const openFlagDialog = (session: TrainingSession) => {
    setSelectedSession(session);
    setFlagReason("");
    setFlagNotes("");
    setFlagDialogOpen(true);
  };

  const handleVerify = async () => {
    if (!selectedSession) return;
    if (!verifiedSqft || !verificationSource) {
      toast.error("Please enter verified square footage and source");
      return;
    }

    setSaving(true);
    try {
      const sqft = parseFloat(verifiedSqft);
      const aiEstimate = selectedSession.ai_estimated_sqft || 0;
      const acceptedValue = selectedSession.final_accepted_sqft || 0;

      const aiError = aiEstimate > 0 ? ((aiEstimate - sqft) / sqft) * 100 : null;
      const acceptedError = acceptedValue > 0 ? ((acceptedValue - sqft) / sqft) * 100 : null;

      const { error } = await supabase
        .from("ai_training_sessions")
        .update({
          ground_truth_sqft: sqft,
          ground_truth_squares: sqft / 100,
          ground_truth_source: verificationSource,
          ground_truth_notes: verificationNotes || null,
          ground_truth_date: new Date().toISOString(),
          ai_error_percent: aiError,
          accepted_error_percent: acceptedError,
          is_usable_for_training: !markUnusable,
        })
        .eq("id", selectedSession.id);

      if (error) throw error;

      toast.success("Verification saved successfully");
      setVerifyDialogOpen(false);
      fetchSessions();
    } catch (error) {
      console.error("Error saving verification:", error);
      toast.error("Failed to save verification");
    } finally {
      setSaving(false);
    }
  };

  const handleFlag = async () => {
    if (!selectedSession || !flagReason) {
      toast.error("Please select a reason");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("ai_training_sessions")
        .update({
          is_usable_for_training: false,
          quality_notes: `[FLAGGED: ${flagReason}] ${flagNotes}`.trim(),
        })
        .eq("id", selectedSession.id);

      if (error) throw error;

      toast.success("Session flagged");
      setFlagDialogOpen(false);
      fetchSessions();
    } catch (error) {
      console.error("Error flagging session:", error);
      toast.error("Failed to flag session");
    } finally {
      setSaving(false);
    }
  };

  const getConfidenceBadge = (confidence: string | null) => {
    if (!confidence) return null;
    const level = confidence.toLowerCase();
    const variant = level === "high" ? "default" : level === "medium" ? "secondary" : "outline";
    return <Badge variant={variant}>{confidence}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Training Data Verification
          </CardTitle>
          <CardDescription>
            Add verified measurements as ground truth for AI training
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending Verification</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sessions Table */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No sessions found matching your criteria
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead className="text-right">AI Estimate</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead className="text-right">Accepted</TableHead>
                  <TableHead>Report</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {session.address}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(session.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {session.property_type && (
                        <Badge variant="outline">{session.property_type}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {session.ai_estimated_sqft?.toLocaleString() || "—"} sqft
                    </TableCell>
                    <TableCell>{getConfidenceBadge(session.ai_confidence)}</TableCell>
                    <TableCell className="text-right">
                      {session.final_accepted_sqft?.toLocaleString() || "—"} sqft
                    </TableCell>
                    <TableCell>
                      {session.report_url ? (
                        <Badge variant="secondary" className="gap-1">
                          <FileText className="h-3 w-3" />
                          {session.report_type || "Report"}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => openVerifyDialog(session)}>
                          Verify
                        </Button>
                        {statusFilter !== "flagged" && (
                          <Button size="sm" variant="outline" onClick={() => openFlagDialog(session)}>
                            <Flag className="h-4 w-4" />
                          </Button>
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

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Verify Measurement</DialogTitle>
            <DialogDescription className="truncate">
              {selectedSession?.address}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Session Details */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">AI Estimated:</span>
                <span className="font-medium">
                  {selectedSession?.ai_estimated_sqft?.toLocaleString() || "—"} sqft
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">AI Confidence:</span>
                <span>{getConfidenceBadge(selectedSession?.ai_confidence || null)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User Accepted:</span>
                <span className="font-medium">
                  {selectedSession?.final_accepted_sqft?.toLocaleString() || "—"} sqft
                </span>
              </div>
              {selectedSession?.satellite_image_url && (
                <a
                  href={selectedSession.satellite_image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Satellite Image
                </a>
              )}
            </div>

            {/* Verification Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verified-sqft">Verified Square Footage *</Label>
                <Input
                  id="verified-sqft"
                  type="number"
                  placeholder="e.g., 2485"
                  value={verifiedSqft}
                  onChange={(e) => setVerifiedSqft(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Verification Source *</Label>
                <Select value={verificationSource} onValueChange={setVerificationSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source..." />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_SOURCES.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes about this verification..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="mark-unusable"
                  checked={markUnusable}
                  onCheckedChange={(c) => setMarkUnusable(c === true)}
                />
                <Label htmlFor="mark-unusable" className="text-sm cursor-pointer">
                  Mark as unusable for training (e.g., bad data)
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerify} disabled={saving}>
              {saving ? "Saving..." : "Save Verification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flag Dialog */}
      <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Session</DialogTitle>
            <DialogDescription>
              Mark this session as unusable for AI training
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Select value={flagReason} onValueChange={setFlagReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  {FLAG_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flag-notes">Additional Notes</Label>
              <Textarea
                id="flag-notes"
                placeholder="Optional details..."
                value={flagNotes}
                onChange={(e) => setFlagNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleFlag} disabled={saving}>
              {saving ? "Flagging..." : "Flag Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
