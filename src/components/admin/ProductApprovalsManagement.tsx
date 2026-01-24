import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Upload, 
  FileText, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Shield,
  Trash2,
  Eye,
  Plus,
  Brain,
  RefreshCw,
  ExternalLink,
  FileCheck,
  FileWarning,
  Download
} from 'lucide-react';
import { useProductApprovals, ProductApproval } from '@/hooks/useProductApprovals';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ProductApprovalsManagement() {
  const { products, loading, getCategories, getManufacturers, refetch } = useProductApprovals();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [documentFilter, setDocumentFilter] = useState<string>('all');
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductApproval | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [aiSourcing, setAiSourcing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [sourcingResults, setSourcingResults] = useState<{
    updated: number;
    failed: number;
    total: number;
  } | null>(null);

  const categories = getCategories();
  const manufacturers = getManufacturers();

  // Stats
  const totalProducts = products.length;
  const withNoaPdf = products.filter(p => p.file_url || p.noa_pdf_url).length;
  const withFlApproval = products.filter(p => p.fl_product_approval).length;
  const withNoaNumber = products.filter(p => p.noa_number).length;
  const missingDocs = products.filter(p => !p.file_url && !p.noa_pdf_url && !p.fl_approval_pdf_url).length;

  const filteredProducts = products.filter(product => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches = 
        product.manufacturer.toLowerCase().includes(query) ||
        product.product_name.toLowerCase().includes(query) ||
        product.noa_number?.toLowerCase().includes(query) ||
        product.fl_product_approval?.toLowerCase().includes(query);
      if (!matches) return false;
    }
    
    // Category filter
    if (selectedCategory !== 'all' && product.product_category !== selectedCategory) {
      return false;
    }
    
    // Document filter
    if (documentFilter === 'has_pdf' && !product.file_url && !product.noa_pdf_url && !product.fl_approval_pdf_url) {
      return false;
    }
    if (documentFilter === 'missing_pdf' && (product.file_url || product.noa_pdf_url || product.fl_approval_pdf_url)) {
      return false;
    }
    if (documentFilter === 'has_noa' && !product.noa_number) {
      return false;
    }
    if (documentFilter === 'hvhz_only' && !product.hvhz_approved) {
      return false;
    }
    
    return true;
  });

  const handleFileUpload = async (productId: string, file: File, docType: 'noa' | 'fl_approval' | 'ul_listing') => {
    if (!file.type.includes('pdf')) {
      toast.error('Only PDF files are allowed');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size must be less than 15MB');
      return;
    }

    setUploading(productId);

    try {
      const fileName = `${productId}-${docType}-${Date.now()}.pdf`;
      const filePath = `${docType}-documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-approvals')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-approvals')
        .getPublicUrl(filePath);

      // Update product with file URL based on type
      const updateData: Record<string, any> = { file_path: filePath };
      
      if (docType === 'noa') {
        updateData.noa_pdf_url = publicUrl;
        updateData.file_url = publicUrl;
      } else if (docType === 'fl_approval') {
        updateData.fl_approval_pdf_url = publicUrl;
        if (!products.find(p => p.id === productId)?.file_url) {
          updateData.file_url = publicUrl;
        }
      } else if (docType === 'ul_listing') {
        updateData.ul_listing_url = publicUrl;
      }

      const { error: updateError } = await supabase
        .from('product_approvals')
        .update(updateData)
        .eq('id', productId);

      if (updateError) throw updateError;

      toast.success(`${docType.toUpperCase()} document uploaded successfully`);
      refetch();
      setUploadDialogOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(null);
    }
  };

  const runAiDocumentSourcing = async () => {
    setAiSourcing(true);
    setAiProgress(0);
    setSourcingResults(null);

    try {
      toast.info('Starting AI document sourcing...');
      
      const { data, error } = await supabase.functions.invoke('source-product-approvals', {
        body: { mode: 'auto' }
      });

      if (error) throw error;

      setSourcingResults({
        updated: data?.updated || 0,
        failed: data?.failed || 0,
        total: data?.total || 0
      });

      toast.success(`AI sourcing complete: ${data?.updated || 0} products updated`);
      refetch();
    } catch (error) {
      console.error('AI sourcing error:', error);
      toast.error('AI document sourcing failed');
    } finally {
      setAiSourcing(false);
      setAiProgress(100);
    }
  };

  const getDocumentStatusBadge = (product: ProductApproval) => {
    const hasNoa = product.file_url || product.noa_pdf_url;
    const hasFlApproval = product.fl_approval_pdf_url || product.fl_product_approval;
    const hasUl = product.ul_listing_url;

    if (hasNoa && hasFlApproval) {
      return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Complete</Badge>;
    }
    if (hasNoa || hasFlApproval) {
      return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">Partial</Badge>;
    }
    return <Badge variant="outline" className="text-muted-foreground"><AlertCircle className="h-3 w-3 mr-1" />Missing</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading products...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with AI Sourcing */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Product Approval Documents
          </h2>
          <p className="text-muted-foreground">
            Manage NOAs, FL Product Approvals, and UL Listings for permit products
          </p>
        </div>
        <Button 
          onClick={runAiDocumentSourcing}
          disabled={aiSourcing}
          className="gap-2"
        >
          {aiSourcing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sourcing Documents...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" />
              AI Source Documents
            </>
          )}
        </Button>
      </div>

      {/* AI Sourcing Progress */}
      {aiSourcing && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Brain className="h-8 w-8 text-primary animate-pulse" />
              <div className="flex-1">
                <p className="font-medium">AI Document Sourcing in Progress</p>
                <p className="text-sm text-muted-foreground">
                  Searching Florida Building Product Approval database...
                </p>
                <Progress value={aiProgress} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sourcing Results */}
      {sourcingResults && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-medium">AI Sourcing Complete</p>
                  <p className="text-sm text-muted-foreground">
                    Updated {sourcingResults.updated} of {sourcingResults.total} products
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSourcingResults(null)}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold">{totalProducts}</p>
            <p className="text-sm text-muted-foreground">Total Products</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-green-600">{withNoaPdf}</p>
            <p className="text-sm text-muted-foreground">With PDF</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{withFlApproval}</p>
            <p className="text-sm text-muted-foreground">FL Approval #</p>
          </CardContent>
        </Card>
        <Card className="border-purple-500/20">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{withNoaNumber}</p>
            <p className="text-sm text-muted-foreground">NOA Number</p>
          </CardContent>
        </Card>
        <Card className="border-orange-500/20">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-orange-600">{missingDocs}</p>
            <p className="text-sm text-muted-foreground">Missing Docs</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by manufacturer, product, NOA, or FL approval..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={documentFilter} onValueChange={setDocumentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Document Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="has_pdf">Has PDF</SelectItem>
                <SelectItem value="missing_pdf">Missing PDF</SelectItem>
                <SelectItem value="has_noa">Has NOA #</SelectItem>
                <SelectItem value="hvhz_only">HVHZ Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[300px]">Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>NOA #</TableHead>
                  <TableHead>FL Approval #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>HVHZ</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No products found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.slice(0, 100).map(product => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium truncate max-w-[280px]">{product.product_name}</p>
                          <p className="text-xs text-muted-foreground">{product.manufacturer}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.product_category}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{product.noa_number || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{product.fl_product_approval || '-'}</span>
                      </TableCell>
                      <TableCell>{getDocumentStatusBadge(product)}</TableCell>
                      <TableCell>
                        {product.hvhz_approved ? (
                          <Badge className="bg-blue-500">HVHZ</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Document Links */}
                          {(product.file_url || product.noa_pdf_url || product.fl_approval_pdf_url) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              asChild
                            >
                              <a 
                                href={product.file_url || product.noa_pdf_url || product.fl_approval_pdf_url || '#'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          
                          {/* Upload Button */}
                          <Dialog open={uploadDialogOpen && selectedProduct?.id === product.id} onOpenChange={(open) => {
                            setUploadDialogOpen(open);
                            if (open) setSelectedProduct(product);
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedProduct(product)}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Upload Document</DialogTitle>
                                <DialogDescription>
                                  Upload NOA, FL Product Approval, or UL Listing for {product.product_name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="grid grid-cols-3 gap-2">
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept=".pdf"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(product.id, file, 'noa');
                                      }}
                                      disabled={uploading === product.id}
                                    />
                                    <div className={cn(
                                      "border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors",
                                      uploading === product.id && "opacity-50 pointer-events-none"
                                    )}>
                                      <FileCheck className="h-8 w-8 mx-auto mb-2 text-primary" />
                                      <p className="text-sm font-medium">NOA PDF</p>
                                      <p className="text-xs text-muted-foreground">Miami-Dade</p>
                                    </div>
                                  </label>
                                  
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept=".pdf"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(product.id, file, 'fl_approval');
                                      }}
                                      disabled={uploading === product.id}
                                    />
                                    <div className={cn(
                                      "border-2 border-dashed rounded-lg p-4 text-center hover:border-blue-500 transition-colors",
                                      uploading === product.id && "opacity-50 pointer-events-none"
                                    )}>
                                      <Shield className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                                      <p className="text-sm font-medium">FL Approval</p>
                                      <p className="text-xs text-muted-foreground">State Product</p>
                                    </div>
                                  </label>
                                  
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept=".pdf"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(product.id, file, 'ul_listing');
                                      }}
                                      disabled={uploading === product.id}
                                    />
                                    <div className={cn(
                                      "border-2 border-dashed rounded-lg p-4 text-center hover:border-orange-500 transition-colors",
                                      uploading === product.id && "opacity-50 pointer-events-none"
                                    )}>
                                      <FileText className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                                      <p className="text-sm font-medium">UL Listing</p>
                                      <p className="text-xs text-muted-foreground">Safety Cert</p>
                                    </div>
                                  </label>
                                </div>
                                
                                {uploading === product.id && (
                                  <div className="flex items-center justify-center gap-2 py-4">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Uploading...</span>
                                  </div>
                                )}
                                
                                {/* Current Documents */}
                                <div className="border-t pt-4">
                                  <p className="text-sm font-medium mb-2">Current Documents</p>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">NOA PDF:</span>
                                      {product.noa_pdf_url || product.file_url ? (
                                        <a href={product.noa_pdf_url || product.file_url} target="_blank" className="text-primary flex items-center gap-1">
                                          View <ExternalLink className="h-3 w-3" />
                                        </a>
                                      ) : (
                                        <span className="text-orange-500">Missing</span>
                                      )}
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">FL Approval:</span>
                                      {product.fl_approval_pdf_url ? (
                                        <a href={product.fl_approval_pdf_url} target="_blank" className="text-primary flex items-center gap-1">
                                          View <ExternalLink className="h-3 w-3" />
                                        </a>
                                      ) : product.fl_product_approval ? (
                                        <span className="font-mono text-xs">{product.fl_product_approval}</span>
                                      ) : (
                                        <span className="text-orange-500">Missing</span>
                                      )}
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">UL Listing:</span>
                                      {product.ul_listing_url ? (
                                        <a href={product.ul_listing_url} target="_blank" className="text-primary flex items-center gap-1">
                                          View <ExternalLink className="h-3 w-3" />
                                        </a>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {filteredProducts.length > 100 && (
            <div className="p-4 text-center border-t">
              <p className="text-sm text-muted-foreground">
                Showing 100 of {filteredProducts.length} products. Refine your search to see more.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
