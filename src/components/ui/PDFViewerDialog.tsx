import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Maximize2, Minimize2, RefreshCw, ExternalLink } from 'lucide-react';
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
  const [loadTimeout, setLoadTimeout] = useState<NodeJS.Timeout | null>(null);

  // Check if URL is from Miami-Dade or other external government site that needs Google viewer
  const isExternalGov = useCallback((baseUrl: string) => {
    if (!baseUrl) return false;
    return baseUrl.includes('miamidade.gov') || 
           baseUrl.includes('floridabuilding.org') ||
           baseUrl.includes('.gov/');
  }, []);

  // Extract NOA number from Miami-Dade URL for search fallback
  const extractNoaNumber = useCallback((baseUrl: string): string | null => {
    if (!baseUrl || !baseUrl.includes('miamidade.gov')) return null;
    // Match patterns like /noa/12345.pdf or /noa-documents/12345.pdf
    const match = baseUrl.match(/\/(?:noa|noa-documents)\/(\d+[-\d]*[A-Z]?)\.pdf$/i);
    return match ? match[1] : null;
  }, []);

  // Get Miami-Dade NOA search URL
  const getMiamiDadeSearchUrl = useCallback((noaNumber: string | null): string => {
    if (noaNumber) {
      return `https://www.miamidade.gov/apps/dpmbuilding/search/results.aspx?AdvancedSearch=Go&IncludeExpired=true&NOANumber=${noaNumber}`;
    }
    return 'https://www.miamidade.gov/building/product-control.asp';
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadTimeout) clearTimeout(loadTimeout);
    };
  }, [loadTimeout]);

  useEffect(() => {
    if (open && url) {
      setLoading(true);
      setError(false);
      setRetryCount(0);
      
      // For external government sites, immediately use Google viewer to avoid CORS issues
      const shouldUseGoogle = isExternalGov(url);
      setUseGoogleViewer(shouldUseGoogle);
      
      // Set a timeout to auto-complete loading after 8 seconds (in case onLoad doesn't fire)
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 8000);
      setLoadTimeout(timeout);
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
    if (loadTimeout) clearTimeout(loadTimeout);
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    console.log('[PDFViewerDialog] Load error, retry count:', retryCount, 'url:', url?.substring(0, 50));
    
    if (retryCount === 0 && !useGoogleViewer) {
      // First failure - try Google viewer
      setRetryCount(1);
      setUseGoogleViewer(true);
      setLoading(true);
    } else if (retryCount === 1) {
      // Second failure with Google viewer - try plain URL
      setRetryCount(2);
      setLoading(true);
      // Wait for potential slow loading
      const timeout = setTimeout(() => {
        setLoading(false);
        // Don't set error - the PDF might actually be displaying
      }, 5000);
      setLoadTimeout(timeout);
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
    
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 8000);
    setLoadTimeout(timeout);
  };

  const handleTryGoogleViewer = () => {
    setError(false);
    setLoading(true);
    setUseGoogleViewer(true);
    setRetryCount(0);
    
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 8000);
    setLoadTimeout(timeout);
  };

  const handleOpenInNewTab = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = async () => {
    if (!url) return;
    
    setDownloading(true);
    try {
      // For external government sites, use direct link since fetch may be blocked
      if (isExternalGov(url)) {
        // Create a link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.download = filename;
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download started in new tab');
        return;
      }
      
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
      // Fallback - open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.info('Opening document in new tab');
    } finally {
      setDownloading(false);
    }
  };

  if (!url) return null;

  // Determine which URL to use
  const displayUrl = useGoogleViewer 
    ? getGoogleViewerUrl(url) 
    : (retryCount >= 2 ? url : getPdfUrl(url));

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
              onClick={handleOpenInNewTab}
              className="h-8 w-8"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
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
                <p className="text-sm text-muted-foreground">
                  {useGoogleViewer ? 'Loading via Google Docs viewer...' : 'Loading document...'}
                </p>
                {isExternalGov(url) && (
                  <p className="text-xs text-muted-foreground">
                    External government document may take longer
                  </p>
                )}
              </div>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4 p-4 max-w-md">
                <p className="text-destructive font-medium">
                  {isExternalGov(url) ? 'Document Not Found or Unavailable' : 'Failed to load document'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isExternalGov(url) ? (
                    <>
                      This document may not exist on the government server, or it may be temporarily unavailable.
                      {extractNoaNumber(url) && ' Try searching for it directly on the official database.'}
                    </>
                  ) : (
                    'The PDF viewer couldn\'t display this document. You can try again, use Google Docs viewer, or open it in a new tab.'
                  )}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button variant="outline" onClick={handleRetry}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  {!useGoogleViewer && (
                    <Button variant="outline" onClick={handleTryGoogleViewer}>
                      Google Viewer
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleOpenInNewTab}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                  {isExternalGov(url) && extractNoaNumber(url) && (
                    <Button variant="outline" asChild>
                      <a 
                        href={getMiamiDadeSearchUrl(extractNoaNumber(url))} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Search Miami-Dade
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <iframe
              src={displayUrl}
              className="w-full h-full border-0"
              onLoad={handleLoad}
              onError={handleError}
              title={title}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              allow="fullscreen"
            />
          )}
        </div>

        <DialogFooter className="px-4 py-3 border-t flex-shrink-0">
          <div className="flex items-center gap-2 w-full justify-between">
            <span className="text-xs text-muted-foreground truncate max-w-[250px]">
              {useGoogleViewer && 'Using Google Docs viewer • '}
              {isExternalGov(url) && 'External document'}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={handleDownload} disabled={downloading}>
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