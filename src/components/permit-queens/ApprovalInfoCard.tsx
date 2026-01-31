import { useState } from 'react';
import { ProductApproval } from '@/hooks/useProductApprovals';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, X, FileText, ShieldCheck, Calendar, Eye, AlertTriangle 
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PDFViewerDialog } from '@/components/ui/PDFViewerDialog';

interface ApprovalInfoCardProps {
  product: ProductApproval;
  isHVHZ: boolean;
  onRemove?: () => void;
  showRemoveButton?: boolean;
  isExpired?: (product: ProductApproval) => boolean;
  isExpiringSoon?: (product: ProductApproval) => boolean;
}

export function ApprovalInfoCard({
  product,
  isHVHZ,
  onRemove,
  showRemoveButton = true,
  isExpired,
  isExpiringSoon,
}: ApprovalInfoCardProps) {
  const [viewingPdf, setViewingPdf] = useState(false);
  const expired = isExpired?.(product) ?? false;
  const expiringSoon = isExpiringSoon?.(product) ?? false;

  // Determine which approval to display based on HVHZ status
  const getApprovalDisplay = () => {
    if (isHVHZ && product.noa_number) {
      return {
        type: 'NOA',
        number: product.noa_number,
        color: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
      };
    }
    if (product.fl_product_approval) {
      return {
        type: 'FL Product Approval',
        number: product.fl_product_approval,
        color: 'bg-green-500/10 text-green-700 border-green-500/20',
      };
    }
    if (product.noa_number) {
      return {
        type: 'NOA',
        number: product.noa_number,
        color: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
      };
    }
    return null;
  };

  const approval = getApprovalDisplay();

  const getExpirationStatus = () => {
    if (!product.expiration_date) return null;
    
    if (expired) {
      return {
        label: 'Expired',
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
      };
    }
    if (expiringSoon) {
      return {
        label: 'Expiring Soon',
        color: 'text-amber-600',
        bgColor: 'bg-amber-500/10',
      };
    }
    return {
      label: format(new Date(product.expiration_date), 'MMM yyyy'),
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
    };
  };

  const expirationStatus = getExpirationStatus();

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              {/* Product Name & Manufacturer */}
              <div>
                <p className="font-medium text-sm">{product.product_name}</p>
                <p className="text-xs text-muted-foreground">{product.manufacturer}</p>
              </div>

              {/* Approval Badges */}
              <div className="flex flex-wrap gap-1.5">
                {approval && (
                  <Badge variant="outline" className={cn("text-xs px-2 py-0.5", approval.color)}>
                    <FileText className="h-3 w-3 mr-1" />
                    {approval.type}: {approval.number}
                  </Badge>
                )}

                {product.hvhz_approved && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-600 border-blue-500/20"
                  >
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    HVHZ Approved
                  </Badge>
                )}

                {expirationStatus && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs px-2 py-0.5",
                      expirationStatus.bgColor,
                      expirationStatus.color
                    )}
                  >
                    {expired || expiringSoon ? (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    ) : (
                      <Calendar className="h-3 w-3 mr-1" />
                    )}
                    {expired ? 'Expired' : expiringSoon ? 'Expiring Soon' : `Expires: ${expirationStatus.label}`}
                  </Badge>
                )}
              </div>

              {/* View PDF Button */}
              {product.file_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setViewingPdf(true)}
                >
                  <Eye className="h-3 w-3" />
                  View {isHVHZ && product.noa_number ? 'NOA' : 'Approval'} PDF
                </Button>
              )}
            </div>
          </div>

          {showRemoveButton && onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>

      {/* Inline PDF Viewer */}
      <PDFViewerDialog
        open={viewingPdf}
        onOpenChange={setViewingPdf}
        url={product.file_url || ''}
        title={`${product.product_name} - ${isHVHZ && product.noa_number ? 'NOA' : 'Approval'}`}
        filename={`${product.noa_number || product.fl_product_approval || 'approval'}.pdf`}
      />
    </Card>
  );
}
