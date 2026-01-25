import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, FileText, Loader2, CheckCircle, AlertCircle, 
  X, RefreshCw, Trash2, Eye, ChevronDown, ChevronUp
} from "lucide-react";
import { usePermitBatchUpload, QueuedFile } from "@/hooks/usePermitBatchUpload";
import { cn } from "@/lib/utils";

interface PermitBatchUploaderProps {
  onBatchComplete?: () => void;
}

const FLORIDA_COUNTIES = [
  "Broward", "Miami-Dade", "Palm Beach", "Monroe", "Martin", 
  "St. Lucie", "Indian River", "Brevard", "Orange", "Hillsborough"
];

const TRADE_TYPES = [
  { value: "roofing", label: "Roofing" },
  { value: "electrical", label: "Electrical" },
  { value: "solar", label: "Solar" },
  { value: "windows_doors", label: "Windows & Doors" },
  { value: "mechanical", label: "Mechanical/HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "fencing", label: "Fencing" },
  { value: "pool", label: "Pool" },
  { value: "structural", label: "Structural" },
  { value: "general", label: "General" },
];

const MATERIAL_TYPES: Record<string, { value: string; label: string }[]> = {
  roofing: [
    { value: "shingle", label: "Shingle" },
    { value: "tile", label: "Tile" },
    { value: "metal", label: "Metal" },
    { value: "flat", label: "Flat/Built-up" },
    { value: "tpo", label: "TPO" },
    { value: "epdm", label: "EPDM" },
    { value: "coating", label: "Coating" },
    { value: "modified_bitumen", label: "Modified Bitumen" },
  ],
  windows_doors: [
    { value: "impact_windows", label: "Impact Windows" },
    { value: "impact_doors", label: "Impact Doors" },
    { value: "non_impact", label: "Non-Impact" },
    { value: "aluminum", label: "Aluminum" },
    { value: "vinyl", label: "Vinyl" },
    { value: "wood", label: "Wood" },
  ],
};

function getStatusIcon(status: QueuedFile["status"]) {
  switch (status) {
    case "queued":
      return <FileText className="h-4 w-4 text-muted-foreground" />;
    case "uploading":
    case "analyzing":
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    case "ready":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "failed":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case "confirmed":
      return <CheckCircle className="h-4 w-4 text-emerald-600" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function getStatusLabel(status: QueuedFile["status"]) {
  switch (status) {
    case "queued": return "Queued";
    case "uploading": return "Uploading...";
    case "analyzing": return "AI Scanning...";
    case "ready": return "Ready";
    case "failed": return "Failed";
    case "confirmed": return "Confirmed";
    default: return status;
  }
}

function getConfidenceBadge(confidence: number | undefined) {
  if (confidence === undefined) return null;
  
  if (confidence >= 0.8) {
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">High</Badge>;
  } else if (confidence >= 0.6) {
    return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">Med</Badge>;
  } else {
    return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">Low</Badge>;
  }
}

export default function PermitBatchUploader({ onBatchComplete }: PermitBatchUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const {
    queue,
    stats,
    isProcessing,
    addFiles,
    removeFile,
    clearQueue,
    updateOverride,
    processQueue,
    retryFailed,
    retryFile,
    confirmAll,
  } = usePermitBatchUpload({ onBatchComplete });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }, [addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  }, [addFiles]);

  const toggleRowExpanded = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getMaterialOptions = (tradeType: string | null | undefined) => {
    if (!tradeType) return [];
    return MATERIAL_TYPES[tradeType] || [];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Batch Upload with AI Auto-Detection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragOver 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
          onClick={() => document.getElementById("batch-file-input")?.click()}
        >
          <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-lg font-medium">Drop permit packets here</p>
          <p className="text-sm text-muted-foreground mt-1">
            Supports PDF, JPG, PNG • Up to 50MB each • Multiple files allowed
          </p>
          <Button variant="outline" className="mt-4">
            Browse Files
          </Button>
          <input
            id="batch-file-input"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Stats Bar */}
        {queue.length > 0 && (
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-4 text-sm">
              <span>Total: <strong>{stats.total}</strong></span>
              {stats.queued > 0 && <span className="text-muted-foreground">⏳ {stats.queued} queued</span>}
              {stats.processing > 0 && <span className="text-primary">🔍 {stats.processing} processing</span>}
              {stats.ready > 0 && <span className="text-green-600">✅ {stats.ready} ready</span>}
              {stats.failed > 0 && <span className="text-destructive">❌ {stats.failed} failed</span>}
              {stats.confirmed > 0 && <span className="text-emerald-600">✓ {stats.confirmed} confirmed</span>}
            </div>
            <div className="flex items-center gap-2">
              {stats.failed > 0 && (
                <Button variant="outline" size="sm" onClick={retryFailed}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry Failed
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={clearQueue} disabled={isProcessing}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        )}

        {/* Queue Table */}
        {queue.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium w-8"></th>
                    <th className="text-left py-2 px-3 font-medium">Status</th>
                    <th className="text-left py-2 px-3 font-medium">File</th>
                    <th className="text-left py-2 px-3 font-medium">County</th>
                    <th className="text-left py-2 px-3 font-medium">City</th>
                    <th className="text-left py-2 px-3 font-medium">Trade</th>
                    <th className="text-left py-2 px-3 font-medium">Material</th>
                    <th className="text-left py-2 px-3 font-medium w-16">HVHZ</th>
                    <th className="text-right py-2 px-3 font-medium w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item) => {
                    const isExpanded = expandedRows.has(item.id);
                    const isEditable = item.status === "ready";
                    const tradeType = item.overrides.trade_type ?? item.detected?.trade_type;
                    const materialOptions = getMaterialOptions(tradeType);

                    return (
                      <>
                        <tr key={item.id} className="border-t hover:bg-muted/30">
                          <td className="py-2 px-3">
                            {item.status === "ready" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleRowExpanded(item.id)}
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(item.status)}
                              <span className={cn(
                                item.status === "failed" && "text-destructive",
                                item.status === "confirmed" && "text-emerald-600"
                              )}>
                                {getStatusLabel(item.status)}
                              </span>
                            </div>
                            {(item.status === "uploading" || item.status === "analyzing") && (
                              <Progress value={item.progress} className="h-1 mt-1 w-20" />
                            )}
                          </td>
                          <td className="py-2 px-3 max-w-[200px] truncate" title={item.file.name}>
                            {item.file.name}
                          </td>
                          <td className="py-2 px-3">
                            {isEditable ? (
                              <div className="flex items-center gap-1">
                                <Select
                                  value={item.overrides.county ?? item.detected?.county ?? ""}
                                  onValueChange={(v) => updateOverride(item.id, "county", v)}
                                >
                                  <SelectTrigger className="h-8 w-32">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {FLORIDA_COUNTIES.map(c => (
                                      <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {getConfidenceBadge(item.confidence?.county)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {isEditable ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={item.overrides.city ?? item.detected?.city ?? ""}
                                  onChange={(e) => updateOverride(item.id, "city", e.target.value)}
                                  className="h-8 w-28"
                                  placeholder="City"
                                />
                                {getConfidenceBadge(item.confidence?.city)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {isEditable ? (
                              <div className="flex items-center gap-1">
                                <Select
                                  value={item.overrides.trade_type ?? item.detected?.trade_type ?? ""}
                                  onValueChange={(v) => updateOverride(item.id, "trade_type", v)}
                                >
                                  <SelectTrigger className="h-8 w-28">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {TRADE_TYPES.map(t => (
                                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {getConfidenceBadge(item.confidence?.trade_type)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {isEditable && materialOptions.length > 0 ? (
                              <div className="flex items-center gap-1">
                                <Select
                                  value={item.overrides.material_type ?? item.detected?.material_type ?? ""}
                                  onValueChange={(v) => updateOverride(item.id, "material_type", v)}
                                >
                                  <SelectTrigger className="h-8 w-28">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {materialOptions.map(m => (
                                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {getConfidenceBadge(item.confidence?.material_type)}
                              </div>
                            ) : isEditable ? (
                              <Input
                                value={item.overrides.material_type ?? item.detected?.material_type ?? ""}
                                onChange={(e) => updateOverride(item.id, "material_type", e.target.value)}
                                className="h-8 w-24"
                                placeholder="Material"
                              />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {isEditable ? (
                              <Checkbox
                                checked={item.overrides.is_hvhz ?? item.detected?.is_hvhz ?? false}
                                onCheckedChange={(v) => updateOverride(item.id, "is_hvhz", !!v)}
                              />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {item.status === "failed" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => retryFile(item.id)}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              )}
                              {item.storageUrl && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => window.open(item.storageUrl, "_blank")}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => removeFile(item.id)}
                                disabled={isProcessing && item.status !== "queued"}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {/* Expanded Details Row */}
                        {isExpanded && item.status === "ready" && (
                          <tr key={`${item.id}-details`} className="bg-muted/20">
                            <td colSpan={9} className="py-3 px-6">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="font-medium mb-1">Detection Sources:</p>
                                  <ul className="list-disc list-inside text-muted-foreground">
                                    {item.detectedFrom?.map((src, i) => (
                                      <li key={i}>{src}</li>
                                    )) || <li>No sources recorded</li>}
                                  </ul>
                                </div>
                                <div>
                                  <p className="font-medium mb-1">Matched Department:</p>
                                  <p className="text-muted-foreground">
                                    {item.matchedDepartment?.name || "No match found"}
                                  </p>
                                  {item.matchedDepartment?.portal_url && (
                                    <a 
                                      href={item.matchedDepartment.portal_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline text-xs"
                                    >
                                      View Portal →
                                    </a>
                                  )}
                                </div>
                                {item.rawTextSample && (
                                  <div className="col-span-2">
                                    <p className="font-medium mb-1">OCR Text Sample:</p>
                                    <p className="text-muted-foreground text-xs bg-muted/50 p-2 rounded max-h-20 overflow-y-auto">
                                      {item.rawTextSample}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                        {/* Error Row */}
                        {item.status === "failed" && item.error && (
                          <tr key={`${item.id}-error`} className="bg-destructive/5">
                            <td colSpan={9} className="py-2 px-6">
                              <p className="text-sm text-destructive">Error: {item.error}</p>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {queue.length > 0 && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              onClick={processQueue}
              disabled={isProcessing || stats.queued === 0}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Process {stats.queued > 0 ? `${stats.queued} Files` : "Queue"}
                </>
              )}
            </Button>
            <Button
              variant="default"
              onClick={confirmAll}
              disabled={isProcessing || stats.ready === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm {stats.ready} Ready
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
