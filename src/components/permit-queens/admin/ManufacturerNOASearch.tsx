import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PDFViewerDialog } from '@/components/ui/PDFViewerDialog';
import { 
  Search, 
  Building2, 
  FileText, 
  Download, 
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  FileDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NOAResult {
  noa_number: string;
  product_name: string;
  manufacturer: string;
  category: string;
  expiration_date: string | null;
  hvhz_approved: boolean;
  pdf_url: string | null;
  fl_approval_number?: string;
}

interface SearchState {
  isSearching: boolean;
  results: NOAResult[];
  error: string | null;
  searchedManufacturer: string;
}

export function ManufacturerNOASearch() {
  const [manufacturer, setManufacturer] = useState('');
  const [searchState, setSearchState] = useState<SearchState>({
    isSearching: false,
    results: [],
    error: null,
    searchedManufacturer: '',
  });
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [viewingPdf, setViewingPdf] = useState<{ url: string; title: string } | null>(null);

  const handleSearch = async () => {
    if (!manufacturer.trim()) {
      toast.error('Please enter a manufacturer name');
      return;
    }

    setSearchState({
      isSearching: true,
      results: [],
      error: null,
      searchedManufacturer: manufacturer.trim(),
    });
    setSelectedResults(new Set());

    try {
      // Call the edge function to search Miami-Dade NOA database
      const { data, error } = await supabase.functions.invoke('search-manufacturer-noas', {
        body: { manufacturer: manufacturer.trim() },
      });

      if (error) throw error;

      if (data?.success && data?.results) {
        setSearchState(prev => ({
          ...prev,
          isSearching: false,
          results: data.results,
        }));
        
        if (data.results.length === 0) {
          toast.info('No NOA products found for this manufacturer');
        } else {
          toast.success(`Found ${data.results.length} NOA products for ${manufacturer}`);
          // Select all by default
          setSelectedResults(new Set(data.results.map((r: NOAResult) => r.noa_number)));
        }
      } else {
        throw new Error(data?.error || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
        error: err instanceof Error ? err.message : 'Search failed',
      }));
      toast.error('Search failed', {
        description: err instanceof Error ? err.message : 'Check console for details',
      });
    }
  };

  const toggleSelection = (noaNumber: string) => {
    setSelectedResults(prev => {
      const next = new Set(prev);
      if (next.has(noaNumber)) {
        next.delete(noaNumber);
      } else {
        next.add(noaNumber);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedResults(new Set(searchState.results.map(r => r.noa_number)));
  };

  const deselectAll = () => {
    setSelectedResults(new Set());
  };

  const exportToCSV = () => {
    const selected = searchState.results.filter(r => selectedResults.has(r.noa_number));
    if (selected.length === 0) {
      toast.error('No products selected for export');
      return;
    }

    // Create CSV content
    const headers = ['noa_number', 'manufacturer', 'product_name', 'category', 'expiration_date', 'hvhz_approved', 'pdf_url', 'fl_product_approval'];
    const rows = selected.map(r => [
      r.noa_number,
      r.manufacturer,
      r.product_name,
      r.category,
      r.expiration_date || '',
      r.hvhz_approved ? 'true' : 'false',
      r.pdf_url || '',
      r.fl_approval_number || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${searchState.searchedManufacturer.replace(/\s+/g, '_')}_NOAs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${selected.length} products to CSV`);
  };

  const importToDatabase = async () => {
    const selected = searchState.results.filter(r => selectedResults.has(r.noa_number));
    if (selected.length === 0) {
      toast.error('No products selected for import');
      return;
    }

    setIsImporting(true);
    let imported = 0;
    let skipped = 0;
    let failed = 0;

    try {
      for (const product of selected) {
        try {
          // Check if already exists
          const { data: existing } = await supabase
            .from('product_approvals')
            .select('id')
            .eq('noa_number', product.noa_number)
            .maybeSingle();

          if (existing) {
            skipped++;
            continue;
          }

          // Insert new product
          const { error: insertError } = await supabase
            .from('product_approvals')
            .insert({
              noa_number: product.noa_number,
              manufacturer: product.manufacturer,
              product_name: product.product_name,
              product_category: product.category || 'Roofing',
              expiration_date: product.expiration_date,
              hvhz_approved: product.hvhz_approved,
              file_url: product.pdf_url,
              fl_product_approval: product.fl_approval_number || null,
              is_active: true,
              premium_tier: 0,
            });

          if (insertError) {
            console.error('Insert error:', insertError);
            failed++;
          } else {
            imported++;
          }
        } catch (err) {
          console.error('Error importing product:', err);
          failed++;
        }
      }

      toast.success(`Import complete`, {
        description: `Imported: ${imported}, Skipped (duplicates): ${skipped}, Failed: ${failed}`,
      });
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Import failed', {
        description: err instanceof Error ? err.message : 'Check console for details',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Search by Manufacturer
        </CardTitle>
        <CardDescription>
          Search Miami-Dade's NOA database for a specific manufacturer, export to CSV, and import into our database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter manufacturer name (e.g., GAF, Polyglass, CertainTeed)..."
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={searchState.isSearching}>
            {searchState.isSearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search NOAs
              </>
            )}
          </Button>
        </div>

        {/* Quick Search Buttons */}
        <div className="flex flex-wrap gap-2">
          <Label className="text-sm text-muted-foreground w-full">Quick Search:</Label>
          {['GAF', 'Polyglass', 'CertainTeed', 'Owens Corning', 'Johns Manville', 'IKO', 'Boral'].map(mfr => (
            <Button
              key={mfr}
              variant="outline"
              size="sm"
              onClick={() => {
                setManufacturer(mfr);
                setTimeout(() => handleSearch(), 100);
              }}
              disabled={searchState.isSearching}
            >
              {mfr}
            </Button>
          ))}
        </div>

        {/* Error State */}
        {searchState.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{searchState.error}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {searchState.results.length > 0 && (
          <div className="space-y-4">
            {/* Actions Bar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedResults.size} of {searchState.results.length} selected
                </span>
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportToCSV} disabled={selectedResults.size === 0}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  size="sm" 
                  onClick={importToDatabase} 
                  disabled={selectedResults.size === 0 || isImporting}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Selected
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Results List */}
            <ScrollArea className="h-[400px] border rounded-lg">
              <div className="p-2 space-y-2">
                {searchState.results.map((result) => (
                  <div
                    key={result.noa_number}
                    className={`p-3 border rounded-lg flex items-start gap-3 hover:bg-muted/50 transition-colors ${
                      selectedResults.has(result.noa_number) ? 'bg-primary/5 border-primary/30' : ''
                    }`}
                  >
                    <Checkbox
                      checked={selectedResults.has(result.noa_number)}
                      onCheckedChange={() => toggleSelection(result.noa_number)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-medium">{result.noa_number}</span>
                        {result.hvhz_approved && (
                          <Badge variant="default" className="text-xs">HVHZ</Badge>
                        )}
                        {result.pdf_url && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                            <FileText className="h-3 w-3 mr-1" />
                            PDF
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate mt-1">{result.product_name}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{result.manufacturer}</span>
                        {result.category && <span>• {result.category}</span>}
                        {result.expiration_date && (
                          <span>• Expires: {new Date(result.expiration_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    {result.pdf_url && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setViewingPdf({
                          url: result.pdf_url!,
                          title: `${result.manufacturer} - ${result.noa_number}`
                        })}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Info */}
        <Alert>
          <Building2 className="h-4 w-4" />
          <AlertDescription className="text-xs">
            This tool searches the official Miami-Dade County NOA database for products by manufacturer name.
            You can select products to export as CSV or import directly into the product approvals database.
            Existing products (same NOA number) will be skipped during import.
          </AlertDescription>
        </Alert>
      </CardContent>

      <PDFViewerDialog
        open={!!viewingPdf}
        onOpenChange={(open) => !open && setViewingPdf(null)}
        url={viewingPdf?.url || ''}
        title={viewingPdf?.title || 'NOA Document'}
        filename={`${viewingPdf?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'noa'}.pdf`}
      />
    </Card>
  );
}
