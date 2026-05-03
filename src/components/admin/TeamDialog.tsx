import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Trash2 } from "lucide-react";

interface Team {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  created_at: string;
  company?: {
    name: string;
  };
  member_count?: number;
}

interface Company {
  id: string;
  name: string;
}

interface Manager {
  id: string;
  job_title: string | null;
  user_id: string;
}

interface TeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
  mode: 'view' | 'edit' | 'add';
  onModeChange: (mode: 'view' | 'edit' | 'add') => void;
  onRefresh: () => void;
}

export function TeamDialog({ open, onOpenChange, team, mode, onModeChange, onRefresh }: TeamDialogProps) {
  const [formData, setFormData] = useState<Partial<Team>>({});
  const [companies, setCompanies] = useState<Company[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (team && mode !== 'add') {
      setFormData(team);
      if (team.company_id) {
        fetchManagers(team.company_id);
      }
    } else if (mode === 'add') {
      setFormData({});
    }
  }, [team, mode]);

  const fetchCompanies = async () => {
    const { data } = await supabase.from('permit_companies').select('id, name').eq('is_active', true).order('name');
    setCompanies(data || []);
  };

  const fetchManagers = async (companyId: string) => {
    const { data } = await supabase
      .from('company_members')
      .select('id, job_title, user_id')
      .eq('company_id', companyId)
      .in('role', ['company_admin', 'manager']);
    setManagers(data || []);
  };

  const handleCompanyChange = (companyId: string) => {
    setFormData({ ...formData, company_id: companyId, manager_id: null });
    fetchManagers(companyId);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.company_id) {
      toast({ title: "Error", description: "Team name and company are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (mode === 'add') {
        const { error } = await supabase.from('teams').insert({
          name: formData.name,
          company_id: formData.company_id,
          description: formData.description,
          manager_id: formData.manager_id,
        });
        if (error) throw error;
        toast({ title: "Success", description: "Team created successfully" });
      } else {
        const { error } = await supabase.from('teams').update({
          name: formData.name,
          description: formData.description,
          manager_id: formData.manager_id,
        }).eq('id', team!.id);
        if (error) throw error;
        toast({ title: "Success", description: "Team updated successfully" });
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
    if (!team) return;
    if (!confirm("Are you sure you want to delete this team? Team members will be unassigned from this team.")) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from('teams').delete().eq('id', team.id);
      if (error) throw error;
      toast({ title: "Success", description: "Team deleted successfully" });
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {mode === 'add' ? 'Add Team' : mode === 'edit' ? 'Edit Team' : 'Team Details'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
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
            <Label>Team Name *</Label>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isViewMode}
              placeholder="e.g., Sales Team Alpha"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isViewMode}
              placeholder="Brief description of the team..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Team Manager</Label>
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
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.job_title || 'Manager'} (ID: {manager.id.slice(0, 8)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === 'view' && team && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Members:</strong> {team.member_count || 0} team members
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {mode === 'view' && team && (
            <>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="sm:mr-auto">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={() => onModeChange('edit')}>Edit Team</Button>
            </>
          )}
          {(mode === 'edit' || mode === 'add') && (
            <>
              <Button variant="outline" onClick={() => mode === 'add' ? onOpenChange(false) : onModeChange('view')}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {mode === 'add' ? 'Create Team' : 'Save Changes'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
