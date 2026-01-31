import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PDFViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title?: string;
  filename?: string;
}

export function PDFViewerDialog({
  open,
  onOpenChange,
  url,
  title = 'Document Viewer',
  filename = 'document.pdf',
}: PDFViewerDialogProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [useGoogleViewer, setUseGoogleViewer] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Check if URL is from Miami-Dade or other external government site that needs Google viewer
  const isExternalGov = useCallback((baseUrl: string) => {
    if (!baseUrl) return false;
    return baseUrl.includes('miamidade.gov') || baseUrl.includes('floridabuilding.org');
  }, []);

  useEffect(() => {
    if (open && url) {
      setLoading(true);
      setError(false);
      // Auto-use Google viewer for external government sites (CORS issues)
      setUseGoogleViewer(isExternalGov(url));
      setRetryCount(0);
    }
  }, [open, url, isExternalGov]);

  // Add PDF viewer parameters for better rendering
  const getPdfUrl = useCallback((baseUrl: string) => {
    if (!baseUrl) return '';
    // Add PDF viewer parameters to help with rendering
    const separator = baseUrl.includes('#') ? '&' : '#';
    return `${baseUrl}${separator}toolbar=1&view=FitH&navpanes=0`;
  }, []);

  // Google Docs viewer fallback URL
  const getGoogleViewerUrl = useCallback((baseUrl: string) => {
    if (!baseUrl) return '';
    return `https://docs.google.com/viewer?url=${encodeURIComponent(baseUrl)}&embedded=true`;
  }, []);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    console.log('[PDFViewerDialog] Load error, retry count:', retryCount);
    
    if (retryCount === 0 && !useGoogleViewer) {
      // First failure - try without parameters
      setRetryCount(1);
      setLoading(true);
    } else if (retryCount === 1 && !useGoogleViewer) {
      // Second failure - the PDF might just be loading slowly, wait longer
      setRetryCount(2);
      // Set a timeout to stop loading after 5 more seconds
      setTimeout(() => {
        setLoading(false);
        // Don't set error - the PDF might actually be displaying
      }, 5000);
    } else {
      setLoading(false);
      setError(true);
    }
  };

  const handleRetry = () => {
    setError(false);
    setLoading(true);
    setRetryCount(0);
    setUseGoogleViewer(false);
  };

  const handleTryGoogleViewer = () => {
    setError(false);
    setLoading(true);
    setUseGoogleViewer(true);
    setRetryCount(0);
  };

  const handleDownload = async () => {
    if (!url) return;
    
    setDownloading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(blobUrl);
      toast.success('Download started');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download document');
    } finally {
      setDownloading(false);
    }
  };

  if (!url) return null;

  // Determine which URL to use
  const displayUrl = useGoogleViewer ? getGoogleViewerUrl(url) : (retryCount === 1 ? url : getPdfUrl(url));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "p-0 gap-0 flex flex-col",
          isFullscreen 
            ? "max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh]" 
            : "max-w-4xl w-full max-h-[85vh] h-[85vh]"
        )}
      >
        <DialogHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0 flex-shrink-0">
          <DialogTitle className="text-base font-medium truncate pr-4">
            {title}
          </DialogTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 relative bg-muted/30">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading document...</p>
              </div>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4 p-4">
                <p className="text-destructive font-medium">Failed to load document</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  The PDF viewer couldn't display this document. You can try again, use an alternative viewer, or download the file directly.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button variant="outline" onClick={handleRetry}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  {!useGoogleViewer && (
                    <Button variant="outline" onClick={handleTryGoogleViewer}>
                      Try Google Viewer
                    </Button>
                  )}
                  <Button onClick={handleDownload} disabled={downloading}>
                    {downloading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download Instead
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <object
              data={displayUrl}
              type="application/pdf"
              className="w-full h-full"
              onLoad={handleLoad}
            >
              {/* Fallback to iframe if object tag doesn't work */}
              <iframe
                src={displayUrl}
                className="w-full h-full border-0"
                onLoad={handleLoad}
                onError={handleError}
                title={title}
                sandbox="allow-scripts allow-same-origin"
              />
            </object>
          )}
        </div>

        <DialogFooter className="px-4 py-3 border-t flex-shrink-0">
          <div className="flex items-center gap-2 w-full justify-between">
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {useGoogleViewer && 'Using Google Docs viewer'}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={handleDownload} disabled={downloading || error}>
                {downloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
