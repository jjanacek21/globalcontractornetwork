import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Save, X, Mail, Phone, Building2, MapPin, Globe, Calendar, ShieldCheck, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface Company {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  website?: string | null;
  description?: string | null;
  verification_status?: string | null;
  verification_score?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
  insurance_expiration?: string | null;
  workers_comp_expiration?: string | null;
  license_number?: string | null;
  license_state?: string | null;
  license_expiration?: string | null;
  primary_category?: string | null;
  years_in_business?: number | null;
}

interface CompanyManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  mode: 'view' | 'edit' | 'add';
  onModeChange: (mode: 'view' | 'edit' | 'add') => void;
  onRefresh: () => void;
}

const VERIFICATION_STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'suspended'];
const CATEGORY_OPTIONS = [
  'Roofing', 'Solar', 'HVAC', 'Plumbing', 'Electrical', 
  'General Contractor', 'Windows & Doors', 'Painting', 'Flooring', 'Other'
];

export function CompanyManagementDialog({ 
  open, 
  onOpenChange, 
  company,
  mode, 
  onModeChange,
  onRefresh 
}: CompanyManagementDialogProps) {
  const [formData, setFormData] = useState<Partial<Company>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (company) {
      setFormData({ ...company });
    } else if (mode === 'add') {
      setFormData({ is_active: true, verification_status: 'pending' });
    }
  }, [company, mode]);

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: "Company name is required", variant: "destructive" });
      return;
    }
    
    setSaving(true);
    try {
      const companyData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        website: formData.website,
        description: formData.description,
        verification_status: formData.verification_status,
        is_active: formData.is_active,
        primary_category: formData.primary_category,
        years_in_business: formData.years_in_business,
        license_number: formData.license_number,
        license_state: formData.license_state,
        license_expiration: formData.license_expiration,
        insurance_expiration: formData.insurance_expiration,
        workers_comp_expiration: formData.workers_comp_expiration,
      };

      if (mode === 'add') {
        const { error } = await supabase
          .from("permit_companies")
          .insert(companyData);
        if (error) throw error;
        toast({ title: "Company created successfully" });
      } else if (company) {
        const { error } = await supabase
          .from("permit_companies")
          .update(companyData)
          .eq('id', company.id);
        if (error) throw error;
        toast({ title: "Company updated successfully" });
      }
      
      onOpenChange(false);
      onRefresh();
    } catch (error: any) {
      toast({ 
        title: mode === 'add' ? "Error creating company" : "Error updating company", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!company) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("permit_companies")
        .delete()
        .eq('id', company.id);

      if (error) throw error;

      toast({ title: "Company deleted successfully" });
      onOpenChange(false);
      onRefresh();
    } catch (error: any) {
      toast({ 
        title: "Error deleting company", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setDeleting(false);
    }
  };

  const updateField = (field: keyof Company, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isEditable = mode === 'edit' || mode === 'add';
  const isAddMode = mode === 'add';

  if (!company && !isAddMode) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isAddMode ? "Add New Company" : company?.name}
          </DialogTitle>
          {!isAddMode && (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={formData.is_active ? "default" : "secondary"}>
                {formData.is_active ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline">{formData.verification_status || "pending"}</Badge>
              {company?.created_at && (
                <span className="text-xs text-muted-foreground">
                  Created {format(new Date(company.created_at), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company Name *</Label>
                {isEditable ? (
                  <Input value={formData.name || ''} onChange={e => updateField('name', e.target.value)} />
                ) : (
                  <p className="mt-1 text-sm font-medium">{company?.name}</p>
                )}
              </div>
              <div>
                <Label>Category</Label>
                {isEditable ? (
                  <Select value={formData.primary_category || ''} onValueChange={v => updateField('primary_category', v)}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 text-sm">{company?.primary_category || 'N/A'}</p>
                )}
              </div>
              <div>
                <Label>Email</Label>
                {isEditable ? (
                  <Input type="email" value={formData.email || ''} onChange={e => updateField('email', e.target.value)} />
                ) : (
                  <p className="mt-1 text-sm flex items-center gap-1"><Mail className="h-3 w-3" />{company?.email || 'N/A'}</p>
                )}
              </div>
              <div>
                <Label>Phone</Label>
                {isEditable ? (
                  <Input value={formData.phone || ''} onChange={e => updateField('phone', e.target.value)} />
                ) : (
                  <p className="mt-1 text-sm flex items-center gap-1"><Phone className="h-3 w-3" />{company?.phone || 'N/A'}</p>
                )}
              </div>
              <div>
                <Label>Website</Label>
                {isEditable ? (
                  <Input value={formData.website || ''} onChange={e => updateField('website', e.target.value)} placeholder="https://" />
                ) : (
                  <p className="mt-1 text-sm flex items-center gap-1"><Globe className="h-3 w-3" />{company?.website || 'N/A'}</p>
                )}
              </div>
              <div>
                <Label>Years in Business</Label>
                {isEditable ? (
                  <Input type="number" value={formData.years_in_business || ''} onChange={e => updateField('years_in_business', parseInt(e.target.value) || null)} />
                ) : (
                  <p className="mt-1 text-sm">{company?.years_in_business || 'N/A'}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Street Address</Label>
                {isEditable ? (
                  <Input value={formData.address || ''} onChange={e => updateField('address', e.target.value)} />
                ) : (
                  <p className="mt-1 text-sm flex items-center gap-1"><MapPin className="h-3 w-3" />{company?.address || 'N/A'}</p>
                )}
              </div>
              <div>
                <Label>City</Label>
                {isEditable ? (
                  <Input value={formData.city || ''} onChange={e => updateField('city', e.target.value)} />
                ) : (
                  <p className="mt-1 text-sm">{company?.city || 'N/A'}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>State</Label>
                  {isEditable ? (
                    <Input value={formData.state || ''} onChange={e => updateField('state', e.target.value)} />
                  ) : (
                    <p className="mt-1 text-sm">{company?.state || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>ZIP</Label>
                  {isEditable ? (
                    <Input value={formData.zip_code || ''} onChange={e => updateField('zip_code', e.target.value)} />
                  ) : (
                    <p className="mt-1 text-sm">{company?.zip_code || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Verification & Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Verification & Status
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Verification Status</Label>
                {isEditable ? (
                  <Select value={formData.verification_status || 'pending'} onValueChange={v => updateField('verification_status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_STATUS_OPTIONS.map(s => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className="mt-1 capitalize">{company?.verification_status || 'pending'}</Badge>
                )}
              </div>
              <div>
                <Label>Active Status</Label>
                {isEditable ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      checked={formData.is_active ?? true}
                      onCheckedChange={(checked) => updateField('is_active', checked)}
                    />
                    <span className="text-sm">{formData.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                ) : (
                  <Badge variant={company?.is_active ? "default" : "secondary"} className="mt-1">
                    {company?.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                )}
              </div>
              <div>
                <Label>Verification Score</Label>
                <p className="mt-1 text-sm font-medium">{company?.verification_score || 0}/100</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Credentials */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Credentials & Licenses
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>License Number</Label>
                {isEditable ? (
                  <Input value={formData.license_number || ''} onChange={e => updateField('license_number', e.target.value)} />
                ) : (
                  <p className="mt-1 text-sm">{company?.license_number || 'N/A'}</p>
                )}
              </div>
              <div>
                <Label>License State</Label>
                {isEditable ? (
                  <Input value={formData.license_state || ''} onChange={e => updateField('license_state', e.target.value)} />
                ) : (
                  <p className="mt-1 text-sm">{company?.license_state || 'N/A'}</p>
                )}
              </div>
              <div>
                <Label>License Expiration</Label>
                {isEditable ? (
                  <Input type="date" value={formData.license_expiration?.split('T')[0] || ''} onChange={e => updateField('license_expiration', e.target.value)} />
                ) : (
                  <p className="mt-1 text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {company?.license_expiration ? format(new Date(company.license_expiration), 'MMM d, yyyy') : 'N/A'}
                  </p>
                )}
              </div>
              <div>
                <Label>Insurance Expiration</Label>
                {isEditable ? (
                  <Input type="date" value={formData.insurance_expiration?.split('T')[0] || ''} onChange={e => updateField('insurance_expiration', e.target.value)} />
                ) : (
                  <p className="mt-1 text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {company?.insurance_expiration ? format(new Date(company.insurance_expiration), 'MMM d, yyyy') : 'N/A'}
                  </p>
                )}
              </div>
              <div>
                <Label>Workers Comp Expiration</Label>
                {isEditable ? (
                  <Input type="date" value={formData.workers_comp_expiration?.split('T')[0] || ''} onChange={e => updateField('workers_comp_expiration', e.target.value)} />
                ) : (
                  <p className="mt-1 text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {company?.workers_comp_expiration ? format(new Date(company.workers_comp_expiration), 'MMM d, yyyy') : 'N/A'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <Label>Description</Label>
            {isEditable ? (
              <Textarea value={formData.description || ''} onChange={e => updateField('description', e.target.value)} rows={3} />
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">{company?.description || 'No description'}</p>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
          {!isAddMode && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Company</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {company?.name}? This action cannot be undone and will affect all associated contractors.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <div className="flex gap-2 ml-auto">
            {mode === 'view' ? (
              <Button onClick={() => onModeChange('edit')}>
                Edit Company
              </Button>
            ) : isAddMode ? (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving || !formData.name}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Create Company
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => onModeChange('view')}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving || !formData.name}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
