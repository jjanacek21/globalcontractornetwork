import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Save, X, Mail, Phone, Building2, MapPin } from "lucide-react";
import { format } from "date-fns";

interface Contractor {
  id: string;
  source: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

interface ContractorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractor: Contractor | null;
  rawData: any;
  mode: 'view' | 'edit' | 'add';
  onModeChange: (mode: 'view' | 'edit' | 'add') => void;
  onRefresh: () => void;
}

const SOURCE_TABLE_MAP: Record<string, string> = {
  'Directory': 'contractor_profiles',
  'Estimating & Supplementing': 'supplement_contractors',
  'Permit Queens': 'permit_contractors',
};

const CATEGORY_OPTIONS = [
  'Roofing', 'Solar', 'HVAC', 'Plumbing', 'Electrical', 
  'General Contractor', 'Windows & Doors', 'Painting', 'Flooring', 'Other'
];

const CONTRACTOR_TYPE_OPTIONS = [
  { value: 'independent', label: 'Independent' },
  { value: 'subcontractor', label: 'Sub-Contractor' },
  { value: 'handyman', label: 'Handyman' },
];

const PROFILE_TYPE_OPTIONS = [
  { value: 'company', label: 'Company Rep' },
  { value: 'building_consultant', label: 'Building Consultant' },
  { value: 'handyman', label: 'Handyman' },
  { value: 'skilled_labor', label: 'Skilled Labor' },
];

const VERIFICATION_OPTIONS = ['pending', 'verified', 'rejected'];

interface CompanyOption {
  id: string;
  name: string;
}

interface TeamOption {
  id: string;
  name: string;
}

