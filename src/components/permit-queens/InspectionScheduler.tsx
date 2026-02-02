import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  ClipboardCheck, 
  Calendar, 
  Plus, 
  Check, 
  X, 
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Inspection {
  id: string;
  permit_project_id: string;
  seq_id: number;
  inspection_type: string;
  inspection_code: string | null;
  category: string;
  description: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  completed_date: string | null;
  inspector_name: string | null;
  inspector_id: string | null;
  result: string;
  result_notes: string | null;
  is_required: boolean;
  created_at: string;
}

interface InspectionSchedulerProps {
  projectId: string;
  permitNumber?: string;
  onInspectionScheduled?: (inspection: Inspection) => void;
}

const INSPECTION_TYPES = [
  { value: 'foundation', label: 'Foundation', category: 'building' },
  { value: 'slab', label: 'Slab', category: 'building' },
  { value: 'framing', label: 'Framing', category: 'building' },
  { value: 'roof_in_progress', label: 'Roof In Progress', category: 'building' },
  { value: 'roof_final', label: 'Roof Final', category: 'building' },
  { value: 'anchor_sheet', label: 'Anchor Sheet/Tie-Down', category: 'building' },
  { value: 'fire_barrier', label: 'Fire Barrier', category: 'building' },
  { value: 'insulation', label: 'Insulation', category: 'building' },
  { value: 'drywall', label: 'Drywall', category: 'building' },
  { value: 'final', label: 'Final Building', category: 'building' },
  { value: 'electrical_rough', label: 'Electrical Rough', category: 'electrical' },
  { value: 'electrical_final', label: 'Electrical Final', category: 'electrical' },
  { value: 'plumbing_rough', label: 'Plumbing Rough', category: 'plumbing' },
  { value: 'plumbing_final', label: 'Plumbing Final', category: 'plumbing' },
  { value: 'mechanical_rough', label: 'Mechanical Rough', category: 'mechanical' },
  { value: 'mechanical_final', label: 'Mechanical Final', category: 'mechanical' },
];

const RESULT_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-slate-100 text-slate-600', icon: Clock },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-600', icon: Calendar },
  passed: { label: 'Passed', color: 'bg-green-100 text-green-600', icon: Check },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-600', icon: X },
  cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-400', icon: X },
};

