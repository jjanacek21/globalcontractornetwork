import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, UserPlus, Shield, Loader2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

type CompanyRole = "company_admin" | "manager" | "project_manager" | "sales_rep" | "crew";

const ROLE_LABELS: Record<CompanyRole, string> = {
  company_admin: "Admin",
  manager: "Manager",
  project_manager: "Project Manager",
  sales_rep: "Sales Rep",
  crew: "Installer",
};

export function UsersSettings() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", first_name: "", last_name: "", role: "sales_rep" as CompanyRole, job_title: "" });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["company-members-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      // Resolve current user's company
      const { data: me } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      if (!me?.company_id) return [];
      const { data, error } = await supabase
        .from("company_members")
        .select(`
          id, role, job_title, is_active, hire_date, created_at, user_id, company_id,
          profiles:user_id ( first_name, last_name, email )
        `)
        .eq("company_id", me.company_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Team Members</h2>
          <p className="text-sm text-muted-foreground mt-1">{members.length} member{members.length !== 1 ? "s" : ""} on your team</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="gap-2"><UserPlus className="h-4 w-4" />Invite User</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : members.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No team members yet</p>
              <p className="text-sm mt-1">Invite your first team member to get started.</p>
              <Button onClick={() => setInviteOpen(true)} variant="outline" className="mt-4 gap-2"><UserPlus className="h-4 w-4" />Invite User</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(m => {
                  const profile = m.profiles;
                  const name = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "Unknown";
                  const email = profile?.email || "—";
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell className="text-muted-foreground">{email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {m.role === "company_admin" && <Shield className="h-3 w-3" />}
                          {ROLE_LABELS[m.role as CompanyRole] || m.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.job_title || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={m.is_active ? "default" : "secondary"}>{m.is_active ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info("Edit member coming soon")}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Roles & Permissions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { role: "Admin", desc: "Full access to all settings, billing, and team management" },
            { role: "Manager", desc: "Manage team, contacts, jobs, and view reports" },
            { role: "Project Manager", desc: "Manage jobs, schedules, inspections, and field teams" },
            { role: "Sales Rep", desc: "Manage contacts, leads, create estimates, and track commissions" },
            { role: "Installer", desc: "View assigned jobs, update job status, and upload photos" },
          ].map(r => (
            <div key={r.role} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="font-medium text-sm">{r.role}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={inviteForm.email} onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))} placeholder="teammate@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteForm.role} onValueChange={v => setInviteForm(p => ({ ...p, role: v as CompanyRole }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Job Title (optional)</Label>
              <Input value={inviteForm.job_title} onChange={e => setInviteForm(p => ({ ...p, job_title: e.target.value }))} placeholder="e.g. Senior Estimator" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast.info("Invitation system coming soon — user must register first, then be added as a team member."); setInviteOpen(false); }}>
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
