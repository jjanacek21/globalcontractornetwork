import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Trash2 } from "lucide-react";

interface CompanyMember {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  manager_id: string | null;
  team_id: string | null;
  is_active: boolean;
  job_title: string | null;
  hire_date: string | null;
  created_at: string;
  profile?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  company?: {
    name: string;
  };
}

interface Company {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  company_id: string;
}

interface Manager {
  id: string;
  job_title: string | null;
  profile?: {
    first_name: string | null;
    last_name: string | null;
  };
}

interface UserManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: CompanyMember | null;
  mode: 'view' | 'edit' | 'add';
  onModeChange: (mode: 'view' | 'edit' | 'add') => void;
  onRefresh: () => void;
}

const COMPANY_ROLES = [
  { value: 'company_admin', label: 'Company Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'sales_rep', label: 'Sales Rep' },
  { value: 'crew', label: 'Crew' },
];

export function UserManagementDialog({ open, onOpenChange, member, mode, onModeChange, onRefresh }: UserManagementDialogProps) {
  const [formData, setFormData] = useState<Partial<CompanyMember> & { email?: string }>({});
  const [companies, setCompanies] = useState<Company[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (member && mode !== 'add') {
      setFormData({
        ...member,
        email: member.profile?.email,
      });
      if (member.company_id) {
        fetchTeamsAndManagers(member.company_id);
      }
    } else if (mode === 'add') {
      setFormData({ is_active: true, role: 'sales_rep' });
    }
  }, [member, mode]);

  const fetchCompanies = async () => {
    const { data } = await supabase.from('companies').select('id, name').eq('is_active', true).order('name');
    setCompanies(data || []);
  };

  const fetchTeamsAndManagers = async (companyId: string) => {
    const [teamsResult, managersResult] = await Promise.all([
      supabase.from('teams').select('id, name, company_id').eq('company_id', companyId),
      supabase.from('company_members').select('id, job_title').eq('company_id', companyId).in('role', ['company_admin', 'manager', 'project_manager']),
    ]);
    setTeams(teamsResult.data || []);
    setManagers(managersResult.data || []);
  };

  const handleCompanyChange = (companyId: string) => {
    setFormData({ ...formData, company_id: companyId, team_id: null, manager_id: null });
    fetchTeamsAndManagers(companyId);
  };

  const handleSave = async () => {
    if (mode === 'add') {
      if (!formData.email || !formData.company_id) {
        toast({ title: "Error", description: "Email and company are required", variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    try {
      if (mode === 'add') {
        // First, create the auth user with a temporary password
        const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email!,
          password: tempPassword,
          email_confirm: true,
        });

        if (authError) {
          // If admin API fails, try regular signup (will need email confirmation)
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: formData.email!,
            password: tempPassword,
          });
          
          if (signUpError) throw signUpError;
          
          if (signUpData.user) {
            const { error: memberError } = await supabase.from('company_members').insert({
              user_id: signUpData.user.id,
              company_id: formData.company_id!,
              role: (formData.role || 'sales_rep') as 'company_admin' | 'manager' | 'project_manager' | 'sales_rep' | 'crew',
              manager_id: formData.manager_id || null,
              team_id: formData.team_id || null,
              is_active: formData.is_active ?? true,
              job_title: formData.job_title || null,
            });
            if (memberError) throw memberError;
          }
        } else if (authData.user) {
          const { error: memberError } = await supabase.from('company_members').insert({
            user_id: authData.user.id,
            company_id: formData.company_id!,
            role: (formData.role || 'sales_rep') as 'company_admin' | 'manager' | 'project_manager' | 'sales_rep' | 'crew',
            manager_id: formData.manager_id || null,
            team_id: formData.team_id || null,
            is_active: formData.is_active ?? true,
            job_title: formData.job_title || null,
          });
          if (memberError) throw memberError;
        }

        toast({ 
          title: "Success", 
          description: "User created. They will receive an email to set their password." 
        });
      } else {
        const { error } = await supabase.from('company_members').update({
          role: formData.role as 'company_admin' | 'manager' | 'project_manager' | 'sales_rep' | 'crew',
          manager_id: formData.manager_id || null,
          team_id: formData.team_id || null,
          is_active: formData.is_active,
          job_title: formData.job_title || null,
        }).eq('id', member!.id);
        if (error) throw error;
        toast({ title: "Success", description: "User updated successfully" });
      }
      onOpenChange(false);
      onRefresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    if (!confirm("Are you sure you want to remove this user from the company?")) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from('company_members').delete().eq('id', member.id);
      if (error) throw error;
      toast({ title: "Success", description: "User removed from company" });
      onOpenChange(false);
      onRefresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const isViewMode = mode === 'view';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {mode === 'add' ? 'Add User' : mode === 'edit' ? 'Edit User' : 'User Details'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {mode === 'add' && (
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
          )}

          {mode !== 'add' && member?.profile && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">
                {member.profile.first_name} {member.profile.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{member.profile.email}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company *</Label>
              <Select
                value={formData.company_id || ''}
                onValueChange={handleCompanyChange}
                disabled={isViewMode || mode === 'edit'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={formData.role || 'sales_rep'}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input
                value={formData.job_title || ''}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                disabled={isViewMode}
                placeholder="e.g., Senior Sales Rep"
              />
            </div>

            <div className="space-y-2">
              <Label>Team</Label>
              <Select
                value={formData.team_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, team_id: value === 'none' ? null : value })}
                disabled={isViewMode || !formData.company_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Team</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Manager</Label>
            <Select
              value={formData.manager_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, manager_id: value === 'none' ? null : value })}
              disabled={isViewMode || !formData.company_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Manager</SelectItem>
                {managers.filter(m => m.id !== member?.id).map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.job_title || 'Manager'} (ID: {manager.id.slice(0, 8)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label>Active Status</Label>
              <p className="text-sm text-muted-foreground">User can access the CRM portal</p>
            </div>
            <Switch
              checked={formData.is_active ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              disabled={isViewMode}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {mode === 'view' && member && (
            <>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="sm:mr-auto">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Remove
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={() => onModeChange('edit')}>Edit User</Button>
            </>
          )}
          {(mode === 'edit' || mode === 'add') && (
            <>
              <Button variant="outline" onClick={() => mode === 'add' ? onOpenChange(false) : onModeChange('view')}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {mode === 'add' ? 'Create User' : 'Save Changes'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
