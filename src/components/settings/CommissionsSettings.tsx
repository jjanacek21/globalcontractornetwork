import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, Pencil, Trash2, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CommissionRule {
  id: string;
  rep_name: string;
  commission_percent: number;
  bonus_threshold: number | null;
  bonus_percent: number | null;
  payment_schedule: string;
  is_active: boolean;
}

const SCHEDULES = ["weekly", "bi-weekly", "monthly", "per-job"];
const emptyForm = { rep_name: "", commission_percent: "10", bonus_threshold: "", bonus_percent: "", payment_schedule: "bi-weekly" };

export function CommissionsSettings() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["commission-rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("commission_rules").select("*").order("commission_percent");
      if (error) throw error;
      return data as CommissionRule[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      const row = {
        rep_name: values.rep_name.trim(),
        commission_percent: Number(values.commission_percent),
        bonus_threshold: values.bonus_threshold ? Number(values.bonus_threshold) : null,
        bonus_percent: values.bonus_percent ? Number(values.bonus_percent) : null,
        payment_schedule: values.payment_schedule,
      };
      if (values.id) {
        const { error } = await supabase.from("commission_rules").update(row).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("commission_rules").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-rules"] });
      toast.success(editingId ? "Commission rule updated" : "Commission rule created");
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("commission_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-rules"] });
      toast.success("Commission rule deleted");
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (r: CommissionRule) => {
    setEditingId(r.id);
    setForm({
      rep_name: r.rep_name,
      commission_percent: String(r.commission_percent),
      bonus_threshold: r.bonus_threshold ? String(r.bonus_threshold) : "",
      bonus_percent: r.bonus_percent ? String(r.bonus_percent) : "",
      payment_schedule: r.payment_schedule,
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); };

  const handleSubmit = () => {
    if (!form.rep_name.trim()) return toast.error("Rep name is required");
    upsertMutation.mutate(editingId ? { ...form, id: editingId } : form);
  };

  const update = (f: string, v: string) => setForm(prev => ({ ...prev, [f]: v }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Commission Rules</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure commission structures for your sales team</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Rule</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : rules.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No commission rules yet</p>
              <Button onClick={openCreate} variant="outline" className="mt-4 gap-2"><Plus className="h-4 w-4" />Add Rule</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rep / Tier Name</TableHead>
                  <TableHead className="text-right">Commission %</TableHead>
                  <TableHead className="text-right">Bonus Threshold</TableHead>
                  <TableHead className="text-right">Bonus %</TableHead>
                  <TableHead>Payment Schedule</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.rep_name}</TableCell>
                    <TableCell className="text-right font-medium text-primary">{r.commission_percent}%</TableCell>
                    <TableCell className="text-right">{r.bonus_threshold ? `$${Number(r.bonus_threshold).toLocaleString()}` : "—"}</TableCell>
                    <TableCell className="text-right">{r.bonus_percent ? `${r.bonus_percent}%` : "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{r.payment_schedule.replace("-", " ")}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
          <DialogHeader><DialogTitle>{editingId ? "Edit Commission Rule" : "Add Commission Rule"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rep / Tier Name</Label>
              <Input value={form.rep_name} onChange={e => update("rep_name", e.target.value)} placeholder="e.g. Senior Rep or John Smith" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Commission %</Label>
                <Input type="number" min="0" max="100" step="0.5" value={form.commission_percent} onChange={e => update("commission_percent", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Payment Schedule</Label>
                <Select value={form.payment_schedule} onValueChange={v => update("payment_schedule", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SCHEDULES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("-", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bonus Threshold ($)</Label>
                <Input type="number" min="0" step="1000" value={form.bonus_threshold} onChange={e => update("bonus_threshold", e.target.value)} placeholder="e.g. 50000" />
              </div>
              <div className="space-y-2">
                <Label>Bonus %</Label>
                <Input type="number" min="0" max="100" step="0.5" value={form.bonus_percent} onChange={e => update("bonus_percent", e.target.value)} placeholder="e.g. 2" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Save Changes" : "Add Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Commission Rule</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this commission rule.</AlertDialogDescription>
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
