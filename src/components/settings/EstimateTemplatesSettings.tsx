import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { FileText, Plus, Pencil, Trash2, Loader2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface EstimateTemplate {
  id: string;
  name: string;
  trade: string;
  material_cost_per_sq: number;
  labor_cost_per_sq: number;
  waste_factor: number;
  is_default: boolean | null;
  company_id: string | null;
  created_at: string | null;
}

const TRADES = [
  "Roofing", "Coatings", "Windows", "Doors", "Gutters",
  "Soffit/Fascia", "Siding", "Emergency", "Remediation", "General",
];

const emptyForm = {
  name: "",
  trade: "Roofing",
  material_cost_per_sq: "",
  labor_cost_per_sq: "",
  waste_factor: "10",
  is_default: false,
};

export function EstimateTemplatesSettings() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["estimate-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimate_templates")
        .select("*")
        .order("is_default", { ascending: false })
        .order("name");
      if (error) throw error;
      return data as EstimateTemplate[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      const row = {
        name: values.name.trim(),
        trade: values.trade,
        material_cost_per_sq: Number(values.material_cost_per_sq),
        labor_cost_per_sq: Number(values.labor_cost_per_sq),
        waste_factor: Number(values.waste_factor),
        is_default: values.is_default,
      };
      if (values.id) {
        const { error } = await supabase.from("estimate_templates").update(row).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("estimate_templates").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimate-templates"] });
      toast.success(editingId ? "Template updated" : "Template created");
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("estimate_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimate-templates"] });
      toast.success("Template deleted");
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (t: EstimateTemplate) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      trade: t.trade,
      material_cost_per_sq: String(t.material_cost_per_sq),
      labor_cost_per_sq: String(t.labor_cost_per_sq),
      waste_factor: String(t.waste_factor),
      is_default: t.is_default ?? false,
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
    if (!Number(form.material_cost_per_sq) && Number(form.material_cost_per_sq) !== 0) return toast.error("Material cost must be a number");
    if (!Number(form.labor_cost_per_sq) && Number(form.labor_cost_per_sq) !== 0) return toast.error("Labor cost must be a number");
    upsertMutation.mutate(editingId ? { ...form, id: editingId } : form);
  };

  const update = (field: string, value: string | boolean) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Estimate Templates
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pre-configured pricing templates for fast estimate generation
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Create Template
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No estimate templates yet</p>
              <p className="text-sm mt-1">Create your first template to speed up estimate generation.</p>
              <Button onClick={openCreate} variant="outline" className="mt-4 gap-2">
                <Plus className="h-4 w-4" /> Create Template
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead className="text-right">Material $/sq</TableHead>
                  <TableHead className="text-right">Labor $/sq</TableHead>
                  <TableHead className="text-right">Waste Factor</TableHead>
                  <TableHead className="text-center">Default</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t.trade}</Badge>
                    </TableCell>
                    <TableCell className="text-right">${t.material_cost_per_sq.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${t.labor_cost_per_sq.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{t.waste_factor}%</TableCell>
                    <TableCell className="text-center">
                      {t.is_default && <Star className="h-4 w-4 text-primary mx-auto fill-primary" />}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(t.id)}>
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
            <DialogTitle>{editingId ? "Edit Template" : "Create Estimate Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="e.g. Standard Shingle Reroof" />
            </div>
            <div className="space-y-2">
              <Label>Trade</Label>
              <Select value={form.trade} onValueChange={v => update("trade", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Material Cost ($/sq)</Label>
                <Input type="number" min="0" step="0.01" value={form.material_cost_per_sq} onChange={e => update("material_cost_per_sq", e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Labor Cost ($/sq)</Label>
                <Input type="number" min="0" step="0.01" value={form.labor_cost_per_sq} onChange={e => update("labor_cost_per_sq", e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Waste Factor (%)</Label>
              <Input type="number" min="0" max="50" step="1" value={form.waste_factor} onChange={e => update("waste_factor", e.target.value)} placeholder="10" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_default as boolean} onCheckedChange={v => update("is_default", v)} />
              <Label>Set as default template for this trade</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this estimate template. This action cannot be undone.
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
