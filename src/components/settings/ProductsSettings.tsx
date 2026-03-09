import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ShoppingCart, Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface RoofingMaterial {
  id: string;
  name: string;
  category: string;
  unit_of_measure: string;
  cost_per_unit: number;
  supplier: string | null;
  description: string | null;
  is_active: boolean;
}

const CATEGORIES = ["Shingle", "Metal", "Flat", "Tile", "Accessories", "Underlayment", "Ventilation", "Coatings", "Sealants", "Fasteners"];
const PRICING_TIERS = ["Budget", "Standard", "Premium"];

export function ProductsSettings() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "Shingle", unit_of_measure: "SQ", cost_per_unit: "", supplier: "", description: "", pricing_tier: "Standard" });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("roofing_materials").select("*").order("category").order("name");
      if (error) throw error;
      return data as RoofingMaterial[];
    },
  });

  // Fetch suppliers for linking
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-for-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("id, name").eq("is_active", true).order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  // Group by category for summary
  const categoryCounts = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  const upsertMutation = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      const row = {
        name: values.name.trim(),
        category: values.category,
        unit_of_measure: values.unit_of_measure,
        cost_per_unit: Number(values.cost_per_unit),
        supplier: values.supplier.trim() || null,
        description: values.description.trim() || null,
      };
      if (values.id) {
        const { error } = await supabase.from("roofing_materials").update(row).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("roofing_materials").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products-catalog"] });
      queryClient.invalidateQueries({ queryKey: ["roofing-materials"] });
      toast.success(editingId ? "Product updated" : "Product added");
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("roofing_materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products-catalog"] });
      queryClient.invalidateQueries({ queryKey: ["roofing-materials"] });
      toast.success("Product deleted");
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", category: "Shingle", unit_of_measure: "SQ", cost_per_unit: "", supplier: "", description: "", pricing_tier: "Standard" });
    setDialogOpen(true);
  };
  const openEdit = (p: RoofingMaterial) => {
    setEditingId(p.id);
    setForm({
      name: p.name, category: p.category, unit_of_measure: p.unit_of_measure,
      cost_per_unit: String(p.cost_per_unit), supplier: p.supplier ?? "",
      description: p.description ?? "", pricing_tier: "Standard",
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("Product name is required");
    upsertMutation.mutate(editingId ? { ...form, id: editingId } : form);
  };

  const update = (f: string, v: string) => setForm(prev => ({ ...prev, [f]: v }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" /> Product Catalog</h2>
          <p className="text-sm text-muted-foreground mt-1">{products.length} products across {Object.keys(categoryCounts).length} categories</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Product</Button>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={categoryFilter === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setCategoryFilter("all")}
        >
          All ({products.length})
        </Badge>
        {Object.entries(categoryCounts).sort().map(([cat, count]) => (
          <Badge
            key={cat}
            variant={categoryFilter === cat ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setCategoryFilter(cat)}
          >
            {cat} ({count})
          </Badge>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">{search || categoryFilter !== "all" ? "No products match" : "No products yet"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        {p.description && <p className="text-xs text-muted-foreground truncate max-w-[250px]">{p.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{p.unit_of_measure}</TableCell>
                    <TableCell className="text-right font-medium">${Number(p.cost_per_unit).toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">{p.supplier || "—"}</TableCell>
                    <TableCell><Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="e.g. GAF Timberline HDZ" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => update("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pricing Tier</Label>
                <Select value={form.pricing_tier} onValueChange={v => update("pricing_tier", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRICING_TIERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={form.unit_of_measure} onValueChange={v => update("unit_of_measure", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["SQ","ROLL","BD","PC","EA","BOX","GAL","LF","SF"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input type="number" min="0" step="0.01" value={form.cost_per_unit} onChange={e => update("cost_per_unit", e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={form.supplier || "_none"} onValueChange={v => update("supplier", v === "_none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => update("description", e.target.value)} placeholder="Product details..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this product from your catalog.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
