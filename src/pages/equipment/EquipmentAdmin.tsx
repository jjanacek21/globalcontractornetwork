import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsEquipmentAdmin } from "@/hooks/useIsEquipmentAdmin";
import { fmtUSD } from "@/lib/equipment/finance";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Package, FolderTree, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";
import { MediaUploader, GalleryUploader, resolveMediaUrl } from "@/components/equipment/admin/MediaUploader";
import "@/styles/equipment.css";

const STATUSES = ["pending_payment", "deposit_paid", "paid_full", "in_production", "shipped", "delivered", "cancelled"];

interface Product {
  id: string;
  slug: string;
  name: string;
  type: "rig" | "part";
  bto: boolean;
  cross_ref: string | null;
  specs: Record<string, string>;
  blurb: string | null;
  long_description: string | null;
  price_cents: number;
  compare_cents: number | null;
  cost_cents: number;
  active: boolean;
  sort_order: number;
  category_id: string | null;
  image_url: string | null;
  gallery: string[];
  video_url: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  sort_order: number;
  active: boolean;
}

const emptyProduct = (): Partial<Product> => ({
  slug: "", name: "", type: "rig", bto: false, cross_ref: "",
  specs: {}, blurb: "", long_description: "",
  price_cents: 0, compare_cents: null, cost_cents: 0,
  active: true, sort_order: 0, category_id: null,
  image_url: null, gallery: [], video_url: null,
});

const emptyCategory = (): Partial<Category> => ({
  name: "", slug: "", description: "", image_url: null, video_url: null,
  sort_order: 0, active: true,
});

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const centsToDollars = (c: number | null | undefined) => (c == null ? "" : (c / 100).toString());
const dollarsToCents = (s: string) => Math.round((parseFloat(s) || 0) * 100);

