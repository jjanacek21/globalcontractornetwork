import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ClipboardList, Plus, Copy, Pencil, Trash2, Loader2, CheckSquare, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Checklist {
  id: string;
  name: string;
  category: string;
  items: string[];
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = ["Roofing", "General", "Remediation", "Windows", "Gutters", "Siding", "Interior"];

export function InspectionsSettings() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "Roofing", items: [] as string[] });
  const [newItem, setNewItem] = useState("");

  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ["inspection-checklists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspection_checklists")
        .select("*")
        .order("category")
        .order("name");
      if (error) throw error;
      return (data as any[]).map(c => ({ ...c, items: Array.isArray(c.items) ? c.items : [] })) as Checklist[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      const row = { name: values.name.trim(), category: values.category, items: values.items };
      if (values.id) {
        const { error } = await supabase.from("inspection_checklists").update(row).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("inspection_checklists").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspection-checklists"] });
      toast.success(editingId ? "Checklist updated" : "Checklist created");
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inspection_checklists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspection-checklists"] });
      toast.success("Checklist deleted");
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (c: Checklist) => {
      const { error } = await supabase.from("inspection_checklists").insert({
        name: `${c.name} (Copy)`, category: c.category, items: c.items,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspection-checklists"] });
      toast.success("Checklist duplicated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => { setEditingId(null); setForm({ name: "", category: "Roofing", items: [] }); setNewItem(""); setDialogOpen(true); };
  const openEdit = (c: Checklist) => {
    setEditingId(c.id);
    setForm({ name: c.name, category: c.category, items: [...c.items] });
    setNewItem("");
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };

  const addItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    if (form.items.includes(trimmed)) return toast.error("Item already exists");
    setForm(prev => ({ ...prev, items: [...prev.items, trimmed] }));
    setNewItem("");
  };
  const removeItem = (idx: number) => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("Checklist name is required");
    if (form.items.length === 0) return toast.error("Add at least one checklist item");
    upsertMutation.mutate(editingId ? { ...form, id: editingId } : form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Inspection Templates</h2>
          <p className="text-sm text-muted-foreground mt-1">{checklists.length} checklist template{checklists.length !== 1 ? "s" : ""} for field inspections</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />New Template</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : checklists.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="font-semibold text-lg mb-1">No inspection templates yet</p>
            <p className="text-sm mb-4">Create your first checklist template to standardize field inspections.</p>
            <Button onClick={openCreate} variant="outline" className="gap-2"><Plus className="h-4 w-4" />Create Your First Template</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {checklists.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div>
                  <h3 className="font-semibold text-sm">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" /> {c.items.length} items
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px]">{c.category}</Badge>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(c)}>
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => duplicateMutation.mutate(c)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => setDeleteId(c.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Checklist" : "Create Checklist Template"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Roof Inspection" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <Label>Checklist Items ({form.items.length})</Label>
              <div className="flex gap-2">
                <Input
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  placeholder="Add checklist item..."
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
                />
                <Button variant="outline" size="sm" onClick={addItem} className="shrink-0">Add</Button>
              </div>
              {form.items.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50 group">
                      <span className="text-sm flex items-center gap-2">
                        <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        {item}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeItem(idx)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
            <AlertDialogTitle>Delete Checklist Template</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this inspection template.</AlertDialogDescription>
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
