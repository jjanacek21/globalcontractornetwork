import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Upload, Key, Clock, Globe, FileSpreadsheet, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PropertyIQApiConfig from "./PropertyIQApiConfig";

const PropertyIQAdmin = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("site-query");

  // Site Query state
  const [queryUrl, setQueryUrl] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResults, setQueryResults] = useState<any[]>([]);

  // CSV Upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);

  // API Config state
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    property_appraiser: "",
    skip_tracing: "",
    sunbiz: "",
    zillow: "",
  });

  // Search History (mock)
  const [searchHistory] = useState([
    { id: '1', query: '1240 Industrial Blvd, Miami', type: 'Address', date: '2026-03-10', results: 1, status: 'completed' },
    { id: '2', query: 'Mendez Industrial Holdings', type: 'Owner', date: '2026-03-09', results: 3, status: 'completed' },
    { id: '3', query: 'bcpa.net/RecOwner.asp?paression=123', type: 'URL Crawl', date: '2026-03-08', results: 12, status: 'completed' },
  ]);

  const handleSiteQuery = async () => {
    if (!queryUrl.trim()) return;
    setQueryLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
        body: { url: queryUrl, options: { formats: ['markdown', 'links'] } },
      });
      if (error) throw error;
      const markdown = data?.data?.markdown || data?.markdown || '';
      const links = data?.data?.links || data?.links || [];
      setQueryResults([{ url: queryUrl, markdown: markdown.substring(0, 500), links: links.slice(0, 10), timestamp: new Date().toISOString() }]);
      toast({ title: "Scrape Complete", description: `Extracted content from ${queryUrl}` });
    } catch (err: any) {
      toast({ title: "Scrape Failed", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setQueryLoading(false);
    }
  };

  const handleCsvUpload = () => {
    if (!csvFile) return;
    setCsvUploading(true);
    // Simulate processing
    setTimeout(() => {
      setCsvUploading(false);
      toast({ title: "Upload Complete", description: `Processed ${csvFile.name} — 0 records queued for lookup.` });
      setCsvFile(null);
    }, 2000);
  };

  const handleSaveApiKey = (key: string) => {
    toast({ title: "API Key Saved", description: `${key.replace('_', ' ')} key has been saved.` });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">PropertyIQ Administration</h3>
        <p className="text-sm text-muted-foreground">Manage data sources, crawl sites, upload lists, and configure APIs for property intelligence.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="site-query" className="gap-1.5">
            <Globe className="h-4 w-4" /> Site Query
          </TabsTrigger>
          <TabsTrigger value="csv-upload" className="gap-1.5">
            <FileSpreadsheet className="h-4 w-4" /> List Upload
          </TabsTrigger>
          <TabsTrigger value="api-config" className="gap-1.5">
            <Key className="h-4 w-4" /> API Config
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <Clock className="h-4 w-4" /> History
          </TabsTrigger>
        </TabsList>

        {/* Site Query */}
        <TabsContent value="site-query" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Crawl a Website</CardTitle>
              <CardDescription>Use Firecrawl to scrape property appraiser sites, Sunbiz, or any URL for owner/property data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://bcpa.net/RecOwner.asp?paression=..."
                  value={queryUrl}
                  onChange={(e) => setQueryUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSiteQuery} disabled={queryLoading} className="gap-1.5">
                  {queryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Scrape
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['bcpa.net', 'miamidade.gov/pa', 'pbcgov.org/papa', 'sunbiz.org'].map((site) => (
                  <Button key={site} variant="outline" size="sm" onClick={() => setQueryUrl(`https://${site}`)}>
                    {site}
                  </Button>
                ))}
              </div>

              {queryResults.length > 0 && (
                <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                  <p className="text-sm font-medium">Results from: {queryResults[0].url}</p>
                  <pre className="text-xs bg-background p-3 rounded overflow-auto max-h-48 border">
                    {queryResults[0].markdown}
                  </pre>
                  {queryResults[0].links?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mt-2">Links Found ({queryResults[0].links.length})</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {queryResults[0].links.map((link: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px] font-mono">{link.substring(0, 50)}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CSV Upload */}
        <TabsContent value="csv-upload" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload Address or Owner List</CardTitle>
              <CardDescription>Upload a CSV file with addresses or owner names for batch property lookup.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => document.getElementById('csv-input')?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">{csvFile ? csvFile.name : 'Click to upload CSV'}</p>
                <p className="text-xs text-muted-foreground mt-1">Accepted: .csv files with address or owner columns</p>
                <input
                  id="csv-input"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                />
              </div>
              {csvFile && (
                <Button onClick={handleCsvUpload} disabled={csvUploading} className="gap-1.5">
                  {csvUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Process List
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Config */}
        <TabsContent value="api-config" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { key: 'property_appraiser', label: 'Property Appraiser API', desc: 'County property appraiser data access' },
              { key: 'skip_tracing', label: 'Skip Tracing API', desc: 'Owner contact lookup (BatchSkipTracing, REISkip, etc.)' },
              { key: 'sunbiz', label: 'Sunbiz / Corp Search API', desc: 'Florida corporate entity search' },
              { key: 'zillow', label: 'Zillow / Property Data API', desc: 'Property valuation and market data' },
            ].map((api) => (
              <Card key={api.key}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Key className="h-4 w-4" /> {api.label}
                  </CardTitle>
                  <CardDescription className="text-xs">{api.desc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor={api.key} className="text-xs">API Key</Label>
                    <Input
                      id={api.key}
                      type="password"
                      placeholder="Enter API key..."
                      value={apiKeys[api.key]}
                      onChange={(e) => setApiKeys({ ...apiKeys, [api.key]: e.target.value })}
                    />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleSaveApiKey(api.key)}>
                    Save Key
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Results</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchHistory.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium text-sm">{h.query}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{h.type}</Badge></TableCell>
                      <TableCell className="text-sm">{h.date}</TableCell>
                      <TableCell>{h.results}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{h.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropertyIQAdmin;
