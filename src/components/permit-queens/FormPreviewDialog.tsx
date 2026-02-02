import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FormPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName: string;
  documentType: 'permit_app' | 'noc' | 'hvhz_disclosure' | 'roof_wall_affidavit' | 'hoa_affidavit';
  formData: {
    property_address?: string;
    owner_name?: string;
    owner_email?: string;
    owner_phone?: string;
    valuation?: number;
    scope_description?: string;
  };
  jurisdiction: string;
  permitType: string;
}

export function FormPreviewDialog({
  open,
  onOpenChange,
  documentId,
  documentName,
  documentType,
  formData,
  jurisdiction,
  permitType,
}: FormPreviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const generatePreview = async () => {
    setLoading(true);
    setPreviewError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('permit-form-preview', {
        body: {
          documentType,
          jurisdiction,
          permitType,
          formData,
        },
      });

      if (error) throw error;
      
      if (data?.previewUrl) {
        setPreviewUrl(data.previewUrl);
      } else if (data?.previewHtml) {
        // Create a blob URL for HTML preview
        const blob = new Blob([data.previewHtml], { type: 'text/html' });
        setPreviewUrl(URL.createObjectURL(blob));
      } else {
        throw new Error('No preview generated');
      }
    } catch (error) {
      console.error('Preview error:', error);
      setPreviewError('Unable to generate preview. The form will be filled when you generate the final packet.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !previewUrl && !loading) {
      generatePreview();
    }
    if (!newOpen) {
      // Clean up blob URL if created
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setPreviewError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {documentName}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Auto-Filled
            </Badge>
            Preview of form with your data filled in
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-[400px] border rounded-lg bg-muted/50 overflow-hidden">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating preview...</p>
            </div>
          )}
          
          {previewError && (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-6">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">Preview Unavailable</p>
                <p className="text-sm text-muted-foreground mt-1">{previewError}</p>
              </div>
              <Button variant="outline" onClick={generatePreview}>
                Try Again
              </Button>
            </div>
          )}
          
          {!loading && !previewError && previewUrl && (
            /* Use object tag with iframe fallback for Chrome PDF plugin support */
            <object
              data={`${previewUrl}#toolbar=1&view=FitH`}
              type="application/pdf"
              className="w-full h-full min-h-[500px]"
            >
              <iframe 
                src={previewUrl} 
                className="w-full h-full min-h-[500px]" 
                title={`Preview: ${documentName}`}
                allow="fullscreen"
              />
            </object>
          )}
          
          {!loading && !previewError && !previewUrl && (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-6">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">Form Preview</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This form will be automatically filled with your project data
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-sm space-y-2 max-w-md">
                <p><strong>Address:</strong> {formData.property_address || 'Not entered'}</p>
                <p><strong>Owner:</strong> {formData.owner_name || 'Not entered'}</p>
                <p><strong>Jurisdiction:</strong> {jurisdiction || 'Not detected'}</p>
                <p><strong>Permit Type:</strong> {permitType || 'Not selected'}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {previewUrl && (
            <Button onClick={async () => {
              try {
                const response = await fetch(previewUrl);
                if (!response.ok) throw new Error('Download failed');
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `${documentName}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
              } catch (err) {
                console.error('Download error:', err);
              }
            }}>
              <Download className="h-4 w-4 mr-2" />
              Download Preview
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
