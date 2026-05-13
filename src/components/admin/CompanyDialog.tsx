import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Trash2, Plus, X, Upload, Link as LinkIcon } from "lucide-react";

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: any | null;
  mode: 'view' | 'edit' | 'add';
  onModeChange: (mode: 'view' | 'edit' | 'add') => void;
  onRefresh: () => void;
}

interface Reference { name?: string; phone?: string; email?: string; project?: string; }
interface JobPhoto { url: string; caption?: string; }
interface UnlinkedContractor { id: string; first_name: string | null; last_name: string | null; email: string | null; }

const REVENUE_RANGES = ['<100k', '100k-500k', '500k-1m', '1m-5m', '5m+'];
const VERIFICATION_STATES = ['pending', 'verified', 'rejected'];

export function CompanyDialog({ open, onOpenChange, company, mode, onModeChange, onRefresh }: CompanyDialogProps) {
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [unlinked, setUnlinked] = useState<UnlinkedContractor[]>([]);
  const [linkSelected, setLinkSelected] = useState<string[]>([]);
  const { toast } = useToast();

  const isViewMode = mode === 'view';
  const isAddMode = mode === 'add';

  useEffect(() => {
    if (!open) return;
    if (company && !isAddMode) {
      setFormData({ ...company, social_links: company.social_links || {}, job_photos: company.job_photos || [], client_references: company.client_references || [], specialties: company.specialties || [], service_areas: company.service_areas || [] });
    } else if (isAddMode) {
      setFormData({ is_active: true, verification_status: 'pending', social_links: {}, job_photos: [], client_references: [], specialties: [], service_areas: [] });
    }
    setLinkSelected([]);
    fetchUnlinked();
  }, [company, mode, open]);

  const fetchUnlinked = async () => {
    const { data } = await supabase
      .from('contractor_profiles')
      .select('id, first_name, last_name, email')
      .is('company_id', null)
      .order('created_at', { ascending: false })
      .limit(200);
    setUnlinked(data || []);
  };

  const update = (field: string, value: any) => setFormData((p: any) => ({ ...p, [field]: value }));
  const updateSocial = (k: string, v: string) => setFormData((p: any) => ({ ...p, social_links: { ...(p.social_links || {}), [k]: v } }));

  const uploadImage = async (file: File, kind: 'logo' | 'banner' | 'photo') => {
    const setter = kind === 'logo' ? setUploadingLogo : kind === 'banner' ? setUploadingBanner : setUploadingPhoto;
    setter(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `admin-${kind}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('company-photos').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('company-photos').getPublicUrl(path);
      if (kind === 'logo') update('logo_url', publicUrl);
      else if (kind === 'banner') update('banner_url', publicUrl);
      else {
        const photos: JobPhoto[] = formData.job_photos || [];
        update('job_photos', [...photos, { url: publicUrl, caption: '' }]);
      }
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setter(false);
    }
  };

  const addReference = () => update('client_references', [...(formData.client_references || []), { name: '', phone: '', email: '', project: '' }]);
  const removeReference = (i: number) => update('client_references', (formData.client_references || []).filter((_: any, idx: number) => idx !== i));
  const updateReference = (i: number, k: keyof Reference, v: string) => {
    const refs = [...(formData.client_references || [])];
    refs[i] = { ...refs[i], [k]: v };
    update('client_references', refs);
  };

  const removePhoto = (i: number) => update('job_photos', (formData.job_photos || []).filter((_: any, idx: number) => idx !== i));

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: 'Error', description: 'Company name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        logo_url: formData.logo_url,
        banner_url: formData.banner_url,
        years_in_business: formData.years_in_business ? Number(formData.years_in_business) : null,
        yearly_revenue_range: formData.yearly_revenue_range,
        service_areas: formData.service_areas,
        specialties: formData.specialties,
        license_number: formData.license_number,
        license_state: formData.license_state,
        license_expiry: formData.license_expiry || null,
        insurance_provider: formData.insurance_provider,
        insurance_policy_number: formData.insurance_policy_number,
        insurance_expiry: formData.insurance_expiry || null,
        workers_comp_provider: formData.workers_comp_provider,
        workers_comp_policy_number: formData.workers_comp_policy_number,
        job_photos: formData.job_photos,
        client_references: formData.client_references,
        social_links: formData.social_links,
        verification_status: formData.verification_status || 'pending',
        is_active: formData.is_active ?? true,
      };

      if (payload.verification_status === 'verified') {
        payload.verified_at = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        payload.verified_by = user?.id || null;
      }

      let companyId = company?.id;
      if (isAddMode) {
        const { data, error } = await supabase.from('companies').insert(payload).select('id').single();
        if (error) throw error;
        companyId = data.id;
        toast({ title: 'Company created' });
      } else {
        const { error } = await supabase.from('companies').update(payload).eq('id', company.id);
        if (error) throw error;
        toast({ title: 'Company updated' });
      }

      // Auto-link selected contractors
      if (linkSelected.length > 0 && companyId) {
        const { error: linkErr } = await supabase
          .from('contractor_profiles')
          .update({ company_id: companyId })
          .in('id', linkSelected);
        if (linkErr) {
          toast({ title: 'Linking failed', description: linkErr.message, variant: 'destructive' });
        } else {
          toast({ title: `Linked ${linkSelected.length} contractor(s)` });
        }
      }

      onOpenChange(false);
      onRefresh();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!company) return;
    if (!confirm('Delete this company and all associated members, teams, and work orders?')) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('companies').delete().eq('id', company.id);
      if (error) throw error;
      toast({ title: 'Company deleted' });
      onOpenChange(false);
      onRefresh();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const social = formData.social_links || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isAddMode ? 'Add Company to Directory' : mode === 'edit' ? 'Edit Company' : 'Company Details'}
            {formData.verification_status === 'verified' && <Badge className="ml-2">Verified</Badge>}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basics" className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="proof">Photos & Refs</TabsTrigger>
            <TabsTrigger value="link">Link & Status</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Company Name *</Label><Input value={formData.name || ''} onChange={(e) => update('name', e.target.value)} disabled={isViewMode} /></div>
              <div><Label>Email</Label><Input type="email" value={formData.email || ''} onChange={(e) => update('email', e.target.value)} disabled={isViewMode} /></div>
              <div><Label>Phone</Label><Input value={formData.phone || ''} onChange={(e) => update('phone', e.target.value)} disabled={isViewMode} /></div>
              <div><Label>Website</Label><Input value={formData.website || ''} onChange={(e) => update('website', e.target.value)} disabled={isViewMode} placeholder="https://" /></div>
            </div>
            <div><Label>Address</Label><Input value={formData.address || ''} onChange={(e) => update('address', e.target.value)} disabled={isViewMode} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>City</Label><Input value={formData.city || ''} onChange={(e) => update('city', e.target.value)} disabled={isViewMode} /></div>
              <div><Label>State</Label><Input value={formData.state || ''} onChange={(e) => update('state', e.target.value)} disabled={isViewMode} placeholder="FL" /></div>
              <div><Label>ZIP</Label><Input value={formData.zip_code || ''} onChange={(e) => update('zip_code', e.target.value)} disabled={isViewMode} /></div>
            </div>
            <div><Label>Description</Label><Textarea rows={3} value={formData.description || ''} onChange={(e) => update('description', e.target.value)} disabled={isViewMode} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Years in Business</Label><Input type="number" value={formData.years_in_business || ''} onChange={(e) => update('years_in_business', e.target.value)} disabled={isViewMode} /></div>
              <div>
                <Label>Yearly Revenue Range</Label>
                <Select value={formData.yearly_revenue_range || ''} onValueChange={(v) => update('yearly_revenue_range', v)} disabled={isViewMode}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{REVENUE_RANGES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Service Areas (comma-separated)</Label><Input value={(formData.service_areas || []).join(', ')} onChange={(e) => update('service_areas', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} disabled={isViewMode} placeholder="Miami-Dade, Broward, Palm Beach" /></div>
            <div><Label>Specialties (comma-separated)</Label><Input value={(formData.specialties || []).join(', ')} onChange={(e) => update('specialties', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} disabled={isViewMode} placeholder="Roofing, Solar, Windows" /></div>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6 pt-4">
            <div>
              <Label>Logo</Label>
              <div className="flex items-center gap-4 mt-2">
                {formData.logo_url ? <img src={formData.logo_url} alt="logo" className="w-20 h-20 rounded-lg object-cover border" /> : <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center"><Building2 className="h-8 w-8 text-muted-foreground" /></div>}
                {!isViewMode && (
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'logo')} />
                    <Button type="button" variant="outline" disabled={uploadingLogo} asChild><span>{uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}Upload Logo</span></Button>
                  </label>
                )}
              </div>
            </div>
            <div>
              <Label>Banner</Label>
              <div className="space-y-2 mt-2">
                {formData.banner_url ? <img src={formData.banner_url} alt="banner" className="w-full h-32 rounded-lg object-cover border" /> : <div className="w-full h-32 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">No banner</div>}
                {!isViewMode && (
                  <label className="cursor-pointer inline-block">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'banner')} />
                    <Button type="button" variant="outline" disabled={uploadingBanner} asChild><span>{uploadingBanner ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}Upload Banner</span></Button>
                  </label>
                )}
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <Label className="text-base">Social Links</Label>
              {['facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'tiktok', 'google_business'].map((k) => (
                <div key={k} className="grid grid-cols-3 gap-2 items-center">
                  <Label className="capitalize">{k.replace('_', ' ')}</Label>
                  <Input className="col-span-2" value={social[k] || ''} onChange={(e) => updateSocial(k, e.target.value)} disabled={isViewMode} placeholder="https://" />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="credentials" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>License Number</Label><Input value={formData.license_number || ''} onChange={(e) => update('license_number', e.target.value)} disabled={isViewMode} /></div>
              <div><Label>License State</Label><Input value={formData.license_state || ''} onChange={(e) => update('license_state', e.target.value)} disabled={isViewMode} placeholder="FL" /></div>
              <div><Label>License Expiry</Label><Input type="date" value={formData.license_expiry || ''} onChange={(e) => update('license_expiry', e.target.value)} disabled={isViewMode} /></div>
              <div />
              <div><Label>Insurance Provider</Label><Input value={formData.insurance_provider || ''} onChange={(e) => update('insurance_provider', e.target.value)} disabled={isViewMode} /></div>
              <div><Label>Insurance Policy #</Label><Input value={formData.insurance_policy_number || ''} onChange={(e) => update('insurance_policy_number', e.target.value)} disabled={isViewMode} /></div>
              <div><Label>Insurance Expiry</Label><Input type="date" value={formData.insurance_expiry || ''} onChange={(e) => update('insurance_expiry', e.target.value)} disabled={isViewMode} /></div>
              <div />
              <div><Label>Workers Comp Provider</Label><Input value={formData.workers_comp_provider || ''} onChange={(e) => update('workers_comp_provider', e.target.value)} disabled={isViewMode} /></div>
              <div><Label>Workers Comp Policy #</Label><Input value={formData.workers_comp_policy_number || ''} onChange={(e) => update('workers_comp_policy_number', e.target.value)} disabled={isViewMode} /></div>
            </div>
          </TabsContent>

          <TabsContent value="proof" className="space-y-6 pt-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base">Job Photos ({(formData.job_photos || []).length})</Label>
                {!isViewMode && (
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'photo')} />
                    <Button type="button" variant="outline" size="sm" disabled={uploadingPhoto} asChild>
                      <span>{uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}Add Photo</span>
                    </Button>
                  </label>
                )}
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {(formData.job_photos || []).map((p: JobPhoto, i: number) => (
                  <div key={i} className="relative group">
                    <img src={p.url} alt="" className="w-full h-24 object-cover rounded border" />
                    {!isViewMode && (
                      <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base">Client References ({(formData.client_references || []).length})</Label>
                {!isViewMode && <Button type="button" variant="outline" size="sm" onClick={addReference}><Plus className="h-4 w-4 mr-2" />Add Reference</Button>}
              </div>
              <div className="space-y-3">
                {(formData.client_references || []).map((r: Reference, i: number) => (
                  <div key={i} className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
                    <Input placeholder="Name" value={r.name || ''} onChange={(e) => updateReference(i, 'name', e.target.value)} disabled={isViewMode} />
                    <Input placeholder="Phone" value={r.phone || ''} onChange={(e) => updateReference(i, 'phone', e.target.value)} disabled={isViewMode} />
                    <Input placeholder="Email" value={r.email || ''} onChange={(e) => updateReference(i, 'email', e.target.value)} disabled={isViewMode} />
                    <div className="flex gap-2">
                      <Input placeholder="Project type" value={r.project || ''} onChange={(e) => updateReference(i, 'project', e.target.value)} disabled={isViewMode} />
                      {!isViewMode && <Button type="button" size="icon" variant="ghost" onClick={() => removeReference(i)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Verification Status</Label>
                <Select value={formData.verification_status || 'pending'} onValueChange={(v) => update('verification_status', v)} disabled={isViewMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VERIFICATION_STATES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center justify-between p-3 border rounded-lg w-full">
                  <Label>Active</Label>
                  <Switch checked={formData.is_active ?? true} onCheckedChange={(c) => update('is_active', c)} disabled={isViewMode} />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="flex items-center gap-2 text-base"><LinkIcon className="h-4 w-4" />Link Existing Contractors to this Company</Label>
              <p className="text-sm text-muted-foreground mb-3 mt-1">Selected contractors will be auto-attached on save. Showing unlinked profiles only.</p>
              <div className="border rounded-lg max-h-72 overflow-y-auto divide-y">
                {unlinked.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No unlinked contractor profiles found.</p>
                ) : unlinked.map((c) => {
                  const checked = linkSelected.includes(c.id);
                  return (
                    <label key={c.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isViewMode}
                        onChange={(e) => setLinkSelected(prev => e.target.checked ? [...prev, c.id] : prev.filter(x => x !== c.id))}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{c.first_name || ''} {c.last_name || ''} {!c.first_name && !c.last_name && '(unnamed)'}</div>
                        <div className="text-xs text-muted-foreground">{c.email || 'no email'}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {mode === 'view' && company && (
            <>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="sm:mr-auto">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}Delete
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={() => onModeChange('edit')}>Edit Company</Button>
            </>
          )}
          {(mode === 'edit' || isAddMode) && (
            <>
              <Button variant="outline" onClick={() => isAddMode ? onOpenChange(false) : onModeChange('view')}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{isAddMode ? 'Create Company' : 'Save Changes'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
