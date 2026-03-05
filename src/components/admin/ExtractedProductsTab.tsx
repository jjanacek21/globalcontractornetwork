import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Search, RefreshCw, CheckCircle2, Edit2, Trash2, 
  Package, ShieldCheck, Clock, FileText, Save, X,
  Upload, AlertTriangle
} from "lucide-react";

interface ExtractedProduct {
  id: string;
  manufacturer: string | null;
  product_name: string | null;
  product_category: string | null;
  noa_number: string | null;
  fl_product_approval: string | null;
  uil_number?: string | null;
  hvhz_approved: boolean | null;
  source_status: string | null;
  is_active: boolean | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
  // Joined fields
  source_file_name?: string;
  source_county?: string;
  source_city?: string;
}

interface EditFormData {
  manufacturer: string;
  product_name: string;
  product_category: string;
  noa_number: string;
  fl_product_approval: string;
  uil_number: string;
  hvhz_approved: boolean;
}

const CATEGORIES = [
  "all",
  "roofing",
  "windows",
  "doors",
  "impact_resistant",
  "shutters",
  "structural",
  "insulation",
  "other"
];

const STATUS_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "verified", label: "Verified" },
  { value: "found", label: "PDF Found" },
  { value: "imported", label: "Imported" },
  { value: "training_extracted", label: "Extracted" },
  { value: "needs_manual_upload", label: "Needs Upload" },
  { value: "pending", label: "Pending" },
];

