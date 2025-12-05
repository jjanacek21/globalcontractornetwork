import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Crown, 
  LogOut, 
  Users, 
  FileText,
  DollarSign,
  Search,
  Building2,
  TrendingUp
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { format } from "date-fns";

interface Lead {
  id: string;
  customer_name: string;
  property_address: string;
  property_city: string;
  claim_type: string;
  insurance_company: string | null;
  status: string;
  urgency: string;
  created_at: string;
  assigned_amount: number | null;
  settled_amount: number | null;
  contractor_id: string;
  supplement_contractors: {
    company_name: string;
  } | null;
}

interface Contractor {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
}

const statusColors: Record<string, string> = {
  submitted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_review: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  xactimate_complete: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  supplement_sent: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  negotiating: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  settled: "bg-green-500/20 text-green-400 border-green-500/30",
};

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  in_review: "In Review",
  xactimate_complete: "Xactimate Complete",
  supplement_sent: "Supplement Sent",
  negotiating: "Negotiating",
  settled: "Settled",
};

export default function SupplementKingsAdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterContractor, setFilterContractor] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/supplement-kings/admin/auth");
      } else {
        checkAdminAccess(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/supplement-kings/admin/auth");
      } else {
        checkAdminAccess(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminAccess = async (userId: string) => {
    const { data, error } = await supabase
      .from('supplement_admins')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (!data || error) {
      toast({
        title: "Access denied",
        description: "You do not have admin access.",
        variant: "destructive"
      });
      await supabase.auth.signOut();
      navigate("/supplement-kings/admin/auth");
      return;
    }

    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all leads with contractor info
      const { data: leadsData, error: leadsError } = await supabase
        .from('supplement_leads')
        .select(`
          *,
          supplement_contractors (
            company_name
          )
        `)
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;
      setLeads(leadsData || []);

      // Fetch all contractors
      const { data: contractorsData, error: contractorsError } = await supabase
        .from('supplement_contractors')
        .select('id, company_name, contact_name, email')
        .order('company_name');

      if (contractorsError) throw contractorsError;
      setContractors(contractorsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('supplement_leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: "Lead status has been updated successfully.",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status.",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.property_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.supplement_contractors?.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesContractor = filterContractor === "all" || lead.contractor_id === filterContractor;
    const matchesStatus = filterStatus === "all" || lead.status === filterStatus;

    return matchesSearch && matchesContractor && matchesStatus;
  });

  // Stats
  const totalLeads = leads.length;
  const totalContractors = contractors.length;
  const totalSettled = leads.reduce((sum, l) => sum + (l.settled_amount || 0), 0);
  const pendingLeads = leads.filter(l => !['settled'].includes(l.status)).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-blue-500/20 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600/20 to-yellow-500/20 flex items-center justify-center">
              <Crown className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Supplement Kings</h1>
              <p className="text-xs text-slate-400">Admin Dashboard</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSignOut}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Leads</p>
                  <p className="text-3xl font-bold text-white">{totalLeads}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Contractors</p>
                  <p className="text-3xl font-bold text-white">{totalContractors}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Pending</p>
                  <p className="text-3xl font-bold text-white">{pendingLeads}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Settled</p>
                  <p className="text-3xl font-bold text-white">${totalSettled.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-900/50 border-slate-700 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search by customer, address, or contractor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Select value={filterContractor} onValueChange={setFilterContractor}>
                <SelectTrigger className="w-full md:w-[200px] bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Filter by contractor" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Contractors</SelectItem>
                  {contractors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[200px] bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="xactimate_complete">Xactimate Complete</SelectItem>
                  <SelectItem value="supplement_sent">Supplement Sent</SelectItem>
                  <SelectItem value="negotiating">Negotiating</SelectItem>
                  <SelectItem value="settled">Settled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card className="bg-slate-900/50 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-400" />
              All Leads ({filteredLeads.length})
            </CardTitle>
            <CardDescription className="text-slate-400">
              Manage and update lead statuses across all contractors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                No leads found matching your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-400">Contractor</TableHead>
                      <TableHead className="text-slate-400">Customer</TableHead>
                      <TableHead className="text-slate-400">Property</TableHead>
                      <TableHead className="text-slate-400">Claim</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Submitted</TableHead>
                      <TableHead className="text-slate-400 text-right">Settlement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id} className="border-slate-700 hover:bg-slate-800/50">
                        <TableCell className="text-blue-400 font-medium">
                          {lead.supplement_contractors?.company_name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-white">{lead.customer_name}</TableCell>
                        <TableCell className="text-slate-300">
                          {lead.property_city}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600">
                            {lead.claim_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={lead.status} 
                            onValueChange={(value) => updateLeadStatus(lead.id, value)}
                          >
                            <SelectTrigger className={`w-[160px] border ${statusColors[lead.status]} bg-transparent`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="in_review">In Review</SelectItem>
                              <SelectItem value="xactimate_complete">Xactimate Complete</SelectItem>
                              <SelectItem value="supplement_sent">Supplement Sent</SelectItem>
                              <SelectItem value="negotiating">Negotiating</SelectItem>
                              <SelectItem value="settled">Settled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {format(new Date(lead.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          {lead.settled_amount ? (
                            <span className="text-green-400 font-semibold">
                              ${lead.settled_amount.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}