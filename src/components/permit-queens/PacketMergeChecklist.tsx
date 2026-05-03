import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2, AlertTriangle, XCircle, Loader2, RefreshCw, Search, FileText, Sparkles,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface MergeDocument {
  type: string;
  name: string;
  status: string; // 'included' | 'generated' | 'auto_sourced' | 'needs_signature' | 'needs_sourcing' | 'failed_fetch' | 'missing' | 'not_required' | 'city_specific' | 'conditional'
  source?: string;
  noaNumber?: string;
  manufacturer?: string;
  productName?: string;
  fetchError?: string;
  fetchSource?: 'primary' | 'fallback';
  merged?: boolean;
  mergedPages?: number;
  pages?: number;
}

interface Props {
  permitRequestId: string;
  documents: MergeDocument[];
  selectedProducts?: any[];
  onUpdated?: (docs: MergeDocument[], packetUrl?: string | null) => void;
}

type Bucket = 'merged' | 'queued' | 'failed' | 'sourcing' | 'skipped';

function bucketFor(d: MergeDocument): Bucket {
  if (d.status === 'failed_fetch') return 'failed';
  if (d.status === 'needs_sourcing' || d.status === 'missing') return 'sourcing';
  if (d.status === 'not_required' || d.status === 'city_specific' || d.status === 'conditional') return 'skipped';
  if (d.merged === false) return 'failed';
  if (d.merged || d.status === 'included' || d.status === 'auto_sourced' || d.status === 'generated' || d.status === 'needs_signature') return 'merged';
  return 'queued';
}

function StatusBadge({ doc }: { doc: MergeDocument }) {
  const b = bucketFor(doc);
  if (b === 'merged') {
    return (
      <Badge className="bg-green-500/10 text-green-700 border-green-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Merged{doc.mergedPages ? ` (${doc.mergedPages}p)` : ''}
      </Badge>
    );
  }
  if (b === 'failed') {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Failed fetch
      </Badge>
    );
  }
  if (b === 'sourcing') {
    return (
      <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 gap-1">
        <AlertTriangle className="h-3 w-3" />
        Needs sourcing
      </Badge>
    );
  }
  if (b === 'skipped') {
    return <Badge variant="outline">Not required</Badge>;
  }
  return <Badge variant="secondary">Queued</Badge>;
}

export function PacketMergeChecklist({ permitRequestId, documents, selectedProducts = [], onUpdated }: Props) {
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});
  const [bulkRunning, setBulkRunning] = useState(false);

  const stats = useMemo(() => {
    const counts = { merged: 0, failed: 0, sourcing: 0, queued: 0, skipped: 0 };
    documents.forEach(d => { counts[bucketFor(d)]++; });
    return counts;
  }, [documents]);

  const total = documents.length - stats.skipped;

  const reassemble = async (label: string) => {
    const { data, error } = await supabase.functions.invoke('permit-packet-assembler', {
      body: {
        permitRequestId,
        generateCoverSheet: true,
        generateNOC: true,
        selectedProducts,
        usePacketStructure: true,
      },
    });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || `${label} failed`);
    onUpdated?.(data?.data?.documentIndex || [], data?.data?.packetPdfUrl);
    return data;
  };

  const handleRetryOne = async (doc: MergeDocument) => {
    const key = `${doc.type}:${doc.name}`;
    setRetrying(p => ({ ...p, [key]: true }));
    try {
      await reassemble('Retry');
      toast.success(`Re-ran merge for ${doc.name}`);
    } catch (e: any) {
      toast.error(e.message || 'Retry failed');
    } finally {
      setRetrying(p => ({ ...p, [key]: false }));
    }
  };

  const handleRetryAll = async () => {
    setBulkRunning(true);
    try {
      await reassemble('Bulk retry');
      toast.success('Re-merged packet with fallback sourcing');
    } catch (e: any) {
      toast.error(e.message || 'Bulk retry failed');
    } finally {
      setBulkRunning(false);
    }
  };

  const needsAction = stats.failed + stats.sourcing > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Packet Merge Status
            </CardTitle>
            <CardDescription>
              {stats.merged} of {total} merged
              {stats.failed > 0 && ` • ${stats.failed} failed`}
              {stats.sourcing > 0 && ` • ${stats.sourcing} need sourcing`}
            </CardDescription>
          </div>
          {needsAction && (
            <Button size="sm" onClick={handleRetryAll} disabled={bulkRunning} className="gap-1.5">
              {bulkRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Retry failed
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {documents.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Assemble the packet to see per-document merge results.
          </p>
        )}
        {documents.map((doc, idx) => {
          const key = `${doc.type}:${doc.name}:${idx}`;
          const b = bucketFor(doc);
          const isRetrying = !!retrying[`${doc.type}:${doc.name}`];
          return (
            <div
              key={key}
              className={cn(
                'flex items-start justify-between gap-3 p-2.5 rounded-lg border text-sm',
                b === 'merged' && 'bg-muted/30 border-border',
                b === 'failed' && 'bg-destructive/5 border-destructive/20',
                b === 'sourcing' && 'bg-amber-500/5 border-amber-200',
                b === 'queued' && 'bg-muted/20 border-border',
                b === 'skipped' && 'bg-muted/10 border-border opacity-70',
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{doc.name}</span>
                  {doc.fetchSource === 'fallback' && (
                    <Badge variant="outline" className="text-[10px] gap-1 border-blue-300 text-blue-700">
                      <Sparkles className="h-2.5 w-2.5" />
                      Fallback used
                    </Badge>
                  )}
                </div>
                {(doc.noaNumber || doc.manufacturer) && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {doc.noaNumber && <span>NOA {doc.noaNumber}</span>}
                    {doc.noaNumber && doc.manufacturer && <span> • </span>}
                    {doc.manufacturer && <span>{doc.manufacturer}</span>}
                  </p>
                )}
                {doc.fetchError && (
                  <p className="text-xs text-destructive mt-0.5 truncate">
                    {doc.fetchError}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <StatusBadge doc={doc} />
                {(b === 'failed' || b === 'sourcing') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRetryOne(doc)}
                    disabled={isRetrying || bulkRunning}
                    className="h-7 px-2"
                  >
                    {isRetrying ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
