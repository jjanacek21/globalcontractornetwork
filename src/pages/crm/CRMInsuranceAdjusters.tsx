import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, UserCheck, Loader2, Trash2 } from "lucide-react";

interface Adjuster {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  carrier_id: string | null;
  notes: string | null;
  created_at: string;
  insurance_carriers?: { name: string } | null;
}

interface Carrier { id: string; name: string; }

export default function CRMInsuranceAdjusters() {
  const [adjusters, setAdjusters] = useState<Adjuster[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", carrier_id: "", notes: "" });
  const { toast } = useToast();

  const load = async () => {
    const [{ data: adj }, { data: carr }] = await Promise.all([
      (supabase as any).from("insurance_adjusters").select("*, insurance_carriers(name)").order("created_at", { ascending: false }),
      (supabase as any).from("insurance_carriers").select("id, name").order("name"),
    ]);
    setAdjusters((adj as Adjuster[]) || []);
    setCarriers((carr as Carrier[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }
    const { error } = await (supabase as any).from("insurance_adjusters").insert({
      user_id: session.user.id,
      name: form.name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      carrier_id: form.carrier_id || null,
      notes: form.notes || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Adjuster added" }); setForm({ name: "", phone: "", email: "", carrier_id: "", notes: "" }); setOpen(false); load(); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    await supabase.from("insurance_adjusters").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Insurance Adjusters</h1>
          <p className="text-muted-foreground">Track adjusters assigned to your claims</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Adjuster</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Adjuster</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="John Smith" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div>
                <Label>Carrier</Label>
                <Select value={form.carrier_id} onValueChange={v => setForm(p => ({ ...p, carrier_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                  <SelectContent>
                    {carriers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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
          ) : adjusters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <UserCheck className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No adjusters yet. Add your first adjuster.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjusters.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.insurance_carriers?.name || "—"}</TableCell>
                    <TableCell>{a.phone || "—"}</TableCell>
                    <TableCell>{a.email || "—"}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
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
