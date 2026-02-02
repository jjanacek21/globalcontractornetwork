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
import { supabase } from '@/integrations/supabase/client';

interface PDFViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title?: string;
  filename?: string;
}

// Domains that need server-side proxy due to CORS/X-Frame-Options
const PROXY_REQUIRED_DOMAINS = [
  'miamidade.gov',
  'floridabuilding.org',
  '.gov/',
];

export function PDFViewerDialog({
  open,
  onOpenChange,
  url,
  title = 'Document Viewer',
  filename = 'document.pdf',
}: PDFViewerDialogProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [proxyAttempted, setProxyAttempted] = useState(false);
  const [fetchProgress, setFetchProgress] = useState<string>('');

  // Check if URL needs proxy
  const needsProxy = useCallback((targetUrl: string) => {
    if (!targetUrl) return false;
    const lowerUrl = targetUrl.toLowerCase();
    return PROXY_REQUIRED_DOMAINS.some(domain => lowerUrl.includes(domain));
  }, []);

  // Get domain name for display
  const getDomainName = useCallback((targetUrl: string): string => {
    try {
      const parsed = new URL(targetUrl);
      return parsed.hostname.replace('www.', '');
    } catch {
      return 'external source';
    }
  }, []);

  // Extract NOA number from Miami-Dade URL for search fallback
  const extractNoaNumber = useCallback((baseUrl: string): string | null => {
    if (!baseUrl || !baseUrl.includes('miamidade.gov')) return null;
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

  // Cleanup blob URL on unmount or URL change
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // Fetch PDF via proxy
  const fetchViaProxy = useCallback(async (targetUrl: string): Promise<string> => {
    const domain = getDomainName(targetUrl);
    setFetchProgress(`Fetching from ${domain}...`);
    
    const { data, error } = await supabase.functions.invoke('pdf-proxy', {
      body: { url: targetUrl },
    });

    if (error) {
      console.error('[PDFViewerDialog] Proxy error:', error);
      throw new Error(error.message || 'Failed to fetch document');
    }

    // The response should be a blob/arrayBuffer
    if (data instanceof ArrayBuffer || data instanceof Blob) {
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    }

    // If we got JSON error response
    if (typeof data === 'object' && data.error) {
      throw new Error(data.error);
    }

    throw new Error('Unexpected response from proxy');
  }, [getDomainName]);

  // Main load effect
  useEffect(() => {
    if (!open || !url) return;

    let cancelled = false;
    
    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      setProxyAttempted(false);
      setFetchProgress('');
      
      // Clean up previous blob URL
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }

      // Check if this URL needs proxy
      if (needsProxy(url)) {
        setProxyAttempted(true);
        try {
          const proxiedUrl = await fetchViaProxy(url);
          if (!cancelled) {
            setBlobUrl(proxiedUrl);
            setLoading(false);
          }
        } catch (err) {
          console.error('[PDFViewerDialog] Proxy fetch failed:', err);
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Failed to load document');
            setLoading(false);
          }
        }
      } else {
        // For non-proxy URLs, just set loading false and let iframe handle it
        // Set a timeout to auto-complete loading
        const timeout = setTimeout(() => {
          if (!cancelled) {
            setLoading(false);
          }
        }, 5000);
        
        return () => clearTimeout(timeout);
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [open, url, needsProxy, fetchViaProxy, blobUrl]);

  const handleIframeLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    if (!proxyAttempted && needsProxy(url)) {
      // Try proxy as fallback
      setProxyAttempted(true);
      fetchViaProxy(url)
        .then(proxiedUrl => {
          setBlobUrl(proxiedUrl);
          setLoading(false);
        })
        .catch(err => {
          setError(err instanceof Error ? err.message : 'Failed to load document');
          setLoading(false);
        });
    } else {
      setError('Failed to load document. Try opening in a new tab.');
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setError(null);
    setLoading(true);
    setProxyAttempted(false);
    
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }

    if (needsProxy(url)) {
      try {
        const proxiedUrl = await fetchViaProxy(url);
        setBlobUrl(proxiedUrl);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
        setLoading(false);
      }
    } else {
      // For direct URLs, just reload
      setTimeout(() => setLoading(false), 3000);
    }
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
      let downloadBlob: Blob;

      // If we already have a blob URL from proxy, use that
      if (blobUrl) {
        const response = await fetch(blobUrl);
        downloadBlob = await response.blob();
      } else if (needsProxy(url)) {
        // Fetch via proxy for download
        const response = await supabase.functions.invoke('pdf-proxy', {
          body: { url },
        });
        
        if (response.error) throw new Error(response.error.message);
        
        if (response.data instanceof ArrayBuffer || response.data instanceof Blob) {
          downloadBlob = response.data instanceof Blob 
            ? response.data 
            : new Blob([response.data], { type: 'application/pdf' });
        } else {
          throw new Error('Failed to download document');
        }
      } else {
        // Direct fetch for non-proxy URLs
        const response = await fetch(url);
        if (!response.ok) throw new Error('Download failed');
        downloadBlob = await response.blob();
      }

      const downloadUrl = URL.createObjectURL(downloadBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      
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

  // Determine which URL to display in iframe
  const displayUrl = blobUrl || url;
  const isExternalGov = needsProxy(url);
  const noaNumber = extractNoaNumber(url);

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
                  {fetchProgress || 'Loading document...'}
                </p>
                {isExternalGov && (
                  <p className="text-xs text-muted-foreground">
                    Fetching from {getDomainName(url)}
                  </p>
                )}
              </div>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4 p-4 max-w-md">
                <p className="text-destructive font-medium">
                  {isExternalGov ? 'Document Not Found or Unavailable' : 'Failed to load document'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {error}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button variant="outline" onClick={handleRetry}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={handleOpenInNewTab}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                  {isExternalGov && noaNumber && (
                    <Button variant="outline" asChild>
                      <a 
                        href={getMiamiDadeSearchUrl(noaNumber)} 
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
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title={title}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              allow="fullscreen"
            />
          )}
        </div>

        <DialogFooter className="px-4 py-3 border-t flex-shrink-0">
          <div className="flex items-center gap-2 w-full justify-between">
            <span className="text-xs text-muted-foreground truncate max-w-[250px]">
              {blobUrl && 'Loaded via secure proxy • '}
              {isExternalGov && getDomainName(url)}
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
