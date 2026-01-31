import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useProductApprovals, ProductApproval } from '@/hooks/useProductApprovals';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProductApprovalDocumentsProps {
  onRefresh?: () => void;
}

export function ProductApprovalDocuments({ onRefresh }: ProductApprovalDocumentsProps) {
  const { products, loading, getCategories, getManufacturers, refetch } = useProductApprovals();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductApproval | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const categories = getCategories();

  const filteredProducts = products.filter(product => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches = 
        product.manufacturer.toLowerCase().includes(query) ||
        product.product_name.toLowerCase().includes(query) ||
        product.noa_number?.toLowerCase().includes(query);
      if (!matches) return false;
    }
    if (selectedCategory !== 'all' && product.product_category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const handleFileUpload = async (productId: string, file: File) => {
    if (!file.type.includes('pdf')) {
      toast.error('Only PDF files are allowed for NOA documents');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(productId);

    try {
      const fileName = `${productId}-${Date.now()}.pdf`;
      const filePath = `noa-documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-approvals')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-approvals')
        .getPublicUrl(filePath);

      // Update product with file URL
      const { error: updateError } = await supabase
        .from('product_approvals')
        .update({ 
          file_path: filePath,
          file_url: publicUrl 
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      toast.success('NOA document uploaded successfully');
      refetch();
      onRefresh?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteDocument = async (product: ProductApproval) => {
    if (!product.file_path) return;

    try {
      // Delete from storage
      await supabase.storage
        .from('product-approvals')
        .remove([product.file_path]);

      // Clear file references in database
      const { error } = await supabase
        .from('product_approvals')
        .update({ file_path: null, file_url: null })
        .eq('id', product.id);

      if (error) throw error;

      toast.success('Document removed');
      refetch();
      onRefresh?.();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to remove document');
    }
  };

  const productsWithDocs = products.filter(p => p.file_url).length;
  const productsWithoutDocs = products.filter(p => !p.file_url).length;

  // Helper to check if URL is external (Miami-Dade, etc.) vs internal storage
  const isExternalUrl = (url: string | null): boolean => {
    if (!url) return false;
    return url.includes('miamidade.gov') || url.includes('floridabuilding.org');
  };

  // Helper to check if URL is internal Supabase storage
  const isInternalStorage = (url: string | null): boolean => {
    if (!url) return false;
    return url.includes('supabase') || url.includes('ujalvgknnbsxqpujxvwk');
  };

  const productsWithExternalUrls = products.filter(p => isExternalUrl(p.file_url)).length;

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Product Approval Documents
        </CardTitle>
        <CardDescription>
          Attach NOA PDFs and product spec sheets to products in the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">{products.length}</p>
            <p className="text-sm text-muted-foreground">Total Products</p>
          </div>
          <div className="text-center p-4 bg-green-500/10 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{productsWithDocs}</p>
            <p className="text-sm text-muted-foreground">With NOA Docs</p>
          </div>
          <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{productsWithExternalUrls}</p>
            <p className="text-sm text-muted-foreground">External URLs</p>
          </div>
          <div className="text-center p-4 bg-orange-500/10 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{productsWithoutDocs}</p>
            <p className="text-sm text-muted-foreground">Missing Docs</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Product List */}
        <div className="border rounded-lg divide-y max-h-[500px] overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No products found</p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div key={product.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{product.product_name}</p>
                    {product.file_url ? (
                      isInternalStorage(product.file_url) ? (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          External URL
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        No Document
                      </Badge>
                    )}
                    {product.hvhz_approved && (
                      <Badge variant="outline" className="border-blue-500 text-blue-600">HVHZ</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span>{product.manufacturer}</span>
                    <span>•</span>
                    <span>{product.product_category}</span>
                    {product.noa_number && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-xs">{product.noa_number}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {product.file_url ? (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <a href={product.file_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </a>
                      </Button>
                      {isExternalUrl(product.file_url) && (
                        <Button variant="ghost" size="sm" asChild title="Open external source">
                          <a href={product.file_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </a>
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteDocument(product)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(product.id, file);
                          e.target.value = '';
                        }}
                        disabled={uploading === product.id}
                      />
                      <Button variant="outline" size="sm" asChild disabled={uploading === product.id}>
                        <span>
                          {uploading === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Upload className="h-4 w-4 mr-1" />
                          )}
                          Upload NOA
                        </span>
                      </Button>
                    </label>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {filteredProducts.length > 0 && (
          <p className="text-sm text-center text-muted-foreground">
            Showing {filteredProducts.length} products
          </p>
        )}
      </CardContent>
    </Card>
  );
}
