import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  XCircle, 
  Plus, 
  TrendingUp, 
  FileText,
  Loader2,
  AlertTriangle,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';

interface Rejection {
  id: string;
  jurisdiction_county: string;
  jurisdiction_city: string | null;
  trade: string;
  rejection_reason: string;
  rejection_category: string | null;
  admin_reviewed: boolean;
  admin_notes: string | null;
  ai_extracted_rule: string | null;
  ai_suggested_action: string | null;
  created_at: string;
}

const REJECTION_CATEGORIES = [
  { value: 'missing_document', label: 'Missing Document' },
  { value: 'invalid_approval', label: 'Invalid/Expired Product Approval' },
  { value: 'incorrect_form', label: 'Incorrect Form Version' },
  { value: 'missing_signature', label: 'Missing Signature' },
  { value: 'missing_notary', label: 'Missing Notarization' },
  { value: 'incomplete_info', label: 'Incomplete Information' },
  { value: 'code_violation', label: 'Code Violation' },
  { value: 'engineering_required', label: 'Engineering Required' },
  { value: 'hvhz_non_compliant', label: 'HVHZ Non-Compliant' },
  { value: 'other', label: 'Other' },
];

const TRADE_TYPES = [
  'roofing',
  'windows_doors',
  'electrical',
  'mechanical',
  'plumbing',
  'solar',
  'fencing',
  'pool',
  'structural',
  'general',
];

const COUNTIES = ['Miami-Dade', 'Broward', 'Palm Beach', 'Monroe'];

export function RejectionTracker() {
  const [rejections, setRejections] = useState<Rejection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newRejection, setNewRejection] = useState({
    jurisdiction_county: '',
    jurisdiction_city: '',
    trade: '',
    rejection_reason: '',
    rejection_category: '',
    admin_notes: '',
  });

  useEffect(() => {
    fetchRejections();
  }, []);

  const fetchRejections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('permit_rejections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setRejections((data || []) as Rejection[]);
    } catch (error) {
      console.error('Error fetching rejections:', error);
      toast.error('Failed to load rejection data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRejection = async () => {
    if (!newRejection.jurisdiction_county || !newRejection.trade || !newRejection.rejection_reason) {
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('permit_rejections')
        .insert({
          jurisdiction_county: newRejection.jurisdiction_county,
          jurisdiction_city: newRejection.jurisdiction_city || null,
          trade: newRejection.trade,
          rejection_reason: newRejection.rejection_reason,
          rejection_category: newRejection.rejection_category || null,
          admin_notes: newRejection.admin_notes || null,
        });

      if (error) throw error;

      toast.success('Rejection logged successfully! AI will learn from this pattern.');
      setShowAddDialog(false);
      setNewRejection({
        jurisdiction_county: '',
        jurisdiction_city: '',
        trade: '',
        rejection_reason: '',
        rejection_category: '',
        admin_notes: '',
      });
      fetchRejections();
    } catch (error) {
      console.error('Error adding rejection:', error);
      toast.error('Failed to log rejection');
    } finally {
      setSaving(false);
    }
  };

  const markReviewed = async (id: string, reviewed: boolean) => {
    try {
      const { error } = await supabase
        .from('permit_rejections')
        .update({
          admin_reviewed: reviewed,
        })
        .eq('id', id);

      if (error) throw error;
      toast.success(reviewed ? 'Marked as reviewed' : 'Marked as not reviewed');
      fetchRejections();
    } catch (error) {
      console.error('Error updating rejection:', error);
      toast.error('Failed to update');
    }
  };

  // Calculate stats
  const stats = {
    total: rejections.length,
    reviewed: rejections.filter(r => r.admin_reviewed).length,
    byCategory: REJECTION_CATEGORIES.map(cat => ({
      ...cat,
      count: rejections.filter(r => r.rejection_category === cat.value).length,
    })).sort((a, b) => b.count - a.count),
    byCounty: COUNTIES.map(county => ({
      county,
      count: rejections.filter(r => r.jurisdiction_county === county).length,
    })),
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-muted-foreground text-sm">Total Rejections Logged</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.reviewed}</div>
                <p className="text-muted-foreground text-sm">Reviewed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-600" />
              <div>
                <div className="text-2xl font-bold">
                  {stats.byCategory[0]?.label || 'N/A'}
                </div>
                <p className="text-muted-foreground text-sm">Most Common Reason</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {stats.byCounty.sort((a, b) => b.count - a.count)[0]?.county || 'N/A'}
                </div>
                <p className="text-muted-foreground text-sm">Highest Rejection County</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Rejection Tracking & Learning
              </CardTitle>
              <CardDescription>
                Log permit rejections to help the AI learn and improve packet generation
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Rejection
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Log Permit Rejection</DialogTitle>
                  <DialogDescription>
                    Record rejection details so the AI can learn to avoid this issue
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>County *</Label>
                      <Select
                        value={newRejection.jurisdiction_county}
                        onValueChange={(value) => setNewRejection(prev => ({ ...prev, jurisdiction_county: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select county" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTIES.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>City (optional)</Label>
                      <Input
                        placeholder="e.g., Boca Raton"
                        value={newRejection.jurisdiction_city}
                        onChange={(e) => setNewRejection(prev => ({ ...prev, jurisdiction_city: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Trade Type *</Label>
                    <Select
                      value={newRejection.trade}
                      onValueChange={(value) => setNewRejection(prev => ({ ...prev, trade: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select trade" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRADE_TYPES.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Rejection Category</Label>
                    <Select
                      value={newRejection.rejection_category}
                      onValueChange={(value) => setNewRejection(prev => ({ ...prev, rejection_category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {REJECTION_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Rejection Reason (from reviewer) *</Label>
                    <Textarea
                      placeholder="Copy the exact rejection reason from the building department..."
                      value={newRejection.rejection_reason}
                      onChange={(e) => setNewRejection(prev => ({ ...prev, rejection_reason: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Your Notes (optional)</Label>
                    <Textarea
                      placeholder="Any additional context about this rejection..."
                      value={newRejection.admin_notes}
                      onChange={(e) => setNewRejection(prev => ({ ...prev, admin_notes: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddRejection} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Log Rejection'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rejections.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No rejections logged yet. When a permit gets rejected, log it here so the AI can learn.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Jurisdiction</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rejections.map((rejection) => (
                  <TableRow key={rejection.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(rejection.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {rejection.jurisdiction_city 
                        ? `${rejection.jurisdiction_city}, ${rejection.jurisdiction_county}`
                        : rejection.jurisdiction_county}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rejection.trade}</Badge>
                    </TableCell>
                    <TableCell>
                      {rejection.rejection_category && (
                        <Badge variant="secondary">
                          {REJECTION_CATEGORIES.find(c => c.value === rejection.rejection_category)?.label || rejection.rejection_category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={rejection.rejection_reason}>
                      {rejection.rejection_reason}
                    </TableCell>
                    <TableCell>
                      {rejection.admin_reviewed ? (
                        <Badge className="bg-green-500/10 text-green-600">Reviewed</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => markReviewed(rejection.id, !rejection.admin_reviewed)}
                      >
                        {rejection.admin_reviewed ? 'Unmark' : 'Mark Reviewed'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Top Rejection Reasons by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rejection Patterns</CardTitle>
          <CardDescription>Most common rejection reasons by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.byCategory.slice(0, 8).map((cat) => (
              <div key={cat.value} className="p-3 border rounded-lg">
                <div className="text-2xl font-bold">{cat.count}</div>
                <p className="text-sm text-muted-foreground">{cat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