export default function EquipmentAdmin() {
  const { isAdmin, loading } = useIsEquipmentAdmin();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);

  const [productDialog, setProductDialog] = useState<Partial<Product> | null>(null);
  const [categoryDialog, setCategoryDialog] = useState<Partial<Category> | null>(null);

  const refresh = async () => {
    const [p, c, o, l] = await Promise.all([
      supabase.from("equipment_products").select("*").order("sort_order"),
      supabase.from("equipment_categories").select("*").order("sort_order"),
      supabase.from("equipment_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("financing_leads").select("*").order("created_at", { ascending: false }),
    ]);
    if (p.data) setProducts(p.data as Product[]);
    if (c.data) setCategories(c.data as Category[]);
    if (o.data) setOrders(o.data);
    if (l.data) setLeads(l.data);
  };

  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  if (loading) return <div className="equipment-scope p-10 eq-mono eq-text-2">Loading…</div>;
  if (!isAdmin) return <Navigate to="/equipment" replace />;

  // ---- Product save ----
  const saveProduct = async () => {
    if (!productDialog) return;
    const payload: any = {
      ...productDialog,
      slug: productDialog.slug || slugify(productDialog.name || ""),
      specs: productDialog.specs || {},
      gallery: productDialog.gallery || [],
    };
    delete payload.id;
    const q = productDialog.id
      ? supabase.from("equipment_products").update(payload).eq("id", productDialog.id)
      : supabase.from("equipment_products").insert(payload);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success(productDialog.id ? "Product updated" : "Product created");
    setProductDialog(null);
    refresh();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("equipment_products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refresh();
  };

  // ---- Category save ----
  const saveCategory = async () => {
    if (!categoryDialog) return;
    const payload: any = {
      ...categoryDialog,
      slug: categoryDialog.slug || slugify(categoryDialog.name || ""),
    };
    delete payload.id;
    const q = categoryDialog.id
      ? supabase.from("equipment_categories").update(payload).eq("id", categoryDialog.id)
      : supabase.from("equipment_categories").insert(payload);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success(categoryDialog.id ? "Category updated" : "Category created");
    setCategoryDialog(null);
    refresh();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category? Products will keep their data but lose the category link.")) return;
    const { error } = await supabase.from("equipment_categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refresh();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("equipment_orders").update({ status }).eq("id", id);
    if (error) toast.error("Failed to update status");
    else { setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o))); toast.success("Status updated"); }
  };

  // ---- Stats ----
  const revenue = orders.reduce((s, o) => s + (o.status !== "cancelled" ? o.subtotal_cents : 0), 0);
  const pending = orders.filter((o) => ["pending_payment", "deposit_paid", "in_production"].includes(o.status)).length;

  return (
    <div className="equipment-scope min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="eq-heading text-4xl">Store Admin</h1>
            <p className="eq-mono text-xs eq-text-2 uppercase mt-1">The GCN Store · Full control</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Package className="h-4 w-4" />} label="Products" value={products.length.toString()} />
          <StatCard icon={<FolderTree className="h-4 w-4" />} label="Categories" value={categories.length.toString()} />
          <StatCard icon={<ShoppingBag className="h-4 w-4" />} label="Orders" value={orders.length.toString()} sub={`${pending} pending`} />
          <StatCard icon={<DollarSign className="h-4 w-4" />} label="Revenue" value={fmtUSD(revenue)} />
        </div>

        <Tabs defaultValue="products">
          <TabsList className="mb-6">
            <TabsTrigger value="products"><Package className="h-4 w-4 mr-2" />Products</TabsTrigger>
            <TabsTrigger value="categories"><FolderTree className="h-4 w-4 mr-2" />Categories</TabsTrigger>
            <TabsTrigger value="orders"><ShoppingBag className="h-4 w-4 mr-2" />Orders</TabsTrigger>
            <TabsTrigger value="leads"><TrendingUp className="h-4 w-4 mr-2" />Leads</TabsTrigger>
          </TabsList>

          {/* PRODUCTS */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="eq-heading text-2xl">Products</h2>
              <Button onClick={() => setProductDialog(emptyProduct())}><Plus className="h-4 w-4 mr-2" />New Product</Button>
            </div>
            <div className="grid gap-3">
              {products.map((p) => (
                <ProductRow key={p.id} product={p} categories={categories}
                  onEdit={() => setProductDialog(p)} onDelete={() => deleteProduct(p.id)} />
              ))}
              {products.length === 0 && (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No products yet. Create your first one.</CardContent></Card>
              )}
            </div>
          </TabsContent>

          {/* CATEGORIES */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="eq-heading text-2xl">Categories</h2>
              <Button onClick={() => setCategoryDialog(emptyCategory())}><Plus className="h-4 w-4 mr-2" />New Category</Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((c) => (
                <CategoryCard key={c.id} category={c}
                  count={products.filter((p) => p.category_id === c.id).length}
                  onEdit={() => setCategoryDialog(c)} onDelete={() => deleteCategory(c.id)} />
              ))}
              {categories.length === 0 && (
                <Card className="col-span-full"><CardContent className="py-8 text-center text-muted-foreground">No categories yet.</CardContent></Card>
              )}
            </div>
          </TabsContent>

          {/* ORDERS */}
          <TabsContent value="orders">
            <div className="eq-plate overflow-x-auto">
              <table className="min-w-full eq-mono text-xs">
                <thead className="bg-muted eq-text-2 uppercase text-[0.65rem]">
                  <tr>
                    <th className="text-left p-3">Order</th>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-right p-3">Due Today</th>
                    <th className="text-right p-3">Balance</th>
                    <th className="text-left p-3">Method</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-t eq-hairline">
                      <td className="p-3 font-bold">{o.order_no}</td>
                      <td className="p-3"><div>{o.name}</div><div className="eq-text-2 text-[0.65rem]">{o.email}</div></td>
                      <td className="p-3 text-right eq-orange font-bold">{fmtUSD(o.deposit_due_cents)}</td>
                      <td className="p-3 text-right">{fmtUSD(o.balance_cents)}</td>
                      <td className="p-3 uppercase text-[0.65rem]">{o.payment_method}</td>
                      <td className="p-3">
                        <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="eq-input !py-1 !px-2 text-xs">
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={6} className="p-6 text-center eq-text-2">No orders yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* LEADS */}
          <TabsContent value="leads">
            <div className="eq-plate overflow-x-auto">
              <table className="min-w-full eq-mono text-xs">
                <thead className="bg-muted eq-text-2 uppercase text-[0.65rem]">
                  <tr>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Contact</th>
                    <th className="text-right p-3">Amount</th>
                    <th className="text-left p-3">Equipment</th>
                    <th className="text-left p-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} className="border-t eq-hairline">
                      <td className="p-3"><div className="font-bold">{l.name}</div>{l.company && <div className="eq-text-2 text-[0.65rem]">{l.company}</div>}</td>
                      <td className="p-3"><div>{l.email}</div><div className="eq-text-2 text-[0.65rem]">{l.phone}</div></td>
                      <td className="p-3 text-right eq-orange font-bold">{fmtUSD(l.amount_cents)}</td>
                      <td className="p-3 max-w-xs truncate">{l.equipment || "—"}</td>
                      <td className="p-3 eq-text-2 text-[0.65rem]">{new Date(l.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {leads.length === 0 && <tr><td colSpan={5} className="p-6 text-center eq-text-2">No leads yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* PRODUCT DIALOG */}
      <Dialog open={!!productDialog} onOpenChange={(o) => !o && setProductDialog(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{productDialog?.id ? "Edit Product" : "New Product"}</DialogTitle></DialogHeader>
          {productDialog && (
            <ProductForm value={productDialog} onChange={setProductDialog} categories={categories} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialog(null)}>Cancel</Button>
            <Button onClick={saveProduct}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CATEGORY DIALOG */}
      <Dialog open={!!categoryDialog} onOpenChange={(o) => !o && setCategoryDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{categoryDialog?.id ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
          {categoryDialog && <CategoryForm value={categoryDialog} onChange={setCategoryDialog} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialog(null)}>Cancel</Button>
            <Button onClick={saveCategory}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase">{icon}{label}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function ProductRow({ product, categories, onEdit, onDelete }: {
  product: Product; categories: Category[]; onEdit: () => void; onDelete: () => void;
}) {
  const [img, setImg] = useState("");
  useEffect(() => { if (product.image_url) resolveMediaUrl(product.image_url).then(setImg); }, [product.image_url]);
  const cat = categories.find((c) => c.id === product.category_id);
  return (
    <Card>
      <CardContent className="py-3 flex items-center gap-4">
        <div className="w-16 h-16 rounded bg-muted flex-shrink-0 overflow-hidden">
          {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <Package className="w-full h-full p-4 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{product.name}</span>
            <Badge variant={product.active ? "default" : "secondary"}>{product.active ? "Active" : "Hidden"}</Badge>
            <Badge variant="outline">{product.type}</Badge>
            {product.bto && <Badge variant="outline">BTO</Badge>}
            {cat && <Badge variant="outline">{cat.name}</Badge>}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {product.slug} · {fmtUSD(product.price_cents)}
            {product.gallery?.length > 0 && ` · ${product.gallery.length} gallery img`}
            {product.video_url && " · video"}
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </CardContent>
    </Card>
  );
}

function CategoryCard({ category, count, onEdit, onDelete }: {
  category: Category; count: number; onEdit: () => void; onDelete: () => void;
}) {
  const [img, setImg] = useState("");
  useEffect(() => { if (category.image_url) resolveMediaUrl(category.image_url).then(setImg); }, [category.image_url]);
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted">
        {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FolderTree className="h-8 w-8 text-muted-foreground" /></div>}
      </div>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{category.name}</h3>
              {!category.active && <Badge variant="secondary">Hidden</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">{count} product(s) · /{category.slug}</p>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        </div>
        {category.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{category.description}</p>}
      </CardContent>
    </Card>
  );
}

function ProductForm({ value, onChange, categories }: {
  value: Partial<Product>; onChange: (v: Partial<Product>) => void; categories: Category[];
}) {
  const set = (patch: Partial<Product>) => onChange({ ...value, ...patch });
  const specEntries = Object.entries(value.specs || {});

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Name</Label>
          <Input value={value.name || ""} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div>
          <Label>Slug</Label>
          <Input value={value.slug || ""} onChange={(e) => set({ slug: e.target.value })} placeholder="auto-generated" />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={value.type} onValueChange={(v) => set({ type: v as "rig" | "part" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="rig">Rig</SelectItem>
              <SelectItem value="part">Part</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Category</Label>
          <Select value={value.category_id || "none"} onValueChange={(v) => set({ category_id: v === "none" ? null : v })}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— None —</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Price ($)</Label>
          <Input type="number" step="0.01" value={centsToDollars(value.price_cents)}
            onChange={(e) => set({ price_cents: dollarsToCents(e.target.value) })} />
        </div>
        <div>
          <Label>Compare-at ($)</Label>
          <Input type="number" step="0.01" value={centsToDollars(value.compare_cents)}
            onChange={(e) => set({ compare_cents: e.target.value ? dollarsToCents(e.target.value) : null })} />
        </div>
        <div>
          <Label>Cost ($) <span className="text-xs text-muted-foreground">(private)</span></Label>
          <Input type="number" step="0.01" value={centsToDollars(value.cost_cents)}
            onChange={(e) => set({ cost_cents: dollarsToCents(e.target.value) })} />
        </div>
        <div>
          <Label>Sort order</Label>
          <Input type="number" value={value.sort_order ?? 0} onChange={(e) => set({ sort_order: parseInt(e.target.value) || 0 })} />
        </div>
        <div>
          <Label>Cross-reference</Label>
          <Input value={value.cross_ref || ""} onChange={(e) => set({ cross_ref: e.target.value })} placeholder="e.g. Graco XM70" />
        </div>
        <div className="flex items-end gap-6">
          <div className="flex items-center gap-2"><Switch checked={!!value.active} onCheckedChange={(v) => set({ active: v })} /><Label>Active</Label></div>
          <div className="flex items-center gap-2"><Switch checked={!!value.bto} onCheckedChange={(v) => set({ bto: v })} /><Label>Build-to-order</Label></div>
        </div>
      </div>

      <div>
        <Label>Short blurb</Label>
        <Textarea rows={2} value={value.blurb || ""} onChange={(e) => set({ blurb: e.target.value })} />
      </div>
      <div>
        <Label>Long description</Label>
        <Textarea rows={4} value={value.long_description || ""} onChange={(e) => set({ long_description: e.target.value })} />
      </div>

      {/* Specs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Specs</Label>
          <Button type="button" size="sm" variant="outline" onClick={() => set({ specs: { ...(value.specs || {}), "": "" } })}>
            <Plus className="h-3 w-3 mr-1" /> Add spec
          </Button>
        </div>
        <div className="space-y-2">
          {specEntries.map(([k, v], i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder="Label" value={k} onChange={(e) => {
                const next: Record<string, string> = {};
                specEntries.forEach(([kk, vv], ii) => { next[ii === i ? e.target.value : kk] = vv; });
                set({ specs: next });
              }} />
              <Input placeholder="Value" value={v} onChange={(e) => set({ specs: { ...(value.specs || {}), [k]: e.target.value } })} />
              <Button type="button" variant="ghost" size="icon" onClick={() => {
                const next = { ...(value.specs || {}) }; delete next[k]; set({ specs: next });
              }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </div>

      {/* Media */}
      <div className="grid md:grid-cols-2 gap-4">
        <MediaUploader label="Main image" accept="image" value={value.image_url || null}
          onChange={(p) => set({ image_url: p })} folder={`products/${value.slug || "new"}`} />
        <MediaUploader label="Product video" accept="video" value={value.video_url || null}
          onChange={(p) => set({ video_url: p })} folder={`products/${value.slug || "new"}`} />
      </div>
      <GalleryUploader value={value.gallery || []} onChange={(g) => set({ gallery: g })} />
    </div>
  );
}

function CategoryForm({ value, onChange }: { value: Partial<Category>; onChange: (v: Partial<Category>) => void }) {
  const set = (patch: Partial<Category>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Name</Label>
          <Input value={value.name || ""} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div>
          <Label>Slug</Label>
          <Input value={value.slug || ""} onChange={(e) => set({ slug: e.target.value })} placeholder="auto-generated" />
        </div>
        <div>
          <Label>Sort order</Label>
          <Input type="number" value={value.sort_order ?? 0} onChange={(e) => set({ sort_order: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="flex items-end gap-2">
          <Switch checked={!!value.active} onCheckedChange={(v) => set({ active: v })} />
          <Label>Active</Label>
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea rows={3} value={value.description || ""} onChange={(e) => set({ description: e.target.value })} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <MediaUploader label="Category image" accept="image" value={value.image_url || null}
          onChange={(p) => set({ image_url: p })} folder={`categories/${value.slug || "new"}`} />
        <MediaUploader label="Category video" accept="video" value={value.video_url || null}
          onChange={(p) => set({ video_url: p })} folder={`categories/${value.slug || "new"}`} />
      </div>
    </div>
  );
}
