import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Search, Loader2, RefreshCw, Eye, Trash2, RotateCcw, 
  CheckCircle, Clock, AlertCircle, Brain, FileText, Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import TrainingDetailDialog from "./TrainingDetailDialog";

// Helper to detect stuck records (processing for more than 5 minutes)
const isStuck = (sample: TrainingSample): boolean => {
  if (sample.processing_status !== "processing") return false;
  const createdAt = new Date(sample.created_at || Date.now()).getTime();
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  return createdAt < fiveMinutesAgo;
};

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
  extracted_documents: any | null;
  packet_structure: any;
  source_file_name: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "bg-amber-100 text-amber-800" },
  processing: { label: "Processing", icon: Loader2, color: "bg-blue-100 text-blue-800" },
  completed: { label: "Completed", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  failed: { label: "Failed", icon: AlertCircle, color: "bg-red-100 text-red-800" },
};

interface TrainingSamplesTableProps {
  refreshTrigger?: number;
}

export default function TrainingSamplesTable({ refreshTrigger }: TrainingSamplesTableProps) {
  const [samples, setSamples] = useState<TrainingSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countyFilter, setCountyFilter] = useState("all");
  const [selectedSample, setSelectedSample] = useState<TrainingSample | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [retryingFailed, setRetryingFailed] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);

  // Calculate counts for failed and stuck records
  const failedOrStuckCount = samples.filter(s => 
    s.processing_status === "failed" || isStuck(s)
  ).length;

  useEffect(() => {
    fetchSamples();
  }, [refreshTrigger]);

  // Cleanup stuck records on mount
  useEffect(() => {
    const cleanupOrphanedRecords = async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from("permit_packet_training")
        .update({ 
          processing_status: "failed",
          admin_notes: "Cleanup: Marked as failed due to timeout (5+ min in processing)"
        })
        .eq("processing_status", "processing")
        .lt("created_at", fiveMinutesAgo)
        .select();

      if (!error && data && data.length > 0) {
        console.log(`[TrainingSamplesTable] Auto-cleaned ${data.length} stuck records`);
        fetchSamples();
      }
    };
    
    cleanupOrphanedRecords();
  }, []);

  // Real-time subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('training-samples-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'permit_packet_training'
        },
        (payload) => {
          console.log('[Realtime] Training sample changed:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            setSamples(prev => [payload.new as TrainingSample, ...prev]);
            toast.info("New training sample added");
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as TrainingSample;
            const old = payload.old as { processing_status?: string };
            
            setSamples(prev => prev.map(s => 
              s.id === updated.id ? updated : s
            ));
            
            // Show toast for status changes
            if (old.processing_status !== updated.processing_status) {
              if (updated.processing_status === 'completed') {
                toast.success(`AI analysis complete: ${updated.county || 'Sample'}`);
              } else if (updated.processing_status === 'failed') {
                toast.error(`Processing failed: ${updated.county || 'Sample'}`);
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string };
            setSamples(prev => prev.filter(s => s.id !== deleted.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("permit_packet_training")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSamples((data as TrainingSample[]) || []);
    } catch (error: any) {
      console.error("Error fetching samples:", error);
      toast.error("Failed to load training samples");
    } finally {
      setLoading(false);
    }
  };

  const getUniqueCounties = () => {
    const counties = [...new Set(samples.map((s) => s.county))];
    return counties.sort();
  };

  const filteredSamples = samples.filter((sample) => {
    const matchesSearch =
      sample.county?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.trade_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.example_description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || sample.processing_status === statusFilter;
    const matchesCounty = countyFilter === "all" || sample.county === countyFilter;

    return matchesSearch && matchesStatus && matchesCounty;
  });

  const handleReanalyze = async (sample: TrainingSample) => {
    try {
      toast.info("Downloading and re-analyzing packet...");
      
      await supabase
        .from("permit_packet_training")
        .update({ processing_status: "processing" })
        .eq("id", sample.id);

      // Download the file from storage to get actual content
      let fileContent: string | null = null;
      if (sample.file_url) {
        try {
          // Extract storage path from URL
          const urlParts = sample.file_url.split("/permit-training-packets/");
          if (urlParts.length > 1) {
            const storagePath = decodeURIComponent(urlParts[1].split("?")[0]);
            console.log(`[ReAnalyze] Downloading file from path: ${storagePath}`);
            
            const { data: blob, error: downloadError } = await supabase.storage
              .from("permit-training-packets")
              .download(storagePath);
            
            if (downloadError) {
              console.warn(`[ReAnalyze] Download error:`, downloadError);
            } else if (blob) {
              const arrayBuffer = await blob.arrayBuffer();
              const bytes = new Uint8Array(arrayBuffer);
              let binary = "";
              for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              fileContent = btoa(binary);
              console.log(`[ReAnalyze] File downloaded, size: ${bytes.length} bytes`);
            }
          }
        } catch (dlError) {
          console.warn("[ReAnalyze] Could not download file:", dlError);
        }
      }

      const { error } = await supabase.functions.invoke("permit-packet-analyzer", {
        body: { 
          mode: "analyze_only",
          trainingId: sample.id, 
          fileUrl: sample.file_url,
          fileContent,
          fileName: sample.source_file_name
        },
      });

      if (error) throw error;
      
      toast.success("Re-analysis complete!");
      fetchSamples();
    } catch (error: any) {
      console.error("Reanalysis error:", error);
      toast.error("Failed to re-analyze");
      // Reset status on error
      await supabase
        .from("permit_packet_training")
        .update({ processing_status: "failed", admin_notes: `Re-analysis error: ${error.message}` })
        .eq("id", sample.id);
    }
  };

  const handleDelete = async (sample: TrainingSample) => {
    if (!confirm("Are you sure you want to delete this training sample?")) return;

    try {
      const { error } = await supabase
        .from("permit_packet_training")
        .delete()
        .eq("id", sample.id);

      if (error) throw error;

      toast.success("Training sample deleted");
      fetchSamples();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete");
    }
  };

  const handleViewDetail = (sample: TrainingSample) => {
    setSelectedSample(sample);
    setDetailOpen(true);
  };

  const handleRetryAllFailed = async () => {
    const failedSamples = samples.filter(s => 
      s.processing_status === "failed" || isStuck(s)
    );
    
    if (failedSamples.length === 0) {
      toast.info("No failed or stuck records to retry");
      return;
    }

    setRetryingFailed(true);
    let successCount = 0;
    let errorCount = 0;
    
    toast.info(`Retrying ${failedSamples.length} records with file download...`);

    for (const sample of failedSamples) {
      try {
        // Reset status first
        await supabase
          .from("permit_packet_training")
          .update({ 
            processing_status: "processing",
            admin_notes: `Retry initiated at ${new Date().toISOString()}`
          })
          .eq("id", sample.id);
        
        // Download the file to get content
        let fileContent: string | null = null;
        if (sample.file_url) {
          try {
            const urlParts = sample.file_url.split("/permit-training-packets/");
            if (urlParts.length > 1) {
              const storagePath = decodeURIComponent(urlParts[1].split("?")[0]);
              const { data: blob, error: downloadError } = await supabase.storage
                .from("permit-training-packets")
                .download(storagePath);
              
              if (!downloadError && blob) {
                const arrayBuffer = await blob.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);
                let binary = "";
                for (let i = 0; i < bytes.length; i++) {
                  binary += String.fromCharCode(bytes[i]);
                }
                fileContent = btoa(binary);
              }
            }
          } catch (dlError) {
            console.warn(`[RetryAll] Could not download file for ${sample.id}:`, dlError);
          }
        }
        
        // Invoke the analyzer with file content
        const { error } = await supabase.functions.invoke("permit-packet-analyzer", {
          body: { 
            mode: "analyze_only",
            trainingId: sample.id, 
            fileUrl: sample.file_url,
            fileContent,
            fileName: sample.source_file_name
          }
        });

        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error(`Retry failed for ${sample.id}:`, error);
        errorCount++;
      }
    }
    
    toast.success(`Retried ${successCount} of ${failedSamples.length} records${errorCount > 0 ? ` (${errorCount} errors)` : ""}`);
    setRetryingFailed(false);
    fetchSamples();
  };

  const handleCleanupStuck = async () => {
    setCleaningUp(true);
    try {
      const { data, error } = await supabase.rpc("cleanup_stuck_training_records");
      
      if (error) throw error;
      
      const count = data as number;
      if (count > 0) {
        toast.success(`Cleaned up ${count} stuck records`);
        fetchSamples();
      } else {
        toast.info("No stuck records found");
      }
    } catch (error: any) {
      console.error("Cleanup error:", error);
      toast.error("Failed to cleanup stuck records");
    } finally {
      setCleaningUp(false);
    }
  };

  const getQualityBadge = (score: number | null) => {
    if (score === null) return null;
    const percent = Math.round(score * 100);
    let color = "bg-gray-100 text-gray-800";
    if (percent >= 80) color = "bg-green-100 text-green-800";
    else if (percent >= 60) color = "bg-amber-100 text-amber-800";
    else color = "bg-red-100 text-red-800";
    return <Badge className={color}>{percent}%</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Training Samples ({filteredSamples.length})
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search samples..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <Select value={countyFilter} onValueChange={setCountyFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="County" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counties</SelectItem>
                  {getUniqueCounties().map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              {failedOrStuckCount > 0 && (
                <Button 
                  variant="outline" 
                  onClick={handleRetryAllFailed}
                  disabled={retryingFailed}
                  className="text-amber-600 border-amber-300 hover:bg-amber-50"
                >
                  {retryingFailed ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Retry Failed ({failedOrStuckCount})
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCleanupStuck}
                disabled={cleaningUp}
                title="Cleanup stuck records"
              >
                {cleaningUp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
              </Button>
              <Button variant="outline" size="icon" onClick={fetchSamples}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSamples.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No training samples found.</p>
              <p className="text-sm">Upload your first completed permit packet above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>County / City</TableHead>
                    <TableHead>Trade</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSamples.map((sample) => {
                    const statusConfig = STATUS_CONFIG[sample.processing_status] || STATUS_CONFIG.pending;
                    const StatusIcon = statusConfig.icon;

                    return (
                      <TableRow key={sample.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{sample.county}</p>
                            {sample.city && (
                              <p className="text-sm text-muted-foreground">{sample.city}</p>
                            )}
                            {sample.is_hvhz && (
                              <Badge variant="outline" className="text-xs mt-1">HVHZ</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {sample.trade_type?.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground capitalize">
                          {sample.material_type?.replace("_", " ") || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig.color} flex items-center gap-1 w-fit`}>
                            <StatusIcon className={`h-3 w-3 ${sample.processing_status === "processing" ? "animate-spin" : ""}`} />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getQualityBadge(sample.quality_score)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {sample.training_usage_count || 0}x
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sample.uploaded_at
                            ? formatDistanceToNow(new Date(sample.uploaded_at), { addSuffix: true })
                            : formatDistanceToNow(new Date(sample.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetail(sample)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(sample.processing_status === "failed" || sample.processing_status === "completed") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReanalyze(sample)}
                                title="Re-analyze"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(sample)}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TrainingDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        sample={selectedSample}
        onUpdate={fetchSamples}
      />
    </>
  );
}
