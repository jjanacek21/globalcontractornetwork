import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, LogOut, Users, FileText, Building2, TrendingUp, 
  Search, Loader2, DollarSign, Eye, BarChart3, UserPlus, Bell, Lightbulb, ShieldCheck, GraduationCap, Brain, AlertTriangle, Trophy, Home
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { LeadDetailsDialog } from "@/components/admin/LeadDetailsDialog";
import { ContractorDialog } from "@/components/admin/ContractorDialog";
import { LeadAnalytics } from "@/components/admin/LeadAnalytics";
import PendingSignupsTable from "@/components/admin/PendingSignupsTable";
import SuperAdminsTable from "@/components/admin/SuperAdminsTable";
import ReferralsManagement from "@/components/admin/ReferralsManagement";
import AITrainingCenter from "@/components/admin/AITrainingCenter";
import ResourcesManagement from "@/components/admin/ResourcesManagement";
import ContractorsTable from "@/components/admin/ContractorsTable";
import CompaniesTable from "@/components/admin/CompaniesTable";
import EnhancedLeadsTable from "@/components/admin/EnhancedLeadsTable";
import GamificationManagement from "@/components/admin/GamificationManagement";
import PropertyOwnersTable from "@/components/admin/PropertyOwnersTable";

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

interface Contractor {
  id: string;
  source: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

interface RecentSignup {
  id: string;
  company_name: string;
  created_at: string;
}

interface Stats {
  totalLeads: number;
  totalContractors: number;
  thisWeekLeads: number;
  totalRevenue: number;
}

const SOURCE_TABLE_MAP: Record<string, string> = {
  'Coating Kings': 'coating_leads',
  'Green Home Improvements': 'window_leads',
  'Supplement Kings': 'supplement_leads',
  'Permit Queens': 'permit_projects',
  'Roofing Services': 'roofing_consultations',
  'Contact Request': 'contact_requests',
  'Prep Your Property': 'service_requests',
};

const CONTRACTOR_TABLE_MAP: Record<string, string> = {
  'Directory': 'contractor_profiles',
  'Supplement Kings': 'supplement_contractors',
  'Permit Queens': 'permit_contractors',
};

const SuperAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<UnifiedLead[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [stats, setStats] = useState<Stats>({ totalLeads: 0, totalContractors: 0, thisWeekLeads: 0, totalRevenue: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [pendingCount, setPendingCount] = useState(0);
  const [loginRequestCount, setLoginRequestCount] = useState(0);
  const [escalatedCount, setEscalatedCount] = useState(0);
  const [recentSignups, setRecentSignups] = useState<RecentSignup[]>([]);
  const [activeTab, setActiveTab] = useState<string>("leads");
  
  // Lead dialog state
  const [selectedLead, setSelectedLead] = useState<UnifiedLead | null>(null);
  const [selectedLeadRawData, setSelectedLeadRawData] = useState<any>(null);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [leadDialogMode, setLeadDialogMode] = useState<'view' | 'edit'>('view');
  
  // Contractor dialog state
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [selectedContractorRawData, setSelectedContractorRawData] = useState<any>(null);
  const [contractorDialogOpen, setContractorDialogOpen] = useState(false);
  const [contractorDialogMode, setContractorDialogMode] = useState<'view' | 'edit' | 'add'>('view');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAndFetchData();
  }, []);

  // Real-time subscription for new contractor signups
  useEffect(() => {
    const channel = supabase
      .channel('contractor-signups')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contractor_profiles'
        },
        (payload) => {
          const newSignup = payload.new as RecentSignup;
          setRecentSignups(prev => [newSignup, ...prev].slice(0, 10));
          setPendingCount(prev => prev + 1);
          
          toast({
            title: "New Contractor Application",
            description: `${newSignup.company_name} just applied!`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Real-time subscription for new login requests
  useEffect(() => {
    const channel = supabase
      .channel('login-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'login_requests'
        },
        (payload: any) => {
          const newRequest = payload.new;
          if (newRequest.status === 'pending') {
            setLoginRequestCount(prev => prev + 1);
            
            toast({
              title: "New Login Request",
              description: `${newRequest.company_name || newRequest.email} requested access to ${newRequest.service_type}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const checkAdminAndFetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      navigate("/admin/auth");
      return;
    }

    const { data: superAdmin } = await supabase
      .from("super_admins")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!superAdmin) {
      navigate("/admin/auth");
      return;
    }

    await fetchAllData();
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch pending count and recent signups
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: pendingContractors } = await supabase
        .from("contractor_profiles")
        .select("id, company_name, created_at")
        .eq("subscription_status", "pending");

      const { data: recentContractors } = await supabase
        .from("contractor_profiles")
        .select("id, company_name, created_at")
        .gte("created_at", twentyFourHoursAgo.toISOString())
        .order("created_at", { ascending: false });

      setPendingCount(pendingContractors?.length || 0);
      setRecentSignups(recentContractors || []);

      // Fetch login request counts
      const { data: pendingLoginRequests } = await supabase
        .from("login_requests")
        .select("id, is_escalated")
        .eq("status", "pending");

      setLoginRequestCount(pendingLoginRequests?.length || 0);
      setEscalatedCount(pendingLoginRequests?.filter(r => r.is_escalated).length || 0);

      // Auto-select pending tab if there are pending contractors or login requests
      if ((pendingContractors?.length || 0) > 0) {
        setActiveTab("pending");
      } else if ((pendingLoginRequests?.length || 0) > 0) {
        setActiveTab("logins");
      }

      const [
        coatingLeads, roofingConsultations, supplementLeads, permitProjects,
        contactRequests, serviceRequests, courseEnrollments, storeMembers,
        contractorProfiles, supplementContractors, permitContractors, windowLeads
      ] = await Promise.all([
        supabase.from("coating_leads").select("*").order("created_at", { ascending: false }),
        supabase.from("roofing_consultations").select("*").order("created_at", { ascending: false }),
        supabase.from("supplement_leads").select("*").order("created_at", { ascending: false }),
        supabase.from("permit_projects").select("*").order("created_at", { ascending: false }),
        supabase.from("contact_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("service_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("course_enrollments").select("*").order("enrolled_at", { ascending: false }),
        supabase.from("store_members").select("*").order("created_at", { ascending: false }),
        supabase.from("contractor_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("supplement_contractors").select("*").order("created_at", { ascending: false }),
        supabase.from("permit_contractors").select("*").order("created_at", { ascending: false }),
        supabase.from("window_leads").select("*").order("created_at", { ascending: false }),
      ]);

      const unifiedLeads: UnifiedLead[] = [];

      (coatingLeads.data || []).forEach(lead => {
        unifiedLeads.push({ id: lead.id, source: "Coating Kings", customerName: lead.name, email: lead.email, phone: lead.phone, status: lead.status, createdAt: lead.created_at || "", details: `${lead.coating_type} - ${lead.property_address}` });
      });

      (roofingConsultations.data || []).forEach(lead => {
        unifiedLeads.push({ id: lead.id, source: "Roofing Services", customerName: lead.customer_name || "Unknown", email: lead.customer_email, phone: lead.customer_phone, status: lead.status, createdAt: lead.created_at || "", details: `${lead.roof_type || "N/A"} - ${lead.sqft || 0} sqft` });
      });

      (supplementLeads.data || []).forEach(lead => {
        unifiedLeads.push({ id: lead.id, source: "Supplement Kings", customerName: lead.customer_name, email: lead.customer_email, phone: lead.customer_phone, status: lead.status, createdAt: lead.created_at || "", details: `${lead.claim_type} - ${lead.property_city}` });
      });

      (permitProjects.data || []).forEach(lead => {
        unifiedLeads.push({ id: lead.id, source: "Permit Queens", customerName: lead.customer_name, email: lead.customer_email, phone: lead.customer_phone, status: lead.status, createdAt: lead.created_at || "", details: `${lead.service_type} - ${lead.property_address}` });
      });

      (contactRequests.data || []).forEach(lead => {
        unifiedLeads.push({ id: lead.id, source: "Contact Request", customerName: lead.name, email: lead.email, phone: lead.phone, status: lead.status, createdAt: lead.created_at || "", details: lead.message?.substring(0, 50) || "General inquiry" });
      });

      (serviceRequests.data || []).forEach(lead => {
        unifiedLeads.push({ id: lead.id, source: "Prep Your Property", customerName: lead.name, email: lead.email, phone: lead.phone, status: lead.status, createdAt: lead.created_at || "", details: lead.property_address || "Service request" });
      });

      (windowLeads.data || []).forEach(lead => {
        unifiedLeads.push({ id: lead.id, source: "Green Home Improvements", customerName: lead.name, email: lead.email, phone: lead.phone, status: lead.status, createdAt: lead.created_at || "", details: `${lead.total_windows || 0} windows - ${lead.property_address}` });
      });

      unifiedLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLeads(unifiedLeads);

      const allContractors: Contractor[] = [];

      (contractorProfiles.data || []).forEach(c => {
        allContractors.push({ id: c.id, source: "Directory", companyName: c.company_name, contactName: null, email: c.email, phone: c.phone, createdAt: c.created_at || "" });
      });

      (supplementContractors.data || []).forEach(c => {
        allContractors.push({ id: c.id, source: "Supplement Kings", companyName: c.company_name, contactName: c.contact_name, email: c.email, phone: c.phone, createdAt: c.created_at || "" });
      });

      (permitContractors.data || []).forEach(c => {
        allContractors.push({ id: c.id, source: "Permit Queens", companyName: c.company_name, contactName: c.contact_name, email: c.email, phone: c.phone, createdAt: c.created_at || "" });
      });

      allContractors.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setContractors(allContractors);

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeekLeads = unifiedLeads.filter(l => new Date(l.createdAt) >= oneWeekAgo).length;
      const revenue = (supplementLeads.data || []).reduce((sum, lead) => sum + (lead.settled_amount || 0), 0);

      setStats({ totalLeads: unifiedLeads.length, totalContractors: allContractors.length, thisWeekLeads, totalRevenue: revenue });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleLeadClick = async (lead: UnifiedLead) => {
    const tableName = SOURCE_TABLE_MAP[lead.source];
    if (tableName) {
      const { data } = await supabase.from(tableName as any).select('*').eq('id', lead.id).maybeSingle();
      setSelectedLeadRawData(data);
    }
    setSelectedLead(lead);
    setLeadDialogMode('view');
    setLeadDialogOpen(true);
  };

  const handleContractorClick = async (contractor: Contractor, mode: 'view' | 'edit' = 'view') => {
    const tableName = CONTRACTOR_TABLE_MAP[contractor.source];
    if (tableName) {
      const { data } = await supabase.from(tableName as any).select('*').eq('id', contractor.id).maybeSingle();
      setSelectedContractorRawData(data);
    }
    setSelectedContractor(contractor);
    setContractorDialogMode(mode);
    setContractorDialogOpen(true);
  };

  const handleAddContractor = () => {
    setSelectedContractor(null);
    setSelectedContractorRawData(null);
    setContractorDialogMode('add');
    setContractorDialogOpen(true);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) || lead.phone?.includes(searchQuery);
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const filteredContractors = contractors.filter(c => {
    const matchesSearch = c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === "all" || c.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const uniqueSources = [...new Set(leads.map(l => l.source))];
  const contractorSources = [...new Set(contractors.map(c => c.source))];

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "new": return "bg-blue-100 text-blue-800";
      case "contacted": case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "scheduled": case "pending": return "bg-purple-100 text-purple-800";
      case "completed": case "settled": case "done": return "bg-green-100 text-green-800";
      case "cancelled": case "lost": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Master Admin Hub</h1>
              <p className="text-xs text-muted-foreground">Unified Platform Overview</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {(recentSignups.length + loginRequestCount) > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
                      {recentSignups.length + loginRequestCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Notifications</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
                        <span className="text-sm">Pending Signups</span>
                        <Badge>{pendingCount}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
                        <span className="text-sm">Login Requests</span>
                        <Badge>{loginRequestCount}</Badge>
                      </div>
                      {escalatedCount > 0 && (
                        <div className="flex justify-between items-center p-2 bg-red-50 rounded-lg border border-red-200">
                          <span className="text-sm flex items-center gap-1 text-red-700">
                            <AlertTriangle className="h-4 w-4" />
                            Escalated (48+ hrs)
                          </span>
                          <Badge className="bg-red-500">{escalatedCount}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  {recentSignups.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">New Signups (24h)</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {recentSignups.slice(0, 5).map(signup => (
                          <div key={signup.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                            <UserPlus className="h-4 w-4 text-primary flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{signup.company_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(signup.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Leads</p><p className="text-3xl font-bold">{stats.totalLeads}</p></div><div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center"><FileText className="h-6 w-6 text-primary" /></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Contractors</p><p className="text-3xl font-bold">{stats.totalContractors}</p></div><div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center"><Building2 className="h-6 w-6 text-accent" /></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">This Week</p><p className="text-3xl font-bold">{stats.thisWeekLeads}</p></div><div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><TrendingUp className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-3xl font-bold">${stats.totalRevenue.toLocaleString()}</p></div><div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center"><DollarSign className="h-6 w-6 text-yellow-600" /></div></div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div><CardTitle>Platform Data</CardTitle><CardDescription>View all leads and contractors across services</CardDescription></div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by name, email, or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-full sm:w-64" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="pending" className="gap-2 relative">
                  <UserPlus className="h-4 w-4" />
                  Pending Signups
                  {pendingCount > 0 && (
                    <Badge className="bg-red-500 text-white ml-1 h-5 min-w-[20px] p-0 flex items-center justify-center text-xs rounded-full">
                      {pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="leads" className="gap-2"><FileText className="h-4 w-4" />Leads</TabsTrigger>
                <TabsTrigger value="contractors" className="gap-2"><Users className="h-4 w-4" />Contractors</TabsTrigger>
                <TabsTrigger value="companies" className="gap-2"><Building2 className="h-4 w-4" />Companies</TabsTrigger>
                <TabsTrigger value="property-owners" className="gap-2">
                  <Home className="h-4 w-4" />Property Owners
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2"><BarChart3 className="h-4 w-4" />Analytics</TabsTrigger>
                <TabsTrigger value="referrals" className="gap-2"><Lightbulb className="h-4 w-4" />Referrals</TabsTrigger>
                <TabsTrigger value="resources" className="gap-2"><GraduationCap className="h-4 w-4" />Academy Resources</TabsTrigger>
                <TabsTrigger value="ai-training" className="gap-2 bg-purple-100 data-[state=active]:bg-purple-200">
                  <Brain className="h-4 w-4" />AI Training Center
                </TabsTrigger>
                <TabsTrigger value="gamification" className="gap-2">
                  <Trophy className="h-4 w-4" />Gamification
                </TabsTrigger>
                <TabsTrigger value="superadmins" className="gap-2"><ShieldCheck className="h-4 w-4" />Super Admins</TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <PendingSignupsTable />
              </TabsContent>

              <TabsContent value="leads">
                <EnhancedLeadsTable />
              </TabsContent>

              <TabsContent value="contractors">
                <ContractorsTable />
              </TabsContent>

              <TabsContent value="companies">
                <CompaniesTable />
              </TabsContent>

              <TabsContent value="property-owners">
                <PropertyOwnersTable />
              </TabsContent>

              <TabsContent value="analytics">
                <LeadAnalytics leads={leads} />
              </TabsContent>

              <TabsContent value="referrals">
                <ReferralsManagement />
              </TabsContent>

              <TabsContent value="resources">
                <ResourcesManagement />
              </TabsContent>

              <TabsContent value="ai-training">
                <AITrainingCenter />
              </TabsContent>

              <TabsContent value="gamification">
                <GamificationManagement />
              </TabsContent>

              <TabsContent value="superadmins">
                <SuperAdminsTable />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <LeadDetailsDialog
        open={leadDialogOpen}
        onOpenChange={setLeadDialogOpen}
        lead={selectedLead}
        rawData={selectedLeadRawData}
        mode={leadDialogMode}
        onModeChange={setLeadDialogMode}
        onRefresh={fetchAllData}
      />

      <ContractorDialog
        open={contractorDialogOpen}
        onOpenChange={setContractorDialogOpen}
        contractor={selectedContractor}
        rawData={selectedContractorRawData}
        mode={contractorDialogMode}
        onModeChange={setContractorDialogMode}
        onRefresh={fetchAllData}
      />
    </div>
  );
};

export default SuperAdminDashboard;
