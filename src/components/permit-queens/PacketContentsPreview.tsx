import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2, AlertTriangle, Shield, Package, Loader2, Search, Upload, Sparkles, RotateCw } from 'lucide-react';
import { useResolvedRequiredForms, type ResolvedItem } from '@/hooks/useResolvedRequiredForms';
import { runAutoFill, type AutoFillProgress } from '@/lib/permitAutoFill';
import { cn } from '@/lib/utils';

interface PacketContentsPreviewProps {
  /** Preferred: when provided, the resolver edge function drives the contents list. */
  permitProjectId?: string | null;
  /** Legacy fallback (kept so other callers still compile while migrating). */
  jurisdictionCounty?: string;
  permitType?: string;
  isHVHZ?: boolean;
  uploadedDocTypes?: string[];
  onUploadClick?: (docType: string) => void;
  /** When true (default), auto-runs the AI form filler on mount for items that need it. */
  autoFill?: boolean;
}

const STATUS_BADGE: Record<ResolvedItem['status'], { label: string; cls: string; icon: any }> = {
  included: { label: 'Included', cls: 'bg-green-500/10 text-green-700 border-green-200', icon: CheckCircle2 },
  pending: { label: 'Pending', cls: 'bg-amber-500/10 text-amber-700 border-amber-200', icon: FileText },
  upload_required: { label: 'Upload required', cls: 'bg-destructive/10 text-destructive border-destructive/30', icon: AlertTriangle },
  sourcing: { label: 'Auto-sourcing', cls: 'bg-purple-500/10 text-purple-700 border-purple-200', icon: Search },
  missing_pdf: { label: 'Missing PDF', cls: 'bg-destructive/10 text-destructive border-destructive/30', icon: AlertTriangle },
};

export function PacketContentsPreview({
  permitProjectId,
  isHVHZ,
  uploadedDocTypes = [],
  onUploadClick,
  autoFill = true,
}: PacketContentsPreviewProps) {
  const { items, projectHash, loading, error, refresh } = useResolvedRequiredForms(permitProjectId);
  const [progress, setProgress] = useState<AutoFillProgress | null>(null);
  const [currentName, setCurrentName] = useState<string | undefined>();
  const [failedKeys, setFailedKeys] = useState<Set<string>>(new Set());
  const [filling, setFilling] = useState(false);

  // Kick off AI auto-fill when items resolve (one shot per project hash)
  useEffect(() => {
    if (!autoFill || !permitProjectId || !projectHash || filling || loading) return;
    const needsWork = items.some(
      (i) => i.template_id && i.field_mapping && i.source === 'auto_fill' && i.cached_hash !== projectHash,
    );
    if (!needsWork) return;

    let cancelled = false;
    (async () => {
      setFilling(true);
      const results = await runAutoFill(permitProjectId, items, projectHash, (p, name) => {
        if (cancelled) return;
        setProgress(p);
        setCurrentName(name);
      });
      if (cancelled) return;
      const failed = new Set(results.filter((r) => !r.ok).map((r) => r.item.key));
      setFailedKeys(failed);
      setFilling(false);
      setCurrentName(undefined);
      await refresh();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permitProjectId, projectHash, autoFill]);

  const retryFailed = async () => {
    if (!permitProjectId || !projectHash) return;
    const targets = items.filter((i) => failedKeys.has(i.key));
    setFilling(true);
    const results = await runAutoFill(permitProjectId, targets, projectHash, (p, name) => {
      setProgress(p);
      setCurrentName(name);
    });
    const stillFailed = new Set(results.filter((r) => !r.ok).map((r) => r.item.key));
    setFailedKeys(stillFailed);
    setFilling(false);
    setCurrentName(undefined);
    await refresh();
  };

  // Mark "upload_required" status for user_upload items the user hasn't uploaded yet
  const enriched = items.map((item) => {
    if (item.source === 'user_upload') {
      const t = (item.doc_type || '').toLowerCase();
      const hasUpload = uploadedDocTypes.some((u) => (u || '').toLowerCase() === t);
      return { ...item, status: hasUpload ? ('included' as const) : ('upload_required' as const) };
    }
    return item;
  });

  const readyCount = enriched.filter((d) => d.status === 'included').length;
  const missingCount = enriched.filter((d) => d.status === 'upload_required' || d.status === 'missing_pdf').length;

  if (loading && items.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Resolving required forms...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div>
              <p className="font-medium">Couldn't load packet contents</p>
              <p className="text-xs mt-1">{error}</p>
              <Button size="sm" variant="outline" onClick={refresh} className="mt-2">Retry</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          Packet Contents
        </CardTitle>
        <CardDescription>
          {readyCount} of {enriched.length} documents ready
          {missingCount > 0 && ` • ${missingCount} need attention`}
        </CardDescription>
        {filling && progress && (
          <div className="flex items-center gap-2 text-xs text-primary mt-2">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            AI-filling form {progress.completed + 1} of {progress.total}
            {currentName ? ` — ${currentName}` : ''}
            {progress.failed > 0 && <span className="text-destructive ml-1">({progress.failed} failed)</span>}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {enriched.sort((a, b) => a.order - b.order).map((doc) => {
            const cfg = STATUS_BADGE[doc.status];
            const Icon = cfg.icon;
            const failed = failedKeys.has(doc.key);
            return (
              <div
                key={doc.key}
                className={cn(
                  'flex items-center justify-between p-2.5 rounded-lg border text-sm',
                  doc.status === 'included' && 'bg-muted/30 border-border',
                  doc.status === 'pending' && 'bg-amber-500/5 border-amber-200',
                  (doc.status === 'upload_required' || doc.status === 'missing_pdf') && 'bg-destructive/5 border-destructive/20',
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={cn('h-4 w-4 shrink-0', doc.status === 'included' ? 'text-green-600' : doc.status === 'upload_required' ? 'text-destructive' : 'text-amber-500')} />
                  <div className="min-w-0">
                    <div className="truncate">{doc.template_name ?? doc.doc_type}</div>
                    {failed && (
                      <div className="text-[11px] text-destructive mt-0.5">AI fill failed</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', cfg.cls)}>{cfg.label}</Badge>
                  {doc.source === 'auto_fill' && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Smart Form</Badge>
                  )}
                  {doc.source === 'auto_source' && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-purple-500/10 text-purple-700 border-purple-200">Auto-sourced</Badge>
                  )}
                  {doc.source === 'generated' && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Auto-generated</Badge>
                  )}
                  {failed && (
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={retryFailed}>
                      <RotateCw className="h-3 w-3 mr-1" /> Retry
                    </Button>
                  )}
                  {doc.status === 'upload_required' && onUploadClick && (
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => onUploadClick(doc.doc_type)}>
                      <Upload className="h-3 w-3 mr-1" /> Upload
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {isHVHZ && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-md">
            <Shield className="h-3.5 w-3.5 shrink-0" />
            HVHZ zone — all products must have valid NOA approvals
          </div>
        )}
      </CardContent>
    </Card>
  );
}
