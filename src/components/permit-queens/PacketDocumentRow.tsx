import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  Eye,
  Upload,
  RefreshCw,
  Search,
  FilePen,
  Shield,
  Clock,
} from 'lucide-react';

export interface PacketDocument {
  order: number;
  type: string;
  name: string;
  source: 'auto_fill' | 'auto_source' | 'user_upload' | 'generated' | 'city_specific' | 'conditional';
  status: 'ready' | 'pending' | 'missing' | 'needs_signature' | 'needs_sourcing' | 'not_required';
  pages?: number;
  url?: string;
  noaNumber?: string;
  condition?: string;
  requiresNotary?: boolean;
  requiresRecording?: boolean;
  productCategory?: string;
}

interface PacketDocumentRowProps {
  document: PacketDocument;
  onPreview?: (doc: PacketDocument) => void;
  onUpload?: (doc: PacketDocument) => void;
  onRegenerate?: (doc: PacketDocument) => void;
  onSearch?: (doc: PacketDocument) => void;
}

const statusConfig = {
  ready: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-muted/30 border-border' },
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-200' },
  missing: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
  needs_signature: { icon: FilePen, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
  needs_sourcing: { icon: Search, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
  not_required: { icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted/20 border-border opacity-60' },
};

const sourceBadges: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  auto_fill: { label: 'Smart Form', variant: 'secondary' },
  auto_source: { label: 'Auto-Source', variant: 'secondary' },
  user_upload: { label: 'Upload', variant: 'outline' },
  generated: { label: 'Auto-Generated', variant: 'secondary' },
  city_specific: { label: 'City Form', variant: 'default' },
  conditional: { label: 'Conditional', variant: 'outline' },
};

export function PacketDocumentRow({ document: doc, onPreview, onUpload, onRegenerate, onSearch }: PacketDocumentRowProps) {
  const config = statusConfig[doc.status] || statusConfig.missing;
  const StatusIcon = config.icon;
  const sourceBadge = sourceBadges[doc.source] || sourceBadges.user_upload;

  return (
    <div className={cn('flex items-center justify-between p-3 rounded-lg border text-sm gap-2', config.bg)}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-xs font-mono text-muted-foreground w-5 text-right shrink-0">{doc.order}</span>
        <StatusIcon className={cn('h-4 w-4 shrink-0', config.color)} />
        <div className="min-w-0">
          <span className="truncate block font-medium">{doc.name}</span>
          {doc.noaNumber && (
            <span className="text-xs text-muted-foreground">NOA: {doc.noaNumber}</span>
          )}
          {doc.condition && doc.status === 'not_required' && (
            <span className="text-xs text-muted-foreground italic">Condition not met</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {doc.requiresNotary && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-orange-300 text-orange-700">
            <Shield className="h-2.5 w-2.5 mr-0.5" />
            Notary
          </Badge>
        )}
        {doc.pages && doc.pages > 0 && (
          <span className="text-[10px] text-muted-foreground">{doc.pages}pg</span>
        )}
        <Badge variant={sourceBadge.variant} className="text-[10px] px-1.5 py-0">
          {sourceBadge.label}
        </Badge>

        {/* Action buttons based on source */}
        {(doc.source === 'auto_fill' || doc.source === 'generated') && doc.status !== 'not_required' && (
          <>
            {onPreview && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onPreview(doc)}>
                <Eye className="h-3.5 w-3.5" />
              </Button>
            )}
            {onRegenerate && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRegenerate(doc)}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
          </>
        )}
        {doc.source === 'auto_source' && doc.status === 'needs_sourcing' && onSearch && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onSearch(doc)}>
            <Search className="h-3.5 w-3.5" />
          </Button>
        )}
        {doc.source === 'auto_source' && doc.status === 'ready' && onPreview && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onPreview(doc)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
        )}
        {doc.source === 'user_upload' && doc.status === 'missing' && onUpload && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUpload(doc)}>
            <Upload className="h-3.5 w-3.5" />
          </Button>
        )}
        {doc.source === 'user_upload' && doc.status === 'ready' && onPreview && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onPreview(doc)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
