import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, LogOut, Home, Search, Calendar, Users, DollarSign, Percent, Download, Crown, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { isCoatingKingsDomain, getMainSiteUrl } from "@/lib/utils";

interface CoatingLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  property_address: string;
  roof_type: string;
  coating_type: string;
  estimated_sqft: number | null;
  estimate_low: number | null;
  estimate_high: number | null;
  discount_percent: number | null;
  discounted_price: number | null;
  roof_age: string | null;
  roof_condition: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  status: string | null;
  created_at: string | null;
}

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-blue-500" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { value: "scheduled", label: "Scheduled", color: "bg-purple-500" },
  { value: "completed", label: "Completed", color: "bg-green-500" },
  { value: "closed", label: "Closed", color: "bg-gray-500" },
];

const CoatingKingsAdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<CoatingLead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const isStandaloneDomain = isCoatingKingsDomain();
  const authPath = isStandaloneDomain ? "/admin/auth" : "/coating-kings/admin/auth";
  const mainSiteUrl = getMainSiteUrl();

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate(authPath);
        return;
      }

      // Verify admin status
      const { data: adminData } = await supabase
        .from("coating_admins")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!adminData) {
        await supabase.auth.signOut();
        navigate(authPath);
        return;
      }

      fetchLeads();
    };

    checkAuthAndFetch();
  }, [navigate, authPath]);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("coating_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("coating_leads")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setLeads(prev =>
        prev.map(l => l.id === id ? { ...l, status: newStatus } : l)
      );

      toast({
        title: "Status updated",
        description: `Lead status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch =
      !searchQuery ||
      l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.property_address?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || l.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalLeads = leads.length;
  const leadsWithDiscount = leads.filter(l => l.discount_percent).length;
  const avgDiscount = leadsWithDiscount > 0 
    ? Math.round(leads.reduce((sum, l) => sum + (l.discount_percent || 0), 0) / leadsWithDiscount)
    : 0;
  const scheduledLeads = leads.filter(l => l.appointment_date).length;
  const totalPotentialRevenue = leads.reduce((sum, l) => sum + (l.discounted_price || l.estimate_low || 0), 0);

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Address", "Coating", "Sqft", "Discount", "Price", "Appointment", "Status", "Created"];
    const rows = filteredLeads.map(l => [
      l.name || "",
      l.email || "",
      l.phone || "",
      l.property_address || "",
      l.coating_type || "",
      l.estimated_sqft || "",
      l.discount_percent ? `${l.discount_percent}%` : "",
      l.discounted_price ? `$${l.discounted_price}` : "",
      l.appointment_date ? `${l.appointment_date} ${l.appointment_time}` : "Not scheduled",
      l.status || "",
      l.created_at ? format(new Date(l.created_at), "PP") : "",
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coating-leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Crown className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Coating Kings Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Coating Kings
              </Button>
            </Link>
            {isStandaloneDomain ? (
              <a href={mainSiteUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  GCN
                </Button>
              </a>
            ) : (
              <Link to="/">
                <Button variant="ghost" size="sm">
                  Home
                </Button>
              </Link>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                  <p className="text-2xl font-bold">{totalLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Percent className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Discount</p>
                  <p className="text-2xl font-bold">{avgDiscount}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="text-2xl font-bold">{scheduledLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Potential Revenue</p>
                  <p className="text-2xl font-bold">${totalPotentialRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Spin Wheel Leads</CardTitle>
            <CardDescription>Manage all leads from the spin wheel discount feature</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Coating</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Appointment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No leads found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <p className="text-sm text-muted-foreground">{lead.email}</p>
                            <p className="text-sm text-muted-foreground">{lead.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{lead.property_address}</p>
                            {lead.estimated_sqft && (
                              <p className="text-sm text-muted-foreground">{lead.estimated_sqft.toLocaleString()} sq ft</p>
                            )}
                            {lead.roof_condition && (
                              <Badge variant="outline" className="mt-1">{lead.roof_condition}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lead.coating_type}</p>
                            <p className="text-sm text-muted-foreground">{lead.roof_type}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.discount_percent ? (
                            <Badge className="bg-green-500">
                              {lead.discount_percent}% OFF
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.discounted_price ? (
                            <div>
                              <p className="font-semibold text-green-600">
                                ${lead.discounted_price.toLocaleString()}
                              </p>
                              {lead.estimate_low && (
                                <p className="text-sm text-muted-foreground line-through">
                                  ${lead.estimate_low.toLocaleString()}
                                </p>
                              )}
                            </div>
                          ) : lead.estimate_low ? (
                            <span>${lead.estimate_low.toLocaleString()}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.appointment_date ? (
                            <div>
                              <p className="text-sm">
                                {format(new Date(lead.appointment_date), "MMM d, yyyy")}
                              </p>
                              <p className="text-sm text-muted-foreground">{lead.appointment_time}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not scheduled</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={lead.status || "new"}
                            onValueChange={(value) => handleStatusChange(lead.id, value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map(s => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CoatingKingsAdminDashboard;