export default function ExtractedProductsTab() {
  const [products, setProducts] = useState<ExtractedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingProduct, setEditingProduct] = useState<ExtractedProduct | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    manufacturer: "",
    product_name: "",
    product_category: "",
    noa_number: "",
    fl_product_approval: "",
    uil_number: "",
    hvhz_approved: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Paginate to fetch ALL products (Supabase default limit is 1000)
      let allProducts: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error: fetchError } = await supabase
          .from("product_approvals")
          .select("*")
          .order("created_at", { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          allProducts = [...allProducts, ...data];
          hasMore = data.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      // Get training packet info for source context
      const trainingIds = allProducts
        .map(p => (p.metadata as { source_training_id?: string })?.source_training_id)
        .filter(Boolean) as string[];

      let trainingMap = new Map<string, { source_file_name: string; county: string; city: string }>();
      
      if (trainingIds.length > 0) {
        const { data: trainingData } = await supabase
          .from("permit_packet_training")
          .select("id, source_file_name, county, city")
          .in("id", trainingIds);

        if (trainingData) {
          trainingData.forEach(t => {
            trainingMap.set(t.id, {
              source_file_name: t.source_file_name || "",
              county: t.county || "",
              city: t.city || "",
            });
          });
        }
      }

      // Merge data - cast to handle Json type
      const enrichedProducts = allProducts.map(p => {
        const metadata = p.metadata as Record<string, unknown> | null;
        const trainingId = metadata?.source_training_id as string | undefined;
        const trainingInfo = trainingId ? trainingMap.get(trainingId) : undefined;
        return {
          id: p.id,
          manufacturer: p.manufacturer,
          product_name: p.product_name,
          product_category: p.product_category,
          noa_number: p.noa_number,
          fl_product_approval: p.fl_product_approval,
          uil_number: p.uil_number ?? null,
          hvhz_approved: p.hvhz_approved,
          source_status: p.source_status,
          is_active: p.is_active,
          created_at: p.created_at,
          metadata,
          source_file_name: trainingInfo?.source_file_name,
          source_county: trainingInfo?.county,
          source_city: trainingInfo?.city,
        } as ExtractedProduct;
      });

      setProducts(enrichedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      !searchTerm ||
      p.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.noa_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fl_product_approval?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = 
      categoryFilter === "all" || 
      p.product_category === categoryFilter;

    const matchesStatus = 
      statusFilter === "all" || 
      p.source_status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: products.length,
    verified: products.filter(p => p.source_status === "verified").length,
    pendingReview: products.filter(p => !["verified", "found"].includes(p.source_status || "")).length,
    withPdfs: products.filter(p => p.source_status === "found" || (p.source_status !== "verified" && (p as any).file_url)).length,
    hvhzApproved: products.filter(p => p.hvhz_approved).length,
  };

  const handleVerify = async (productId: string) => {
    try {
      const { error } = await supabase
        .from("product_approvals")
        .update({ 
          source_status: "verified",
          is_active: true,
        })
        .eq("id", productId);

      if (error) throw error;

      setProducts(prev => 
        prev.map(p => 
          p.id === productId 
            ? { ...p, source_status: "verified", is_active: true }
            : p
        )
      );
      toast.success("Product verified successfully");
    } catch (error) {
      console.error("Error verifying product:", error);
      toast.error("Failed to verify product");
    }
  };

  const handleBulkVerify = async () => {
    const unverifiedWithPdfs = products.filter(
      p => p.source_status !== "verified" && (p.source_status === "found" || p.source_status === "imported")
    );
    if (unverifiedWithPdfs.length === 0) {
      toast.info("No unverified products with PDFs to verify");
      return;
    }
    try {
      const ids = unverifiedWithPdfs.map(p => p.id);
      const CHUNK_SIZE = 50;
      for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        const chunk = ids.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase
          .from("product_approvals")
          .update({ source_status: "verified", is_active: true })
          .in("id", chunk);
        if (error) throw error;
      }
      setProducts(prev =>
        prev.map(p =>
          unverifiedWithPdfs.some(u => u.id === p.id)
            ? { ...p, source_status: "verified", is_active: true }
            : p
        )
      );
      toast.success(`Verified ${unverifiedWithPdfs.length} products`);
    } catch (error) {
      console.error("Error bulk verifying:", error);
      toast.error("Failed to bulk verify products");
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product approval?")) return;

    try {
      const { error } = await supabase
        .from("product_approvals")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const openEditDialog = (product: ExtractedProduct) => {
    setEditingProduct(product);
    setEditFormData({
      manufacturer: product.manufacturer || "",
      product_name: product.product_name || "",
      product_category: product.product_category || "",
      noa_number: product.noa_number || "",
      fl_product_approval: product.fl_product_approval || "",
      uil_number: product.uil_number || "",
      hvhz_approved: product.hvhz_approved || false,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("product_approvals")
        .update({
          manufacturer: editFormData.manufacturer || null,
          product_name: editFormData.product_name || null,
          product_category: editFormData.product_category || null,
          noa_number: editFormData.noa_number || null,
          fl_product_approval: editFormData.fl_product_approval || null,
          uil_number: editFormData.uil_number || null,
          hvhz_approved: editFormData.hvhz_approved,
        })
        .eq("id", editingProduct.id);

      if (error) throw error;

      setProducts(prev =>
        prev.map(p =>
          p.id === editingProduct.id
            ? { ...p, ...editFormData }
            : p
        )
      );
      setEditingProduct(null);
      toast.success("Product updated successfully");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Extracted Product Approvals
          </h2>
          <p className="text-sm text-muted-foreground">
            NOAs, FL approvals, and UL listings extracted from training packets
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleBulkVerify}>
            <ShieldCheck className="h-4 w-4 mr-2" />
            Verify All with PDFs
          </Button>
          <Button variant="outline" size="sm" onClick={fetchProducts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pendingReview}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">HVHZ Approved</p>
                <p className="text-2xl font-bold text-purple-600">{stats.hvhzApproved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products, NOA numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Approvals ({filteredProducts.length})</CardTitle>
          <CardDescription>
            Review and verify AI-extracted product approval data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No products found</p>
              <p className="text-sm">Upload training packets to extract product approvals</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>NOA / FL Approval</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.product_name || "Unknown Product"}</p>
                          <p className="text-sm text-muted-foreground">{product.manufacturer || "Unknown Manufacturer"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {product.noa_number && (
                            <Badge variant="outline" className="text-xs">
                              NOA: {product.noa_number}
                            </Badge>
                          )}
                          {product.fl_product_approval && (
                            <Badge variant="outline" className="text-xs">
                              FL: {product.fl_product_approval}
                            </Badge>
                          )}
                          {product.hvhz_approved && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">
                              HVHZ
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {product.product_category?.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()) || "Uncategorized"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {product.source_county && (
                            <p className="text-muted-foreground">{product.source_county}</p>
                          )}
                          {product.source_file_name && (
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {product.source_file_name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.source_status === "verified" ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : product.source_status === "found" ? (
                          <Badge className="bg-blue-100 text-blue-700">
                            <FileText className="h-3 w-3 mr-1" />
                            PDF Found
                          </Badge>
                        ) : product.source_status === "imported" ? (
                          <Badge variant="secondary">
                            <Upload className="h-3 w-3 mr-1" />
                            Imported
                          </Badge>
                        ) : product.source_status === "training_extracted" ? (
                          <Badge className="bg-purple-100 text-purple-700">
                            <Package className="h-3 w-3 mr-1" />
                            Extracted
                          </Badge>
                        ) : product.source_status === "needs_manual_upload" ? (
                          <Badge className="bg-red-100 text-red-700">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Needs Upload
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {product.source_status !== "verified" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleVerify(product.id)}
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(product)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product Approval</DialogTitle>
            <DialogDescription>
              Update the product information extracted by AI
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={editFormData.manufacturer}
                onChange={(e) => setEditFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product_name">Product Name</Label>
              <Input
                id="product_name"
                value={editFormData.product_name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, product_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product_category">Category</Label>
              <Select 
                value={editFormData.product_category} 
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, product_category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter(c => c !== "all").map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="noa_number">NOA Number</Label>
              <Input
                id="noa_number"
                value={editFormData.noa_number}
                onChange={(e) => setEditFormData(prev => ({ ...prev, noa_number: e.target.value }))}
                placeholder="e.g., NOA 21-0123.45"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fl_product_approval">FL Product Approval #</Label>
              <Input
                id="fl_product_approval"
                value={editFormData.fl_product_approval}
                onChange={(e) => setEditFormData(prev => ({ ...prev, fl_product_approval: e.target.value }))}
                placeholder="e.g., FL12345"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hvhz_approved"
                checked={editFormData.hvhz_approved}
                onChange={(e) => setEditFormData(prev => ({ ...prev, hvhz_approved: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="hvhz_approved">HVHZ Approved</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProduct(null)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
