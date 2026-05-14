import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Save, X, Mail, Phone, MapPin, Calendar, DollarSign, FileText } from "lucide-react";
import { format } from "date-fns";

interface UnifiedLead {
  id: string;
  source: string;
  customerName: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  createdAt: string;
  details: string;
}

interface LeadDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: UnifiedLead | null;
  rawData: any;
  mode: 'view' | 'edit';
  onModeChange: (mode: 'view' | 'edit') => void;
  onRefresh: () => void;
}

const SOURCE_TABLE_MAP: Record<string, string> = {
  'Coating Kings': 'coating_leads',
  'Green Home Improvements': 'window_leads',
  'Estimating & Supplementing': 'supplement_leads',
  'Permit Queens': 'permit_projects',
  'Roofing Services': 'roofing_consultations',
  'Contact Request': 'contact_requests',
  'Prep Your Property': 'service_requests',
};

const STATUS_OPTIONS: Record<string, string[]> = {
  'Coating Kings': ['new', 'contacted', 'scheduled', 'completed', 'cancelled'],
  'Green Home Improvements': ['new', 'contacted', 'scheduled', 'completed', 'cancelled'],
  'Estimating & Supplementing': ['new', 'in_review', 'negotiating', 'settled', 'closed'],
  'Permit Queens': ['pending', 'in_progress', 'approved', 'completed', 'rejected'],
  'Roofing Services': ['new', 'contacted', 'scheduled', 'completed', 'cancelled'],
  'Contact Request': ['new', 'contacted', 'resolved'],
  'Prep Your Property': ['new', 'in_progress', 'completed'],
};