export function InspectionScheduler({
  projectId,
  permitNumber,
  onInspectionScheduled,
}: InspectionSchedulerProps) {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  // Form state
  const [inspectionType, setInspectionType] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchInspections();
  }, [projectId]);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('permit_inspections')
        .select('*')
        .eq('permit_project_id', projectId)
        .order('seq_id', { ascending: true });

      if (error) {
        console.error('Error fetching inspections:', error);
      } else {
        setInspections((data || []) as Inspection[]);
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (inspection?: Inspection) => {
    if (inspection) {
      setSelectedInspection(inspection);
      setInspectionType(inspection.inspection_type);
      setScheduledDate(inspection.scheduled_date || '');
      setNotes(inspection.result_notes || inspection.description || '');
    } else {
      setSelectedInspection(null);
      setInspectionType('');
      setScheduledDate('');
      setNotes('');
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!inspectionType) {
      toast.error('Please select an inspection type');
      return;
    }

    setSaving(true);
    try {
      const typeConfig = INSPECTION_TYPES.find(t => t.value === inspectionType);
      const nextSeqId = inspections.length > 0 
        ? Math.max(...inspections.map(i => i.seq_id)) + 1 
        : 1;

      const inspectionData = {
        permit_project_id: projectId,
        inspection_type: inspectionType,
        category: typeConfig?.category || 'building',
        scheduled_date: scheduledDate || null,
        description: notes || null,
        result: scheduledDate ? 'scheduled' : 'pending',
        seq_id: selectedInspection?.seq_id || nextSeqId,
      };

      let result;
      if (selectedInspection) {
        const { data, error } = await supabase
          .from('permit_inspections')
          .update(inspectionData)
          .eq('id', selectedInspection.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        toast.success('Inspection updated');
      } else {
        const { data, error } = await supabase
          .from('permit_inspections')
          .insert(inspectionData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        toast.success('Inspection scheduled');
      }

      if (result && onInspectionScheduled) {
        onInspectionScheduled(result as Inspection);
      }

      setDialogOpen(false);
      fetchInspections();
    } catch (e) {
      console.error('Error saving inspection:', e);
      toast.error('Failed to save inspection');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateResult = async (inspection: Inspection, result: 'passed' | 'failed') => {
    try {
      const { error } = await supabase
        .from('permit_inspections')
        .update({
          result,
          completed_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', inspection.id);

      if (error) throw error;

      toast.success(`Inspection marked as ${result}`);
      fetchInspections();
    } catch (e) {
      console.error('Error updating inspection:', e);
      toast.error('Failed to update inspection');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = inspections.filter(i => i.result === 'pending' || i.result === 'scheduled').length;
  const passedCount = inspections.filter(i => i.result === 'passed').length;
  const failedCount = inspections.filter(i => i.result === 'failed').length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Inspections
              </CardTitle>
              <CardDescription>
                {permitNumber && `Permit #${permitNumber} • `}
                {passedCount}/{inspections.length} completed
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={fetchInspections}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-1" />
                Request
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary badges */}
          {inspections.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {pendingCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {pendingCount} Pending
                </Badge>
              )}
              {passedCount > 0 && (
                <Badge className="bg-green-100 text-green-700 gap-1">
                  <Check className="h-3 w-3" />
                  {passedCount} Passed
                </Badge>
              )}
              {failedCount > 0 && (
                <Badge className="bg-red-100 text-red-700 gap-1">
                  <X className="h-3 w-3" />
                  {failedCount} Failed
                </Badge>
              )}
            </div>
          )}

          {inspections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardCheck className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No inspections scheduled yet</p>
              <Button
                variant="link"
                size="sm"
                className="mt-2"
                onClick={() => handleOpenDialog()}
              >
                Request First Inspection
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {inspections.map((inspection) => {
                const resultConfig = RESULT_CONFIG[inspection.result] || RESULT_CONFIG.pending;
                const ResultIcon = resultConfig?.icon || Clock;
                const typeLabel = INSPECTION_TYPES.find(t => t.value === inspection.inspection_type)?.label 
                  || inspection.inspection_type.replace(/_/g, ' ');

                return (
                  <div
                    key={inspection.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50 cursor-pointer",
                      inspection.result === 'failed' && "border-red-200 bg-red-50/50 dark:bg-red-900/10"
                    )}
                    onClick={() => handleOpenDialog(inspection)}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-medium text-sm">
                      {inspection.seq_id}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{typeLabel}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {inspection.category}
                        </Badge>
                      </div>
                      {inspection.scheduled_date && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {format(parseISO(inspection.scheduled_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>

                    <Badge className={cn(resultConfig?.color, 'gap-1')}>
                      <ResultIcon className="h-3 w-3" />
                      {resultConfig?.label}
                    </Badge>

                    {/* Quick actions for scheduled inspections */}
                    {inspection.result === 'scheduled' && (
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-green-600 hover:bg-green-100"
                          onClick={() => handleUpdateResult(inspection, 'passed')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-600 hover:bg-red-100"
                          onClick={() => handleUpdateResult(inspection, 'failed')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedInspection ? 'Edit Inspection' : 'Request Inspection'}
            </DialogTitle>
            <DialogDescription>
              {selectedInspection 
                ? 'Update inspection details or record results' 
                : 'Schedule a new inspection for this permit'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Inspection Type</Label>
              <Select value={inspectionType} onValueChange={setInspectionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {INSPECTION_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.label}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {type.category}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Scheduled Date (Optional)</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions or notes..."
                rows={3}
              />
            </div>

            {selectedInspection && selectedInspection.result === 'failed' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Inspection Failed</p>
                  <p className="text-xs opacity-80">
                    Address the issues and request a re-inspection
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedInspection ? 'Update' : 'Request Inspection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
