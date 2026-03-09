import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Zap, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AutomationRule {
  id: string;
  name: string;
  trigger_event: string;
  trigger_label: string;
  action_type: string;
  action_label: string;
  is_active: boolean;
  total_runs: number;
}

const TRIGGERS = [
  { value: "lead_created", label: "Lead created" },
  { value: "estimate_viewed", label: "Estimate opened by customer" },
  { value: "estimate_no_response_48h", label: "48 hours after estimate sent" },
  { value: "job_completed", label: "Job status → Complete" },
  { value: "appointment_scheduled", label: "Appointment scheduled" },
  { value: "invoice_overdue", label: "Invoice overdue" },
  { value: "contract_signed", label: "Contract signed" },
];

const ACTIONS = [
  { value: "send_email", label: "Send email" },
  { value: "push_notification", label: "Push notification to rep" },
  { value: "create_calendar_event", label: "Create calendar event" },
  { value: "create_task", label: "Create follow-up task" },
  { value: "update_status", label: "Update record status" },
];

export function AutomationsSettings() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", trigger_event: "lead_created", action_type: "send_email" });

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("automation_rules").select("*").order("created_at");
      if (error) throw error;
      return data as AutomationRule[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("automation_rules").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast.success("Automation updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      const trigger = TRIGGERS.find(t => t.value === values.trigger_event);
      const action = ACTIONS.find(a => a.value === values.action_type);
      const row = {
        name: values.name.trim(),
        trigger_event: values.trigger_event,
        trigger_label: trigger?.label || values.trigger_event,
        action_type: values.action_type,
        action_label: action?.label || values.action_type,
      };
      if (values.id) {
        const { error } = await supabase.from("automation_rules").update(row).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("automation_rules").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast.success(editingId ? "Automation updated" : "Automation created");
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automation_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast.success("Automation deleted");
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => { setEditingId(null); setForm({ name: "", trigger_event: "lead_created", action_type: "send_email" }); setDialogOpen(true); };
  const openEdit = (a: AutomationRule) => {
    setEditingId(a.id);
    setForm({ name: a.name, trigger_event: a.trigger_event, action_type: a.action_type });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("Automation name is required");
    upsertMutation.mutate(editingId ? { ...form, id: editingId } : form);
  };

  const activeCount = automations.filter(a => a.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Automations</h2>
          <p className="text-sm text-muted-foreground mt-1">{activeCount} active of {automations.length} automation{automations.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />New Automation</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : automations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="font-semibold text-lg mb-1">No automations yet</p>
            <p className="text-sm mb-4">Create workflow automations to save time on repetitive tasks.</p>
            <Button onClick={openCreate} variant="outline" className="gap-2"><Plus className="h-4 w-4" />Create Your First Automation</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {automations.map(a => (
            <Card key={a.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <Switch checked={a.is_active} onCheckedChange={(checked) => toggleMutation.mutate({ id: a.id, is_active: checked })} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{a.name}</h3>
                    <Badge variant={a.is_active ? "default" : "secondary"} className="text-[10px]">{a.is_active ? "Active" : "Paused"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-medium">When:</span> {a.trigger_label} → <span className="font-medium">Then:</span> {a.action_label}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">{a.total_runs}</p>
                  <p className="text-[10px] text-muted-foreground">total runs</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Automation" : "Create Automation"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Automation Name</Label>
              <Input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. New Lead → Welcome Email" />
            </div>
            <div className="space-y-2">
              <Label>When (Trigger)</Label>
              <Select value={form.trigger_event} onValueChange={v => setForm(prev => ({ ...prev, trigger_event: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TRIGGERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Then (Action)</Label>
              <Select value={form.action_type} onValueChange={v => setForm(prev => ({ ...prev, action_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACTIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Save Changes" : "Create Automation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Automation</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this automation rule.</AlertDialogDescription>
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
