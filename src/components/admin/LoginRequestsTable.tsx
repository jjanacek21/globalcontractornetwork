import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Filter, Eye, Check, X, AlertTriangle, Zap, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface LoginRequest {
  id: string;
  user_id: string | null;
  contractor_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  service_type: string;
  status: string;
  is_auto_approved: boolean;
  is_escalated: boolean;
  escalated_at: string | null;
  escalation_count: number;
  request_notes: string | null;
  admin_notes: string | null;
  requested_at: string;
  reviewed_at: string | null;
}

const SERVICE_LABELS: Record<string, string> = {
  'store_discounts': 'Store Rewards',
  'directory_listing': 'Directory Listing',
  'field_map': 'Field Map',
  'presentations': 'Presentations',
  'learning_platform': 'Learning Platform',
  'crm_access': 'CRM Portal',
  'supplement_kings': 'Supplement Kings',
  'permit_queens': 'Permit Queens',
};

const PREMIUM_SERVICES = ['crm_access', 'supplement_kings', 'permit_queens', 'learning_platform'];

// Service categories for organizing requests
const SERVICE_CATEGORIES: Record<string, string[]> = {
  'all': [],
  'crm': ['crm_access'],
  'supplements': ['supplement_kings'],
  'permits': ['permit_queens'],
  'directory': ['directory_listing'],
  'learning': ['learning_platform'],
  'other': ['store_discounts', 'field_map', 'presentations'],
};

const CATEGORY_LABELS: Record<string, string> = {
  'all': 'All Requests',
  'crm': 'CRM',
  'supplements': 'Supplements',
  'permits': 'Permits',
  'directory': 'Directory',
  'learning': 'Learning',
  'other': 'Other',
};

const LoginRequestsTable = () => {
  const [requests, setRequests] = useState<LoginRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<LoginRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("login_requests")
        .select("*")
        .order("requested_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error("Error fetching login requests:", error);
      toast({
        title: "Error",
        description: "Failed to load login requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setProcessing(true);

    try {
      const { error } = await supabase.functions.invoke("send-login-approved", {
        body: {
          request_id: selectedRequest.id,
          admin_notes: adminNotes,
        },
      });

      if (error) throw error;

      toast({
        title: "Request Approved",
        description: `Access granted to ${selectedRequest.email}`,
      });

      setDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes("");
      fetchRequests();
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    setProcessing(true);

    try {
      const { error } = await supabase
        .from("login_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast({
        title: "Request Rejected",
        description: `Access denied for ${selectedRequest.email}`,
      });

      setDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes("");
      fetchRequests();
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const openDialog = (request: LoginRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || "");
    setDialogOpen(true);
  };

  const getStatusBadge = (request: LoginRequest) => {
    if (request.status === "auto_approved") {
      return <Badge className="bg-emerald-100 text-emerald-800"><Zap className="h-3 w-3 mr-1" />Auto-Approved</Badge>;
    }
    if (request.status === "approved") {
      return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
    }
    if (request.status === "rejected") {
      return <Badge className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
    }
    if (request.is_escalated) {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Escalated</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  const getServiceBadge = (serviceType: string) => {
    const isPremium = PREMIUM_SERVICES.includes(serviceType);
    const label = SERVICE_LABELS[serviceType] || serviceType;
    return (
      <Badge variant="outline" className={isPremium ? "border-red-300 text-red-700" : "border-gray-300"}>
        {isPremium && "🔴 "}{label}
      </Badge>
    );
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && request.status === "pending") ||
      (statusFilter === "escalated" && request.is_escalated && request.status === "pending") ||
      (statusFilter === "approved" && (request.status === "approved" || request.status === "auto_approved")) ||
      (statusFilter === "rejected" && request.status === "rejected");

    const matchesCategory =
      categoryFilter === "all" ||
      SERVICE_CATEGORIES[categoryFilter]?.includes(request.service_type);

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Count requests per category
  const getCategoryCount = (category: string) => {
    if (category === 'all') return requests.filter(r => r.status === 'pending').length;
    return requests.filter(r => 
      r.status === 'pending' && 
      SERVICE_CATEGORIES[category]?.includes(r.service_type)
    ).length;
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const escalatedCount = requests.filter(r => r.is_escalated && r.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Service Category Tabs */}
      <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {Object.keys(SERVICE_CATEGORIES).map((category) => {
            const count = getCategoryCount(category);
            return (
              <TabsTrigger 
                key={category} 
                value={category}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {CATEGORY_LABELS[category]}
                {count > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending ({pendingCount})</SelectItem>
                <SelectItem value="escalated">Escalated ({escalatedCount})</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline">{pendingCount} pending</Badge>
          {escalatedCount > 0 && (
            <Badge className="bg-red-100 text-red-800">{escalatedCount} escalated</Badge>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No login requests found
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow 
                  key={request.id} 
                  className={`cursor-pointer hover:bg-muted/50 ${request.is_escalated && request.status === "pending" ? "bg-red-50" : ""}`}
                  onClick={() => openDialog(request)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {request.first_name} {request.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{request.email}</p>
                      {request.company_name && (
                        <p className="text-xs text-muted-foreground">{request.company_name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getServiceBadge(request.service_type)}</TableCell>
                  <TableCell>{getStatusBadge(request)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{format(new Date(request.requested_at), "MMM d, yyyy")}</p>
                      <p className="text-muted-foreground">
                        {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); openDialog(request); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Login Request Details</DialogTitle>
            <DialogDescription>
              Review and approve or reject this access request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedRequest.first_name} {selectedRequest.last_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedRequest.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{selectedRequest.company_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service</p>
                  <p className="font-medium">{SERVICE_LABELS[selectedRequest.service_type] || selectedRequest.service_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requested</p>
                  <p className="font-medium">{format(new Date(selectedRequest.requested_at), "MMM d, yyyy h:mm a")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div>{getStatusBadge(selectedRequest)}</div>
                </div>
              </div>

              {selectedRequest.request_notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">User Notes</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedRequest.request_notes}</p>
                </div>
              )}

              {selectedRequest.is_escalated && selectedRequest.status === "pending" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Escalated Request</p>
                    <p className="text-xs text-red-600">
                      This request has been pending for over 48 hours. Reminder count: {selectedRequest.escalation_count}
                    </p>
                  </div>
                </div>
              )}

              {selectedRequest.status === "pending" && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Admin Notes (optional)</p>
                  <Textarea
                    placeholder="Add any notes about this decision..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedRequest?.status === "pending" ? (
              <>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={processing}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleReject} disabled={processing}>
                  {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
                  Reject
                </Button>
                <Button onClick={handleApprove} disabled={processing}>
                  {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Approve
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginRequestsTable;
