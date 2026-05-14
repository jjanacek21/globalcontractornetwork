import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock, Mail, Phone, FileText, Loader2, UserCheck } from "lucide-react";

interface Props { companyId: string; }

interface PendingProfile {
  id: string;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  category: string;
  description: string | null;
  bio_short: string | null;
  license_number: string | null;
  license_state: string | null;
  team_id: string | null;
  profile_gallery: any;
  insurance_info: any;
  created_at: string | null;
  verification_status: string | null;
}

export const CompanyPendingUsersTab = ({ companyId }: Props) => {
  const [pending, setPending] = useState<PendingProfile[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PendingProfile | null>(null);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [role, setRole] = useState<string>("sales_rep");
  const [teamId, setTeamId] = useState<string>("");
  const [rejectReason, setRejectReason] = useState("");
  const [mode, setMode] = useState<"view" | "approve" | "reject">("view");
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const [{ data: profs }, { data: t }] = await Promise.all([
      supabase
        .from("contractor_profiles")
        .select("id, user_id, first_name, last_name, email, phone, category, description, bio_short, license_number, license_state, team_id, profile_gallery, insurance_info, created_at, verification_status")
        .eq("company_id", companyId)
        .eq("verification_status", "pending")
        .order("created_at", { ascending: false }),
      supabase.from("teams").select("id, name").eq("company_id", companyId).order("name"),
    ]);
    setPending((profs || []) as PendingProfile[]);
    setTeams(t || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [companyId]);

  const openProfile = (p: PendingProfile) => {
    setSelected(p);
    setRole("sales_rep");
    setTeamId(p.team_id || "");
    setRejectReason("");
    setMode("view");
  };

  const approve = async () => {
    if (!selected || !selected.user_id) return;
    setDecisionLoading(true);
    try {
      // Update contractor profile
      const { error: pErr } = await supabase
        .from("contractor_profiles")
        .update({
          verification_status: "approved",
          is_verified: true,
          approved_at: new Date().toISOString(),
          team_id: teamId || null,
        })
        .eq("id", selected.id);
      if (pErr) throw pErr;

      // Create company_members row (idempotent)
      const { error: mErr } = await supabase
        .from("company_members")
        .upsert({
          company_id: companyId,
          user_id: selected.user_id,
          role: role as any,
          team_id: teamId || null,
          is_active: true,
        }, { onConflict: "company_id,user_id" });
      if (mErr) throw mErr;

      toast({ title: "Approved", description: "Contractor added to your company." });
      setSelected(null);
      load();
    } catch (e: any) {
      toast({ title: "Error approving", description: e.message, variant: "destructive" });
    } finally {
      setDecisionLoading(false);
    }
  };

  const reject = async () => {
    if (!selected) return;
    setDecisionLoading(true);
    try {
      const { error } = await supabase
        .from("contractor_profiles")
        .update({
          verification_status: "rejected",
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectReason || "Not a fit for this company",
        })
        .eq("id", selected.id);
      if (error) throw error;
      toast({ title: "Rejected", description: "Application rejected." });
      setSelected(null);
      load();
    } catch (e: any) {
      toast({ title: "Error rejecting", description: e.message, variant: "destructive" });
    } finally {
      setDecisionLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" /> Pending Sub-Contractor Applications
        </CardTitle>
        <CardDescription>
          Review contractors who applied to join your company. Approve them to add them to your team and grant access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : pending.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
            No pending applications.
          </div>
        ) : (
          <div className="grid gap-3">
            {pending.map(p => (
              <div key={p.id} className="border rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-muted/30 transition">
                <div className="space-y-1">
                  <div className="font-medium">{p.first_name} {p.last_name}</div>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                    {p.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</span>}
                    {p.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone}</span>}
                    <Badge variant="outline" className="capitalize">{p.category}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openProfile(p)}>
                    <FileText className="h-4 w-4 mr-1" /> Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.first_name} {selected.last_name}</DialogTitle>
                <DialogDescription>{selected.category} · {selected.email}</DialogDescription>
              </DialogHeader>

              {mode === "view" && (
                <div className="space-y-4">
                  {selected.bio_short && <p className="text-sm">{selected.bio_short}</p>}
                  {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Phone:</span> {selected.phone || "—"}</div>
                    <div><span className="text-muted-foreground">License:</span> {selected.license_number ? `${selected.license_number} (${selected.license_state})` : "—"}</div>
                  </div>

                  {Array.isArray(selected.profile_gallery) && selected.profile_gallery.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Reference photos</div>
                      <div className="grid grid-cols-3 gap-2">
                        {selected.profile_gallery.slice(0, 9).map((img: any, i: number) => (
                          <img key={i} src={typeof img === "string" ? img : img.url} alt="" className="rounded border aspect-square object-cover" />
                        ))}
                      </div>
                    </div>
                  )}

                  {selected.insurance_info && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Insurance on file:</span>{" "}
                      <Badge variant="secondary">Provided</Badge>
                    </div>
                  )}

                  <DialogFooter className="gap-2">
                    <Button variant="destructive" onClick={() => setMode("reject")}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                    <Button onClick={() => setMode("approve")}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {mode === "approve" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company_admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="project_manager">Project Manager</SelectItem>
                        <SelectItem value="sales_rep">Sales Rep</SelectItem>
                        <SelectItem value="crew">Crew</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Team / Office</Label>
                    <Select value={teamId} onValueChange={setTeamId}>
                      <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No team</SelectItem>
                        {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setMode("view")}>Cancel</Button>
                    <Button onClick={approve} disabled={decisionLoading}>
                      {decisionLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      Confirm approval
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {mode === "reject" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Reason (optional, sent to applicant)</Label>
                    <Textarea rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setMode("view")}>Cancel</Button>
                    <Button variant="destructive" onClick={reject} disabled={decisionLoading}>
                      {decisionLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      Confirm rejection
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
