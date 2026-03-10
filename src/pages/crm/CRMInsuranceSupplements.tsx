import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileStack, Loader2, Trash2 } from "lucide-react";

interface Supplement {
  id: string;
  claim_reference: string | null;
  amount_requested: number;
  amount_approved: number;
  status: string;
  date_submitted: string | null;
  notes: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
  partial: "bg-orange-100 text-orange-800",
};

export default function CRMInsuranceSupplements() {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ claim_reference: "", amount_requested: "", amount_approved: "", status: "draft", date_submitted: "", notes: "" });
  const { toast } = useToast();

  const load = async () => {
    const { data } = await (supabase as any).from("insurance_supplements").select("*").order("created_at", { ascending: false });
    setSupplements((data as Supplement[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }
    const { error } = await supabase.from("insurance_supplements").insert({
      user_id: session.user.id,
      claim_reference: form.claim_reference || null,
      amount_requested: parseFloat(form.amount_requested) || 0,
      amount_approved: parseFloat(form.amount_approved) || 0,
      status: form.status,
      date_submitted: form.date_submitted || null,
      notes: form.notes || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Supplement added" }); setForm({ claim_reference: "", amount_requested: "", amount_approved: "", status: "draft", date_submitted: "", notes: "" }); setOpen(false); load(); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    await supabase.from("insurance_supplements").delete().eq("id", id);
    load();
  };

  const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Supplements</h1>
          <p className="text-muted-foreground">Track supplement requests and approvals</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Supplement</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Supplement</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Claim Reference</Label><Input value={form.claim_reference} onChange={e => setForm(p => ({ ...p, claim_reference: e.target.value }))} placeholder="CLM-2024-001" /></div>
              <div><Label>Amount Requested</Label><Input type="number" step="0.01" value={form.amount_requested} onChange={e => setForm(p => ({ ...p, amount_requested: e.target.value }))} placeholder="5000.00" /></div>
              <div><Label>Amount Approved</Label><Input type="number" step="0.01" value={form.amount_approved} onChange={e => setForm(p => ({ ...p, amount_approved: e.target.value }))} placeholder="0.00" /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date Submitted</Label><Input type="date" value={form.date_submitted} onChange={e => setForm(p => ({ ...p, date_submitted: e.target.value }))} /></div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : supplements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileStack className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No supplements yet. Add your first supplement request.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim Ref</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplements.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.claim_reference || "—"}</TableCell>
                    <TableCell>{fmt(s.amount_requested)}</TableCell>
                    <TableCell>{fmt(s.amount_approved)}</TableCell>
                    <TableCell><Badge className={statusColors[s.status] || ""}>{s.status.replace("_", " ")}</Badge></TableCell>
                    <TableCell>{s.date_submitted || "—"}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