export function LeadDetailsDialog({ 
  open, 
  onOpenChange, 
  lead, 
  rawData, 
  mode, 
  onModeChange,
  onRefresh 
}: LeadDetailsDialogProps) {
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (rawData) {
      setFormData({ ...rawData });
    }
  }, [rawData]);

  if (!lead || !rawData) return null;

  const tableName = SOURCE_TABLE_MAP[lead.source];
  const statusOptions = STATUS_OPTIONS[lead.source] || ['new', 'in_progress', 'completed'];

  const handleSave = async () => {
    if (!tableName) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from(tableName as any)
        .update(formData)
        .eq('id', lead.id);

      if (error) throw error;

      toast({ title: "Lead updated successfully" });
      onModeChange('view');
      onRefresh();
    } catch (error: any) {
      toast({ 
        title: "Error updating lead", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!tableName) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', lead.id);

      if (error) throw error;

      toast({ title: "Lead deleted successfully" });
      onOpenChange(false);
      onRefresh();
    } catch (error: any) {
      toast({ 
        title: "Error deleting lead", 
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

  const renderCoatingKingsFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Name</Label>
          {mode === 'edit' ? (
            <Input value={formData.name || ''} onChange={e => updateField('name', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm">{rawData.name}</p>
          )}
        </div>
        <div>
          <Label>Email</Label>
          {mode === 'edit' ? (
            <Input value={formData.email || ''} onChange={e => updateField('email', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1"><Mail className="h-3 w-3" />{rawData.email}</p>
          )}
        </div>
        <div>
          <Label>Phone</Label>
          {mode === 'edit' ? (
            <Input value={formData.phone || ''} onChange={e => updateField('phone', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1"><Phone className="h-3 w-3" />{rawData.phone || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>Status</Label>
          {mode === 'edit' ? (
            <Select value={formData.status || ''} onValueChange={v => updateField('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Badge className="mt-1">{rawData.status || 'new'}</Badge>
          )}
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Property Address</Label>
          {mode === 'edit' ? (
            <Input value={formData.property_address || ''} onChange={e => updateField('property_address', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1"><MapPin className="h-3 w-3" />{rawData.property_address}</p>
          )}
        </div>
        <div>
          <Label>Coating Type</Label>
          {mode === 'edit' ? (
            <Input value={formData.coating_type || ''} onChange={e => updateField('coating_type', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm">{rawData.coating_type}</p>
          )}
        </div>
        <div>
          <Label>Roof Type</Label>
          {mode === 'edit' ? (
            <Input value={formData.roof_type || ''} onChange={e => updateField('roof_type', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm">{rawData.roof_type}</p>
          )}
        </div>
        <div>
          <Label>Estimated Sqft</Label>
          {mode === 'edit' ? (
            <Input type="number" value={formData.estimated_sqft || ''} onChange={e => updateField('estimated_sqft', Number(e.target.value))} />
          ) : (
            <p className="mt-1 text-sm">{rawData.estimated_sqft || 'N/A'} sqft</p>
          )}
        </div>
        <div>
          <Label>Estimate Range</Label>
          <p className="mt-1 text-sm flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            ${rawData.estimate_low?.toLocaleString() || 0} - ${rawData.estimate_high?.toLocaleString() || 0}
          </p>
        </div>
        <div>
          <Label>Discount</Label>
          <p className="mt-1 text-sm">{rawData.discount_percent || 0}%</p>
        </div>
      </div>
      <Separator />
      <div>
        <Label>Notes</Label>
        {mode === 'edit' ? (
          <Textarea value={formData.notes || ''} onChange={e => updateField('notes', e.target.value)} rows={3} />
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">{rawData.notes || 'No notes'}</p>
        )}
      </div>
    </div>
  );

  const renderWindowLeadsFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Name</Label>
          {mode === 'edit' ? (
            <Input value={formData.name || ''} onChange={e => updateField('name', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm">{rawData.name}</p>
          )}
        </div>
        <div>
          <Label>Email</Label>
          {mode === 'edit' ? (
            <Input value={formData.email || ''} onChange={e => updateField('email', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1"><Mail className="h-3 w-3" />{rawData.email}</p>
          )}
        </div>
        <div>
          <Label>Phone</Label>
          {mode === 'edit' ? (
            <Input value={formData.phone || ''} onChange={e => updateField('phone', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1"><Phone className="h-3 w-3" />{rawData.phone || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>Status</Label>
          {mode === 'edit' ? (
            <Select value={formData.status || ''} onValueChange={v => updateField('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Badge className="mt-1">{rawData.status || 'new'}</Badge>
          )}
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Property Address</Label>
          {mode === 'edit' ? (
            <Input value={formData.property_address || ''} onChange={e => updateField('property_address', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1"><MapPin className="h-3 w-3" />{rawData.property_address}, {rawData.city}, {rawData.state} {rawData.zip_code}</p>
          )}
        </div>
        <div>
          <Label>Total Windows</Label>
          <p className="mt-1 text-sm">{rawData.total_windows || 0}</p>
        </div>
        <div>
          <Label>Glass Type</Label>
          <p className="mt-1 text-sm">{rawData.glass_type || 'N/A'}</p>
        </div>
        <div>
          <Label>Performance Level</Label>
          <p className="mt-1 text-sm">{rawData.performance_level || 'N/A'}</p>
        </div>
        <div>
          <Label>Interior/Exterior Colors</Label>
          <p className="mt-1 text-sm">{rawData.interior_color || 'N/A'} / {rawData.exterior_color || 'N/A'}</p>
        </div>
        <div>
          <Label>Estimate Range</Label>
          <p className="mt-1 text-sm flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            ${rawData.estimate_low?.toLocaleString() || 0} - ${rawData.estimate_high?.toLocaleString() || 0}
          </p>
        </div>
        <div>
          <Label>Discount</Label>
          <p className="mt-1 text-sm">{rawData.discount_percent || 0}% ({rawData.spin_result || 'N/A'})</p>
        </div>
      </div>
      <Separator />
      <div>
        <Label>Notes</Label>
        {mode === 'edit' ? (
          <Textarea value={formData.notes || ''} onChange={e => updateField('notes', e.target.value)} rows={3} />
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">{rawData.notes || 'No notes'}</p>
        )}
      </div>
    </div>
  );

  const renderSupplementLeadsFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Customer Name</Label>
          {mode === 'edit' ? (
            <Input value={formData.customer_name || ''} onChange={e => updateField('customer_name', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm">{rawData.customer_name}</p>
          )}
        </div>
        <div>
          <Label>Email</Label>
          {mode === 'edit' ? (
            <Input value={formData.customer_email || ''} onChange={e => updateField('customer_email', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1"><Mail className="h-3 w-3" />{rawData.customer_email || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>Phone</Label>
          {mode === 'edit' ? (
            <Input value={formData.customer_phone || ''} onChange={e => updateField('customer_phone', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1"><Phone className="h-3 w-3" />{rawData.customer_phone || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>Status</Label>
          {mode === 'edit' ? (
            <Select value={formData.status || ''} onValueChange={v => updateField('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Badge className="mt-1">{rawData.status || 'new'}</Badge>
          )}
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Property Address</Label>
          <p className="mt-1 text-sm flex items-center gap-1"><MapPin className="h-3 w-3" />{rawData.property_address}, {rawData.property_city}, {rawData.property_state} {rawData.property_zip}</p>
        </div>
        <div>
          <Label>Claim Type</Label>
          <p className="mt-1 text-sm">{rawData.claim_type}</p>
        </div>
        <div>
          <Label>Insurance Company</Label>
          <p className="mt-1 text-sm">{rawData.insurance_company || 'N/A'}</p>
        </div>
        <div>
          <Label>Claim Number</Label>
          <p className="mt-1 text-sm">{rawData.claim_number || 'N/A'}</p>
        </div>
        <div>
          <Label>Date of Loss</Label>
          <p className="mt-1 text-sm">{rawData.date_of_loss ? format(new Date(rawData.date_of_loss), 'MMM d, yyyy') : 'N/A'}</p>
        </div>
        <div>
          <Label>Assigned Amount</Label>
          <p className="mt-1 text-sm flex items-center gap-1"><DollarSign className="h-3 w-3" />{rawData.assigned_amount?.toLocaleString() || 0}</p>
        </div>
        <div>
          <Label>Settled Amount</Label>
          <p className="mt-1 text-sm flex items-center gap-1"><DollarSign className="h-3 w-3" />{rawData.settled_amount?.toLocaleString() || 0}</p>
        </div>
      </div>
      <Separator />
      <div>
        <Label>Notes</Label>
        {mode === 'edit' ? (
          <Textarea value={formData.notes || ''} onChange={e => updateField('notes', e.target.value)} rows={3} />
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">{rawData.notes || 'No notes'}</p>
        )}
      </div>
    </div>
  );

  const renderPermitProjectsFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Customer Name</Label>
          {mode === 'edit' ? (
            <Input value={formData.customer_name || ''} onChange={e => updateField('customer_name', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm">{rawData.customer_name}</p>
          )}
        </div>
        <div>
          <Label>Email</Label>
          {mode === 'edit' ? (
            <Input value={formData.customer_email || ''} onChange={e => updateField('customer_email', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1"><Mail className="h-3 w-3" />{rawData.customer_email || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>Phone</Label>
          {mode === 'edit' ? (
            <Input value={formData.customer_phone || ''} onChange={e => updateField('customer_phone', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1"><Phone className="h-3 w-3" />{rawData.customer_phone || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>Status</Label>
          {mode === 'edit' ? (
            <Select value={formData.status || ''} onValueChange={v => updateField('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Badge className="mt-1">{rawData.status || 'pending'}</Badge>
          )}
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Property Address</Label>
          <p className="mt-1 text-sm flex items-center gap-1"><MapPin className="h-3 w-3" />{rawData.property_address}, {rawData.city}, {rawData.state} {rawData.zip_code}</p>
        </div>
        <div>
          <Label>Service Type</Label>
          <p className="mt-1 text-sm">{rawData.service_type}</p>
        </div>
        <div>
          <Label>Roof Type</Label>
          <p className="mt-1 text-sm">{rawData.roof_type || 'N/A'}</p>
        </div>
        <div>
          <Label>HOA Approval</Label>
          <Badge variant={rawData.hoa_approval ? 'default' : 'secondary'}>{rawData.hoa_approval ? 'Yes' : 'No'}</Badge>
        </div>
        <div>
          <Label>Architectural Approval</Label>
          <Badge variant={rawData.architectural_approval ? 'default' : 'secondary'}>{rawData.architectural_approval ? 'Yes' : 'No'}</Badge>
        </div>
      </div>
      <Separator />
      <div>
        <Label>Notes</Label>
        {mode === 'edit' ? (
          <Textarea value={formData.notes || ''} onChange={e => updateField('notes', e.target.value)} rows={3} />
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">{rawData.notes || 'No notes'}</p>
        )}
      </div>
    </div>
  );

  const renderRoofingFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Customer Name</Label>
          {mode === 'edit' ? (
            <Input value={formData.customer_name || ''} onChange={e => updateField('customer_name', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm">{rawData.customer_name || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>Email</Label>
          {mode === 'edit' ? (
            <Input value={formData.customer_email || ''} onChange={e => updateField('customer_email', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1"><Mail className="h-3 w-3" />{rawData.customer_email || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>Phone</Label>
          {mode === 'edit' ? (
            <Input value={formData.customer_phone || ''} onChange={e => updateField('customer_phone', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1"><Phone className="h-3 w-3" />{rawData.customer_phone || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>Status</Label>
          {mode === 'edit' ? (
            <Select value={formData.status || ''} onValueChange={v => updateField('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Badge className="mt-1">{rawData.status || 'new'}</Badge>
          )}
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Roof Type</Label>
          <p className="mt-1 text-sm">{rawData.roof_type || 'N/A'}</p>
        </div>
        <div>
          <Label>Square Feet</Label>
          <p className="mt-1 text-sm">{rawData.sqft || 'N/A'} sqft</p>
        </div>
        <div>
          <Label>Budget</Label>
          <p className="mt-1 text-sm">{rawData.budget || 'N/A'}</p>
        </div>
        <div>
          <Label>Timeline</Label>
          <p className="mt-1 text-sm">{rawData.timeline || 'N/A'}</p>
        </div>
        <div>
          <Label>Recommended Package</Label>
          <p className="mt-1 text-sm">{rawData.recommended_package || 'N/A'}</p>
        </div>
        <div>
          <Label>Estimated Price</Label>
          <p className="mt-1 text-sm flex items-center gap-1"><DollarSign className="h-3 w-3" />{rawData.estimated_price?.toLocaleString() || 'N/A'}</p>
        </div>
      </div>
    </div>
  );

  const renderGenericFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Name</Label>
          {mode === 'edit' ? (
            <Input value={formData.name || ''} onChange={e => updateField('name', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm">{rawData.name || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>Email</Label>
          {mode === 'edit' ? (
            <Input value={formData.email || ''} onChange={e => updateField('email', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1"><Mail className="h-3 w-3" />{rawData.email || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>Phone</Label>
          {mode === 'edit' ? (
            <Input value={formData.phone || ''} onChange={e => updateField('phone', e.target.value)} />
          ) : (
            <p className="mt-1 text-sm flex items-center gap-1"><Phone className="h-3 w-3" />{rawData.phone || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>Status</Label>
          {mode === 'edit' ? (
            <Select value={formData.status || ''} onValueChange={v => updateField('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Badge className="mt-1">{rawData.status || 'new'}</Badge>
          )}
        </div>
      </div>
      {rawData.message && (
        <>
          <Separator />
          <div>
            <Label>Message</Label>
            {mode === 'edit' ? (
              <Textarea value={formData.message || ''} onChange={e => updateField('message', e.target.value)} rows={3} />
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">{rawData.message}</p>
            )}
          </div>
        </>
      )}
      {rawData.property_address && (
        <div>
          <Label>Property Address</Label>
          <p className="mt-1 text-sm flex items-center gap-1"><MapPin className="h-3 w-3" />{rawData.property_address}</p>
        </div>
      )}
    </div>
  );

  const renderFields = () => {
    switch (lead.source) {
      case 'Coating Kings':
        return renderCoatingKingsFields();
      case 'Green Home Improvements':
        return renderWindowLeadsFields();
      case 'Estimating & Supplementing':
        return renderSupplementLeadsFields();
      case 'Permit Queens':
        return renderPermitProjectsFields();
      case 'Roofing Services':
        return renderRoofingFields();
      default:
        return renderGenericFields();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {lead.customerName}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{lead.source}</Badge>
                {rawData.created_at && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(rawData.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {renderFields()}
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this lead? This action cannot be undone.
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

          <div className="flex gap-2">
            {mode === 'view' ? (
              <Button onClick={() => onModeChange('edit')}>
                Edit Lead
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => onModeChange('view')}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
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
