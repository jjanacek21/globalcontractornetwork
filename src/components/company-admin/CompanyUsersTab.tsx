import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, UserPlus, Loader2 } from "lucide-react";

interface CompanyUsersTabProps {
  companyId: string;
}

interface CompanyMember {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  team_id: string | null;
  job_title: string | null;
  created_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  team?: {
    name: string;
  };
}

interface Team {
  id: string;
  name: string;
}

export const CompanyUsersTab = ({ companyId }: CompanyUsersTabProps) => {
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CompanyMember | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "sales_rep",
    team_id: "",
    job_title: "",
    password: ""
  });
  const { toast } = useToast();

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("company_members")
        .select(`
          *,
          team:teams(name)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profile data for each member
      const membersWithProfiles = await Promise.all((data || []).map(async (member) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("id", member.user_id)
          .single();
        return { ...member, profile };
      }));

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    const { data } = await supabase
      .from("teams")
      .select("id, name")
      .eq("company_id", companyId)
      .order("name");
    setTeams(data || []);
  };

  useEffect(() => {
    fetchMembers();
    fetchTeams();
  }, [companyId]);

  const handleCreateUser = async () => {
    try {
      setLoading(true);
      
      // Get current user info for "invited by" name
      const { data: { user } } = await supabase.auth.getUser();
      let invitedByName = 'Your company admin';
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          invitedByName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Your company admin';
        }
      }

      // Get company name
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();

      // Get team name if selected
      let teamName = '';
      if (formData.team_id) {
        const selectedTeam = teams.find(t => t.id === formData.team_id);
        teamName = selectedTeam?.name || '';
      }

      // Call the invitation edge function
      const { data, error } = await supabase.functions.invoke("invite-company-member", {
        body: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          companyId,
          companyName: company?.name || "Your Company",
          role: formData.role,
          teamId: formData.team_id || null,
          teamName,
          jobTitle: formData.job_title || null,
          invitedByName
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to send invitation');
      
      toast({ 
        title: "Invitation Sent!", 
        description: `An invitation email has been sent to ${formData.email}` 
      });
      setDialogOpen(false);
      resetForm();
      fetchMembers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;
    
    try {
      const { error } = await supabase
        .from("company_members")
        .update({
          role: formData.role as any,
          team_id: formData.team_id || null,
          job_title: formData.job_title || null
        })
        .eq("id", editingMember.id);

      if (error) throw error;
      
      toast({ title: "User Updated", description: "User has been updated successfully" });
      setDialogOpen(false);
      setEditingMember(null);
      resetForm();
      fetchMembers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this user from the company?")) return;
    
    try {
      const { error } = await supabase
        .from("company_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
      toast({ title: "User Removed", description: "User has been removed from the company" });
      fetchMembers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (member: CompanyMember) => {
    setEditingMember(member);
    setFormData({
      email: member.profile?.email || "",
      firstName: member.profile?.first_name || "",
      lastName: member.profile?.last_name || "",
      role: member.role,
      team_id: member.team_id || "",
      job_title: member.job_title || "",
      password: ""
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      role: "sales_rep",
      team_id: "",
      job_title: "",
      password: ""
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "company_admin":
        return <Badge className="bg-purple-500">Admin</Badge>;
      case "manager":
        return <Badge className="bg-blue-500">Manager</Badge>;
      case "project_manager":
        return <Badge className="bg-cyan-500">Project Manager</Badge>;
      case "sales_rep":
        return <Badge className="bg-green-500">Sales Rep</Badge>;
      case "crew":
        return <Badge variant="secondary">Crew</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Company Users
          </CardTitle>
          <CardDescription>Manage your company's team members and their roles</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingMember(null); resetForm(); }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMember ? "Edit User" : "Add New User"}</DialogTitle>
              <DialogDescription>
                {editingMember ? "Update user details and role" : "Create a new user for your company"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!editingMember && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Temporary Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Leave blank to auto-generate"
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Label htmlFor="team">Team</Label>
                <Select value={formData.team_id} onValueChange={(v) => setFormData({ ...formData, team_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Team</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  placeholder="e.g., Sales Manager"
                />
              </div>
              <Button 
                onClick={editingMember ? handleUpdateMember : handleCreateUser} 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingMember ? "Updating..." : "Sending Invitation..."}
                  </>
                ) : (
                  editingMember ? "Update User" : "Send Invitation"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading users...</p>
        ) : members.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No users added yet.</p>
            <p className="text-sm text-muted-foreground">Add team members to start managing your company.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.profile?.first_name} {member.profile?.last_name}
                  </TableCell>
                  <TableCell>{member.profile?.email}</TableCell>
                  <TableCell>{getRoleBadge(member.role)}</TableCell>
                  <TableCell>{member.team?.name || "-"}</TableCell>
                  <TableCell>{member.job_title || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={member.is_active ? "default" : "secondary"}>
                      {member.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(member)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(member.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
