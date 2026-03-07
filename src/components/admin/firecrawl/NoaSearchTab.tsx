import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NoaRecord {
  noa_number: string;
  manufacturer: string;
  product_name: string;
  category: string;
  classification: string;
  expiration_date: string | null;
  hvhz_approved: boolean;
}

const NoaSearchTab = () => {
  const [searchType, setSearchType] = useState<string>('manufacturer');
  const [searchValue, setSearchValue] = useState('');
  const [category, setCategory] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<NoaRecord[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error('Please enter a search value');
      return;
    }

    setIsSearching(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-noa-scraper', {
        body: { searchType, searchValue: searchValue.trim(), category: category || undefined, limit: 50 },
      });

      if (error) throw error;

      if (data?.success) {
        setResults(data.records || []);
        setJobId(data.jobId);
        toast.success(`Found ${data.recordsFound} NOA records, stored ${data.recordsStored}`);
      } else {
        toast.error(data?.error || 'Search failed');
      }
    } catch (err) {
      console.error('NOA search error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Miami-Dade NOA Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search By</Label>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manufacturer">Manufacturer</SelectItem>
                  <SelectItem value="noa_number">NOA Number</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Search Value</Label>
              <Input
                placeholder={searchType === 'noa_number' ? '24-0101.01' : 'e.g. GAF, Owens Corning'}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Category (optional)</Label>
              <Select value={category || 'all'} onValueChange={(v) => setCategory(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Roofing">Roofing</SelectItem>
                  <SelectItem value="Windows">Windows</SelectItem>
                  <SelectItem value="Doors">Doors</SelectItem>
                  <SelectItem value="Shutters">Shutters</SelectItem>
                  <SelectItem value="Panels">Panels</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSearch} disabled={isSearching} className="w-full md:w-auto">
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            {isSearching ? 'Searching Miami-Dade...' : 'Search NOA Database'}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results ({results.length} records)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NOA Number</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>HVHZ</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-sm">{r.noa_number}</TableCell>
                    <TableCell>{r.manufacturer}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{r.product_name}</TableCell>
                    <TableCell><Badge variant="outline">{r.category}</Badge></TableCell>
                    <TableCell>{r.hvhz_approved ? <Badge className="bg-green-500/10 text-green-500">Yes</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                    <TableCell>{r.expiration_date || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NoaSearchTab;
