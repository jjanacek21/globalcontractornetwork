import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useAdminReferrals, Referral } from "@/hooks/useReferrals";
import { 
  Loader2, Edit, Search, Filter, Trash2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; color: string }> = {
  submitted: { label: "Submitted", variant: "secondary", color: "bg-gray-100 text-gray-700" },
  contacted: { label: "Contacted", variant: "outline", color: "bg-blue-100 text-blue-700" },
  scheduled: { label: "Scheduled", variant: "outline", color: "bg-purple-100 text-purple-700" },
  in_progress: { label: "In Progress", variant: "default", color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Completed", variant: "default", color: "bg-green-100 text-green-700" },
  paid: { label: "Paid", variant: "default", color: "bg-emerald-100 text-emerald-700" },
};

const ReferralsManagement = () => {
  const { toast } = useToast();
  const { referrals, loading, updateReferral, markAsPaid, deleteReferral } = useAdminReferrals();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [referralToDelete, setReferralToDelete] = useState<Referral | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    status: "",
    job_amount: "",
    referral_fee_percentage: "",
  });

  const filteredReferrals = referrals.filter(r => {
    const matchesSearch = 
      r.referred_customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referred_service_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.property_address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (referral: Referral) => {
    setSelectedReferral(referral);
    setEditForm({
      status: referral.status,
      job_amount: referral.job_amount?.toString() || "",
      referral_fee_percentage: referral.referral_fee_percentage?.toString() || "10",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedReferral) return;

    const updates: Partial<Referral> = {
      status: editForm.status as Referral["status"],
    };

    if (editForm.job_amount) {
      updates.job_amount = parseFloat(editForm.job_amount);
    }
    if (editForm.referral_fee_percentage) {
      updates.referral_fee_percentage = parseFloat(editForm.referral_fee_percentage);
    }

    // Calculate payout if job is completed OR paid
    if ((editForm.status === "completed" || editForm.status === "paid") && updates.job_amount && updates.referral_fee_percentage) {
      updates.payout_amount = updates.job_amount * (updates.referral_fee_percentage / 100);
      
      if (editForm.status === "completed") {
        updates.completed_at = new Date().toISOString();
      }
      if (editForm.status === "paid") {
        updates.paid_at = new Date().toISOString();
      }
    }

    const success = await updateReferral(selectedReferral.id, updates);
    if (success) {
      setEditDialogOpen(false);
    }
  };

  const handleMarkAsPaid = async (referral: Referral) => {
    let payoutAmount = referral.payout_amount;
    
    // Calculate payout if not already set
    if (!payoutAmount && referral.job_amount && referral.referral_fee_percentage) {
      payoutAmount = referral.job_amount * (referral.referral_fee_percentage / 100);
    }
    
    if (!payoutAmount) {
      toast({
        title: "Cannot Mark as Paid",
        description: "Job amount and referral fee percentage are required",
        variant: "destructive"
      });
      return;
    }
    
    await markAsPaid(referral.id, payoutAmount);
  };

  const handleDeleteClick = (referral: Referral) => {
    setReferralToDelete(referral);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!referralToDelete) return;
    
    setDeleting(true);
    const success = await deleteReferral(referralToDelete.id);
    setDeleting(false);
    
    if (success) {
      setDeleteDialogOpen(false);
      setReferralToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = {
    total: referrals.length,
    pending: referrals.filter(r => ["submitted", "contacted", "scheduled"].includes(r.status)).length,
    inProgress: referrals.filter(r => r.status === "in_progress").length,
    completed: referrals.filter(r => r.status === "completed").length,
    paid: referrals.filter(r => r.status === "paid").length,
    totalPayout: referrals.filter(r => r.status === "paid").reduce((sum, r) => sum + (r.payout_amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">Total Referrals</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="p-4 rounded-lg bg-yellow-50">
          <p className="text-sm text-yellow-700">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
        </div>
        <div className="p-4 rounded-lg bg-blue-50">
          <p className="text-sm text-blue-700">In Progress</p>
          <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
        </div>
        <div className="p-4 rounded-lg bg-green-50">
          <p className="text-sm text-green-700">Completed</p>
          <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
        </div>
        <div className="p-4 rounded-lg bg-emerald-50">
          <p className="text-sm text-emerald-700">Total Payouts</p>
          <p className="text-2xl font-bold text-emerald-700">${stats.totalPayout.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search referrals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {filteredReferrals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No referrals found</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Job Amount</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReferrals.map((referral) => {
                const statusConfig = STATUS_CONFIG[referral.status] || STATUS_CONFIG.submitted;
                return (
                  <TableRow key={referral.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{referral.referred_customer_name}</p>
                        <p className="text-xs text-muted-foreground">{referral.referred_customer_email || referral.referred_customer_phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{referral.referred_service_type}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{referral.property_address}</TableCell>
                    <TableCell>
                      <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {referral.job_amount ? `$${referral.job_amount.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell>
                      {referral.payout_amount ? `$${referral.payout_amount.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(referral.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(referral)} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteClick(referral)} 
                          title="Delete"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {referral.status === "completed" && referral.payout_amount && (
                          <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(referral)}>
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Referral</DialogTitle>
            <DialogDescription>
              Update referral status and job details
            </DialogDescription>
          </DialogHeader>

          {selectedReferral && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium">{selectedReferral.referred_customer_name}</p>
                <p className="text-sm text-muted-foreground">{selectedReferral.referred_service_type}</p>
                <p className="text-sm text-muted-foreground">{selectedReferral.property_address}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Job Amount ($)</Label>
                  <Input
                    type="number"
                    value={editForm.job_amount}
                    onChange={(e) => setEditForm({ ...editForm, job_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label>Referral Fee (%)</Label>
                  <Input
                    type="number"
                    value={editForm.referral_fee_percentage}
                    onChange={(e) => setEditForm({ ...editForm, referral_fee_percentage: e.target.value })}
                    placeholder="10"
                  />
                </div>

                {editForm.job_amount && editForm.referral_fee_percentage && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">Calculated Payout:</p>
                    <p className="text-xl font-bold text-green-700">
                      ${(parseFloat(editForm.job_amount) * (parseFloat(editForm.referral_fee_percentage) / 100)).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Referral</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this referral? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {referralToDelete && (
            <div className="p-4 bg-muted/50 rounded-lg my-4">
              <p className="font-medium">{referralToDelete.referred_customer_name}</p>
              <p className="text-sm text-muted-foreground">{referralToDelete.referred_service_type}</p>
              <p className="text-sm text-muted-foreground">{referralToDelete.property_address}</p>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReferralsManagement;