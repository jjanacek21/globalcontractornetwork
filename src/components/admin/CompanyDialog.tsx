import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Trash2 } from "lucide-react";

interface Company {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  mode: 'view' | 'edit' | 'add';
  onModeChange: (mode: 'view' | 'edit' | 'add') => void;
  onRefresh: () => void;
}

export function CompanyDialog({ open, onOpenChange, company, mode, onModeChange, onRefresh }: CompanyDialogProps) {
  const [formData, setFormData] = useState<Partial<Company>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (company && mode !== 'add') {
      setFormData(company);
    } else if (mode === 'add') {
      setFormData({ is_active: true });
    }
  }, [company, mode]);

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: "Error", description: "Company name is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (mode === 'add') {
        const { error } = await supabase.from('permit_companies').insert({
          name: formData.name,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          is_active: formData.is_active ?? true,
        });
        if (error) throw error;
        toast({ title: "Success", description: "Company created successfully" });
      } else {
        const { error } = await supabase.from('permit_companies').update({
          name: formData.name,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          is_active: formData.is_active,
        }).eq('id', company!.id);
        if (error) throw error;
        toast({ title: "Success", description: "Company updated successfully" });
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
    if (!company) return;
    if (!confirm("Are you sure you want to delete this company? This will also delete all associated members, teams, and work orders.")) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from('permit_companies').delete().eq('id', company.id);
      if (error) throw error;
      toast({ title: "Success", description: "Company deleted successfully" });
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
            <Building2 className="h-5 w-5" />
            {mode === 'add' ? 'Add Company' : mode === 'edit' ? 'Edit Company' : 'Company Details'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isViewMode}
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isViewMode}
                placeholder="company@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={isViewMode}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                disabled={isViewMode}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={isViewMode}
              placeholder="Street address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                disabled={isViewMode}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                disabled={isViewMode}
                placeholder="FL"
              />
            </div>
            <div className="space-y-2">
              <Label>ZIP Code</Label>
              <Input
                value={formData.zip_code || ''}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                disabled={isViewMode}
                placeholder="12345"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label>Active Status</Label>
              <p className="text-sm text-muted-foreground">Company is active and can be accessed</p>
            </div>
            <Switch
              checked={formData.is_active ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              disabled={isViewMode}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {mode === 'view' && company && (
            <>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="sm:mr-auto">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={() => onModeChange('edit')}>Edit Company</Button>
            </>
          )}
          {(mode === 'edit' || mode === 'add') && (
            <>
              <Button variant="outline" onClick={() => mode === 'add' ? onOpenChange(false) : onModeChange('view')}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {mode === 'add' ? 'Create Company' : 'Save Changes'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
