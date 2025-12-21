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
  'Supplement Kings': 'supplement_contractors',
  'Permit Queens': 'permit_contractors',
};

const CATEGORY_OPTIONS = [
  'Roofing', 'Solar', 'HVAC', 'Plumbing', 'Electrical', 
  'General Contractor', 'Windows & Doors', 'Painting', 'Flooring', 'Other'
];

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
  const { toast } = useToast();

  useEffect(() => {
    if (rawData && mode !== 'add') {
      setFormData({ ...rawData });
    } else if (mode === 'add') {
      setFormData({});
      setSelectedSource('Directory');
    }
  }, [rawData, mode]);

  const tableName = mode === 'add' 
    ? SOURCE_TABLE_MAP[selectedSource] 
    : contractor ? SOURCE_TABLE_MAP[contractor.source] : null;

  const handleSave = async () => {
    if (!tableName) return;
    
    setSaving(true);
    try {
      if (mode === 'add') {
        // Insert new contractor
        let insertData: any = {};
        
        if (selectedSource === 'Directory') {
          insertData = {
            company_name: formData.company_name,
            category: formData.category || 'Other',
            email: formData.email,
            phone: formData.phone,
            description: formData.description,
            website: formData.website,
            subscription_status: 'active',
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
        // Update existing
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

  const isEditable = mode === 'edit' || mode === 'add';

  const renderDirectoryFields = () => (
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
                  <SelectItem value="Supplement Kings">Supplement Kings</SelectItem>
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
