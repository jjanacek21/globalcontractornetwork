import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, FileText, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  type: string;
  title: string;
  description: string;
  url?: string;
  source?: string;
  relevance?: string;
}

interface SearchResponse {
  results: SearchResult[];
  summary: string;
  searchTips?: string[];
}

export function PermitDocumentSearch() {
  const [documentType, setDocumentType] = useState('NOA');
  const [searchQuery, setSearchQuery] = useState('');
  const [county, setCounty] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [productName, setProductName] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('permit-document-search', {
        body: {
          documentType,
          searchQuery,
          county,
          manufacturer,
          productName
        }
      });

      if (fnError) {
        throw new Error(fnError.message || 'Search failed');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setResults(data);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canSearch = () => {
    if (documentType === 'NOA') {
      return manufacturer || productName || searchQuery;
    }
    if (documentType === 'County Requirements') {
      return county || searchQuery;
    }
    return searchQuery;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Permit Document Search</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Criteria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Type */}
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NOA">NOA (Notice of Acceptance)</SelectItem>
                <SelectItem value="Engineering Report">Engineering Report (FL#)</SelectItem>
                <SelectItem value="County Requirements">County Permit Requirements</SelectItem>
                <SelectItem value="Product Approval">Product Approval Documents</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional Fields Based on Document Type */}
          {documentType === 'NOA' && (
            <>
              <div className="space-y-2">
                <Label>Manufacturer</Label>
                <Input
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="e.g., GAF, Metal Alliance, CertainTeed"
                />
              </div>
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., Timberline HDZ, 100SL Nailstrip"
                />
              </div>
            </>
          )}

          {documentType === 'County Requirements' && (
            <div className="space-y-2">
              <Label>County</Label>
              <Input
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                placeholder="e.g., Miami-Dade, Broward, Palm Beach"
              />
            </div>
          )}

          {/* General Search Query */}
          <div className="space-y-2">
            <Label>
              {documentType === 'Engineering Report'
                ? 'FL Number or Product Name'
                : 'Additional Search Terms'}
            </Label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                documentType === 'Engineering Report'
                  ? 'e.g., FL29523.03 or standing seam metal'
                  : 'Additional keywords...'
              }
            />
          </div>

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={loading || !canSearch()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search for Documents
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Search Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            {results.summary && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {results.summary}
                </p>
              </div>
            )}

            {/* Results List */}
            {results.results && results.results.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Found Documents</h3>
                {results.results.map((result, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{result.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {result.description}
                        </p>
                        {result.source && (
                          <span className="text-xs text-muted-foreground mt-2 inline-block">
                            Source: {result.source}
                          </span>
                        )}
                      </div>
                      {result.url && (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline text-sm shrink-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Search Tips */}
            {results.searchTips && results.searchTips.length > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                  Search Tips
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  {results.searchTips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* No results message */}
            {(!results.results || results.results.length === 0) && !results.summary && (
              <p className="text-center text-muted-foreground py-8">
                No documents found. Try adjusting your search criteria.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
