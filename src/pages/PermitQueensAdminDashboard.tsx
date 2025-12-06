import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Crown, ShieldCheck, LogOut, Search, FileText, Users, Clock, CheckCircle, Filter, Building2 } from "lucide-react";
import { format } from "date-fns";

interface PermitProject {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  property_address: string;
  city: string;
  state: string;
  zip_code: string;
  service_type: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  contractor_id: string | null;
  user_id: string;
}

interface PermitContractor {
  id: string;
  company_name: string;
  contact_name: string;
  user_id: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  documents_submitted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  documents_approved: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  pending_payment: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  permit_delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  inspection_scheduled: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  inspection_passed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  complete: "bg-green-600/20 text-green-300 border-green-500/30"
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  documents_submitted: "Docs Submitted",
  documents_approved: "Docs Approved",
  pending_payment: "Pending Payment",
  permit_delivered: "Permit Delivered",
  inspection_scheduled: "Inspection Scheduled",
  inspection_passed: "Inspection Passed",
  complete: "Complete"
};

export default function PermitQueensAdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<PermitProject[]>([]);
  const [contractors, setContractors] = useState<PermitContractor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("all");
  const [contractorFilter, setContractorFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await checkAdminAccess(session.user.id);
      } else {
        navigate("/permit-queens/admin/auth");
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        await checkAdminAccess(session.user.id);
      } else {
        navigate("/permit-queens/admin/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminAccess = async (userId: string) => {
    const { data: adminData } = await supabase
      .from("permit_admins")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!adminData) {
      toast.error("You don't have admin access.");
      await supabase.auth.signOut();
      navigate("/permit-queens/admin/auth");
      return;
    }

    await fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch all projects
    const { data: projectsData } = await supabase
      .from("permit_projects")
      .select("*")
      .order("created_at", { ascending: false });

    setProjects(projectsData || []);

    // Fetch all contractors
    const { data: contractorsData } = await supabase
      .from("permit_contractors")
      .select("*");

    setContractors(contractorsData || []);
    setLoading(false);
  };

  const updateProjectStatus = async (projectId: string, newStatus: string) => {
    const { error } = await supabase
      .from("permit_projects")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", projectId);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    toast.success("Status updated");
    fetchData();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getContractorName = (contractorId: string | null, userId: string) => {
    if (contractorId) {
      const contractor = contractors.find(c => c.id === contractorId);
      return contractor?.company_name || "Unknown";
    }
    // Fallback: try to find by user_id
    const contractor = contractors.find(c => c.user_id === userId);
    return contractor?.company_name || "Direct User";
  };

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = search === "" ||
      project.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      project.property_address.toLowerCase().includes(search.toLowerCase()) ||
      getContractorName(project.contractor_id, project.user_id).toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesServiceType = serviceTypeFilter === "all" || project.service_type === serviceTypeFilter;
    const matchesContractor = contractorFilter === "all" || 
      project.contractor_id === contractorFilter ||
      (contractorFilter !== "all" && contractors.find(c => c.id === contractorFilter)?.user_id === project.user_id);

    const projectDate = new Date(project.created_at);
    const matchesDateFrom = !dateFrom || projectDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || projectDate <= new Date(dateTo + "T23:59:59");

    return matchesSearch && matchesStatus && matchesServiceType && matchesContractor && matchesDateFrom && matchesDateTo;
  });

  // Get unique service types
  const serviceTypes = [...new Set(projects.map(p => p.service_type))];

  // Stats
  const totalProjects = projects.length;
  const pendingProjects = projects.filter(p => p.status === "pending").length;
  const completedProjects = projects.filter(p => p.status === "complete").length;
  const totalContractors = contractors.length;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-amber-500" />
              <div>
                <h1 className="text-xl font-bold text-white">Permit Queens</h1>
                <p className="text-sm text-amber-500 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Admin Dashboard
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="border-slate-700 text-slate-300">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{totalProjects}</p>
                  <p className="text-sm text-slate-400">Total Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{pendingProjects}</p>
                  <p className="text-sm text-slate-400">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{completedProjects}</p>
                  <p className="text-sm text-slate-400">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{totalContractors}</p>
                  <p className="text-sm text-slate-400">Contractors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-900 border-slate-800 mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search customer, address, contractor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Services</SelectItem>
                  {serviceTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={contractorFilter} onValueChange={setContractorFilter}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Contractor" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Contractors</SelectItem>
                  {contractors.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="From"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white w-auto"
                placeholder="To"
              />
              <p className="text-sm text-slate-400">
                Showing {filteredProjects.length} of {projects.length} projects
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Projects Table */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">All Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-400">Loading projects...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Customer</TableHead>
                      <TableHead className="text-slate-400">Property</TableHead>
                      <TableHead className="text-slate-400">Service</TableHead>
                      <TableHead className="text-slate-400">Contractor</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Created</TableHead>
                      <TableHead className="text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => (
                      <TableRow key={project.id} className="border-slate-800">
                        <TableCell>
                          <div>
                            <p className="font-medium text-white">{project.customer_name}</p>
                            <p className="text-sm text-slate-400">{project.customer_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-white">{project.property_address}</p>
                            <p className="text-sm text-slate-400">{project.city}, {project.state} {project.zip_code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">{project.service_type}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            <span className="text-white">{getContractorName(project.contractor_id, project.user_id)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[project.status] || "bg-slate-500/20 text-slate-400"}>
                            {statusLabels[project.status] || project.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {format(new Date(project.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={project.status}
                            onValueChange={(value) => updateProjectStatus(project.id, value)}
                          >
                            <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              {Object.entries(statusLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