export function ContractorDialog({ 
  open, 
  onOpenChange, 
  contractor, 
  rawData,
  mode, 
  onModeChange,
  onRefresh 
}: ContractorDialogProps) {
  const [formData, setFormData] = useState<any>({});
  const [selectedSource, setSelectedSource] = useState<string>('Directory');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) fetchCompanies();
  }, [open]);

  useEffect(() => {
    if (rawData && mode !== 'add') {
      setFormData({ ...rawData });
    } else if (mode === 'add') {
      setFormData({});
      setSelectedSource('Directory');
    }
  }, [rawData, mode]);

  useEffect(() => {
    const companyId = formData.company_id;
    if (companyId) {
      fetchTeams(companyId);
    } else {
      setTeams([]);
    }
  }, [formData.company_id]);

  const fetchCompanies = async () => {
    const { data } = await supabase.from('companies').select('id, name').order('name');
    setCompanies(data || []);
  };

  const fetchTeams = async (companyId: string) => {
    const { data } = await supabase.from('teams').select('id, name').eq('company_id', companyId).order('name');
    setTeams(data || []);
  };

  const tableName = mode === 'add' 
    ? SOURCE_TABLE_MAP[selectedSource] 
    : contractor ? SOURCE_TABLE_MAP[contractor.source] : null;

  const handleSave = async () => {
    if (!tableName) return;
    
    setSaving(true);
    try {
      if (mode === 'add') {
        let insertData: any = {};
        
        if (selectedSource === 'Directory') {
          insertData = {
            company_name: formData.company_name,
            first_name: formData.first_name,
            last_name: formData.last_name,
            category: formData.category || 'Other',
            email: formData.email,
            phone: formData.phone,
            description: formData.description,
            bio: formData.bio,
            website: formData.website,
            logo_url: formData.logo_url,
            subscription_status: 'active',
            company_id: formData.company_id || null,
            team_id: formData.team_id || null,
            contractor_type: formData.contractor_type || 'independent',
            profile_type: formData.profile_type || 'company',
            verification_status: formData.verification_status || 'pending',
            license_number: formData.license_number,
            license_state: formData.license_state,
          };
        } else {
          insertData = {
            company_name: formData.company_name,
            contact_name: formData.contact_name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            license_number: formData.license_number,
            user_id: (await supabase.auth.getUser()).data.user?.id,
          };
        }

        const { error } = await supabase
          .from(tableName as any)
          .insert(insertData);

        if (error) throw error;
        toast({ title: "Contractor added successfully" });
      } else {
        const { error } = await supabase
          .from(tableName as any)
          .update(formData)
          .eq('id', contractor!.id);

        if (error) throw error;
        toast({ title: "Contractor updated successfully" });
      }

      onOpenChange(false);
      onRefresh();
    } catch (error: any) {
      toast({ 
        title: mode === 'add' ? "Error adding contractor" : "Error updating contractor", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!tableName || !contractor) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', contractor.id);

      if (error) throw error;

      toast({ title: "Contractor deleted successfully" });
      onOpenChange(false);
      onRefresh();
    } catch (error: any) {
      toast({ 
        title: "Error deleting contractor", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setDeleting(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleCompanyChange = (value: string) => {
    const companyId = value === 'none' ? null : value;
    setFormData((prev: any) => ({ ...prev, company_id: companyId, team_id: null }));
  };

  const isEditable = mode === 'edit' || mode === 'add';

  const renderCompanyTeamFields = () => (
    <>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Contractor Type</Label>
          {isEditable ? (
            <Select value={formData.contractor_type || 'independent'} onValueChange={v => updateField('contractor_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTRACTOR_TYPE_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="mt-1 text-sm capitalize">{rawData?.contractor_type || 'independent'}</p>
          )}
        </div>
        <div>
          <Label>Company</Label>
          {isEditable ? (
            <Select value={formData.company_id || 'none'} onValueChange={handleCompanyChange}>
              <SelectTrigger><SelectValue placeholder="No company" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Company</SelectItem>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {rawData?.company_id ? companies.find(c => c.id === rawData.company_id)?.name || 'Unknown' : 'None'}
            </p>
          )}
        </div>
        {(formData.company_id || rawData?.company_id) && (
          <div>
            <Label>Team</Label>
            {isEditable ? (
              <Select value={formData.team_id || 'none'} onValueChange={v => updateField('team_id', v === 'none' ? null : v)}>
                <SelectTrigger><SelectValue placeholder="No team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Team</SelectItem>
                  {teams.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="mt-1 text-sm">{rawData?.team_id ? teams.find(t => t.id === rawData.team_id)?.name || 'Unknown' : 'None'}</p>
            )}
          </div>
        )}
      </div>
    </>
  );

  const renderDirectoryFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Profile Type *</Label>
          {isEditable ? (
            <Select value={formData.profile_type || 'company'} onValueChange={v => updateField('profile_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROFILE_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <p className="mt-1 text-sm capitalize">{(rawData?.profile_type || 'company').replace('_', ' ')}</p>
          )}
        </div>
        <div>
          <Label>Verification Status</Label>
          {isEditable ? (
            <Select value={formData.verification_status || 'pending'} onValueChange={v => updateField('verification_status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VERIFICATION_OPTIONS.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Badge>{rawData?.verification_status || 'pending'}</Badge>
          )}
        </div>
        <div>
          <Label>First Name</Label>
          {isEditable ? (
            <Input value={formData.first_name || ''} onChange={e => updateField('first_name', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm">{rawData?.first_name || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>Last Name</Label>
          {isEditable ? (
            <Input value={formData.last_name || ''} onChange={e => updateField('last_name', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm">{rawData?.last_name || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>Display / Company Name *</Label>
          {isEditable ? (
            <Input value={formData.company_name || ''} onChange={e => updateField('company_name', e.target.value)} placeholder="e.g. John's Handyman Services" />
          ) : (
            <p className="mt-1 text-sm font-medium">{rawData?.company_name}</p>
          )}
        </div>
        <div>
          <Label>Category</Label>
          {isEditable ? (
            <Select value={formData.category || ''} onValueChange={v => updateField('category', v)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <p className="mt-1 text-sm">{rawData?.category || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>Email</Label>
          {isEditable ? (
            <Input type="email" value={formData.email || ''} onChange={e => updateField('email', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1"><Mail className="h-3 w-3" />{rawData?.email || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>Phone</Label>
          {isEditable ? (
            <Input value={formData.phone || ''} onChange={e => updateField('phone', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1"><Phone className="h-3 w-3" />{rawData?.phone || 'N/A'}</p>
          )}
        </div>
        <div className="col-span-2">
          <Label>Website</Label>
          {isEditable ? (
            <Input value={formData.website || ''} onChange={e => updateField('website', e.target.value)} placeholder="https://" />
          ) : (
            <p className="mt-1 text-sm">{rawData?.website || 'N/A'}</p>
          )}
        </div>
      </div>
      <Separator />
      <div>
        <Label>Description</Label>
        {isEditable ? (
          <Textarea value={formData.description || ''} onChange={e => updateField('description', e.target.value)} rows={3} />
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">{rawData?.description || 'No description'}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>License Number (optional)</Label>
          {isEditable ? (
            <Input value={formData.license_number || ''} onChange={e => updateField('license_number', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm">{rawData?.license_number || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>License State</Label>
          {isEditable ? (
            <Input value={formData.license_state || ''} onChange={e => updateField('license_state', e.target.value)} placeholder="FL" />
          ) : (
            <p className="mt-1 text-sm">{rawData?.license_state || 'N/A'}</p>
          )}
        </div>
      </div>
      {renderCompanyTeamFields()}
      {mode !== 'add' && rawData && (
        <>
          <Separator />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Status</Label>
              <Badge className="mt-1">{rawData.subscription_status || 'pending'}</Badge>
            </div>
            <div>
              <Label>Verified</Label>
              <Badge variant={rawData.is_verified ? 'default' : 'secondary'} className="mt-1">
                {rawData.is_verified ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <Label>Rating</Label>
              <p className="mt-1 text-sm">{rawData.average_rating?.toFixed(1) || 0} ({rawData.review_count || 0} reviews)</p>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderStandardContractorFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Company Name *</Label>
          {isEditable ? (
            <Input value={formData.company_name || ''} onChange={e => updateField('company_name', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm font-medium">{rawData?.company_name}</p>
          )}
        </div>
        <div>
          <Label>Contact Name</Label>
          {isEditable ? (
            <Input value={formData.contact_name || ''} onChange={e => updateField('contact_name', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm">{rawData?.contact_name || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>Email</Label>
          {isEditable ? (
            <Input type="email" value={formData.email || ''} onChange={e => updateField('email', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1"><Mail className="h-3 w-3" />{rawData?.email || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>Phone</Label>
          {isEditable ? (
            <Input value={formData.phone || ''} onChange={e => updateField('phone', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1"><Phone className="h-3 w-3" />{rawData?.phone || 'N/A'}</p>
          )}
        </div>
        <div className="col-span-2">
          <Label>Address</Label>
          {isEditable ? (
            <Input value={formData.address || ''} onChange={e => updateField('address', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1"><MapPin className="h-3 w-3" />{rawData?.address || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>License Number</Label>
          {isEditable ? (
            <Input value={formData.license_number || ''} onChange={e => updateField('license_number', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm">{rawData?.license_number || 'N/A'}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderFields = () => {
    const source = mode === 'add' ? selectedSource : contractor?.source;
    if (source === 'Directory') {
      return renderDirectoryFields();
    }
    return renderStandardContractorFields();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {mode === 'add' ? 'Add New Contractor' : contractor?.companyName}
          </DialogTitle>
          {mode !== 'add' && contractor && (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{contractor.source}</Badge>
              {rawData?.created_at && (
                <span className="text-xs text-muted-foreground">
                  Joined {format(new Date(rawData.created_at), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {mode === 'add' && (
            <div>
              <Label>Source *</Label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Directory">Directory</SelectItem>
                  <SelectItem value="Estimating & Supplementing">Estimating & Supplementing</SelectItem>
                  <SelectItem value="Permit Queens">Permit Queens</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {renderFields()}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
          {mode !== 'add' && contractor && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Contractor</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this contractor? This action cannot be undone.
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
                Edit Contractor
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => mode === 'add' ? onOpenChange(false) : onModeChange('view')}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving || !formData.company_name}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  {mode === 'add' ? 'Add Contractor' : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
