import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Package, Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
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
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  "Shingles", "Underlayment", "Starter Strip", "Ridge Cap", "Flashing",
  "Ice & Water Shield", "Drip Edge", "Nails", "Ventilation", "Sealants",
  "Coatings", "Lumber", "Accessories", "General",
];

const UNITS = ["SQ", "ROLL", "BD", "PC", "EA", "BOX", "GAL", "LF", "SF"];

const emptyForm = {
  name: "",
  category: "General",
  unit_of_measure: "EA",
  cost_per_unit: "",
  supplier: "",
  description: "",
  is_active: true,
};

export function MaterialsSettings() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["roofing-materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roofing_materials")
        .select("*")
        .order("category")
        .order("name");
      if (error) throw error;
      return data as RoofingMaterial[];
    },
  });

  const filtered = materials.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase()) ||
    (m.supplier ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const upsertMutation = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      const row = {
        name: values.name.trim(),
        category: values.category,
        unit_of_measure: values.unit_of_measure,
        cost_per_unit: Number(values.cost_per_unit),
        supplier: values.supplier.trim() || null,
        description: values.description.trim() || null,
        is_active: values.is_active,
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
      queryClient.invalidateQueries({ queryKey: ["roofing-materials"] });
      toast.success(editingId ? "Material updated" : "Material added");
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
      queryClient.invalidateQueries({ queryKey: ["roofing-materials"] });
      toast.success("Material deleted");
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (m: RoofingMaterial) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      category: m.category,
      unit_of_measure: m.unit_of_measure,
      cost_per_unit: String(m.cost_per_unit),
      supplier: m.supplier ?? "",
      description: m.description ?? "",
      is_active: m.is_active,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (!Number(form.cost_per_unit) && Number(form.cost_per_unit) !== 0) return toast.error("Cost must be a number");
    upsertMutation.mutate(editingId ? { ...form, id: editingId } : form);
  };

  const update = (field: string, value: string | boolean) => setForm(prev => ({ ...prev, [field]: value }));

  const activeCount = materials.filter(m => m.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" /> Materials Catalog
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {materials.length} materials • {activeCount} active
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Material
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, category, or supplier..." className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">{search ? "No materials match your search" : "No materials yet"}</p>
              {!search && (
                <Button onClick={openCreate} variant="outline" className="mt-4 gap-2">
                  <Plus className="h-4 w-4" /> Add Material
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Cost/Unit</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(m => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{m.name}</p>
                        {m.description && <p className="text-xs text-muted-foreground truncate max-w-[250px]">{m.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{m.category}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{m.unit_of_measure}</TableCell>
                    <TableCell className="text-right font-medium">${Number(m.cost_per_unit).toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">{m.supplier ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={m.is_active ? "default" : "secondary"}>{m.is_active ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(m.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Material" : "Add Material"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Material Name</Label>
              <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="e.g. GAF Timberline HDZ" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => update("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit of Measure</Label>
                <Select value={form.unit_of_measure} onValueChange={v => update("unit_of_measure", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cost Per Unit ($)</Label>
                <Input type="number" min="0" step="0.01" value={form.cost_per_unit} onChange={e => update("cost_per_unit", e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input value={form.supplier} onChange={e => update("supplier", e.target.value)} placeholder="e.g. ABC Supply" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => update("description", e.target.value)} placeholder="Optional description..." rows={2} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active as boolean} onCheckedChange={v => update("is_active", v)} />
              <Label>Active (available for estimates)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Save Changes" : "Add Material"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this material from your catalog. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
