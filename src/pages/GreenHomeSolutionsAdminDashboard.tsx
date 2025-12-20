import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  LogOut, 
  Search, 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Download,
  Phone,
  Mail,
  MapPin,
  Eye
} from "lucide-react";
import ghiLogo from "@/assets/ghi-logo.png";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WindowLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  property_address: string;
  city: string | null;
  zip_code: string | null;
  window_selections: any;
  total_windows: number | null;
  performance_level: string | null;
  discount_percent: number | null;
  estimate_low: number | null;
  estimate_high: number | null;
  discounted_price: number | null;
  status: string | null;
  created_at: string;
  appointment_date: string | null;
  appointment_time: string | null;
}

const GreenHomeSolutionsAdminDashboard = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<WindowLead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<WindowLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<WindowLead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    let filtered = leads;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        lead =>
          lead.name.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          lead.property_address.toLowerCase().includes(query)
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }
    
    setFilteredLeads(filtered);
  }, [leads, searchQuery, statusFilter]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("window_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
      setFilteredLeads(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch leads");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("window_leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;
      
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      toast.success("Status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/green-home-solutions/admin/auth");
  };

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Address", "Windows", "Estimate", "Discount", "Status", "Date"];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.email,
      lead.phone || "",
      lead.property_address,
      lead.total_windows || 0,
      `$${lead.estimate_low || 0} - $${lead.estimate_high || 0}`,
      `${lead.discount_percent || 0}%`,
      lead.status || "new",
      format(new Date(lead.created_at), "yyyy-MM-dd")
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `window-leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const stats = {
    total: leads.length,
    scheduled: leads.filter(l => l.appointment_date).length,
    avgDiscount: leads.length > 0 
      ? Math.round(leads.reduce((sum, l) => sum + (l.discount_percent || 0), 0) / leads.length) 
      : 0,
    totalRevenue: leads.reduce((sum, l) => sum + (l.discounted_price || l.estimate_low || 0), 0)
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-700";
      case "contacted": return "bg-yellow-100 text-yellow-700";
      case "scheduled": return "bg-purple-100 text-purple-700";
      case "quoted": return "bg-orange-100 text-orange-700";
      case "sold": return "bg-emerald-100 text-emerald-700";
      case "lost": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/green-home-solutions">
              <img src={ghiLogo} alt="GHI" className="h-12 w-auto" />
            </Link>
            <div>
              <h1 className="font-semibold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Window Leads Management</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Leads</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.scheduled}</div>
                  <div className="text-sm text-muted-foreground">Scheduled</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.avgDiscount}%</div>
                  <div className="text-sm text-muted-foreground">Avg Discount</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">${(stats.totalRevenue / 1000).toFixed(0)}k</div>
                  <div className="text-sm text-muted-foreground">Potential Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Actions */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="quoted">Quoted</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={exportToCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>Window Leads</CardTitle>
            <CardDescription>
              {filteredLeads.length} leads found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Windows</TableHead>
                    <TableHead>Estimate</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-sm text-muted-foreground">{lead.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {lead.property_address}
                          {lead.city && <span>, {lead.city}</span>}
                        </div>
                      </TableCell>
                      <TableCell>{lead.total_windows || 0}</TableCell>
                      <TableCell>
                        ${(lead.estimate_low || 0).toLocaleString()} - ${(lead.estimate_high || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-100 text-yellow-700">
                          {lead.discount_percent || 0}% off
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={lead.status || "new"} 
                          onValueChange={(v) => updateLeadStatus(lead.id, v)}
                        >
                          <SelectTrigger className="w-32">
                            <Badge className={getStatusColor(lead.status)}>
                              {lead.status || "new"}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="quoted">Quoted</SelectItem>
                            <SelectItem value="sold">Sold</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {format(new Date(lead.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Lead Details Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              Complete information for this window quote lead
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {selectedLead.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {selectedLead.email}
                    </div>
                    {selectedLead.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {selectedLead.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {selectedLead.property_address}
                      {selectedLead.city && `, ${selectedLead.city}`}
                      {selectedLead.zip_code && ` ${selectedLead.zip_code}`}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Quote Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>Windows: {selectedLead.total_windows}</div>
                    <div>Performance: {selectedLead.performance_level}</div>
                    <div>Estimate: ${(selectedLead.estimate_low || 0).toLocaleString()} - ${(selectedLead.estimate_high || 0).toLocaleString()}</div>
                    <div>Discount: {selectedLead.discount_percent}%</div>
                    <div className="font-semibold text-emerald-600">
                      Final: ${(selectedLead.discounted_price || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedLead.window_selections && (
                <div>
                  <h4 className="font-semibold mb-2">Window Selections</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(selectedLead.window_selections, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
                  <a href={`tel:${selectedLead.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Customer
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={`mailto:${selectedLead.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email Customer
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GreenHomeSolutionsAdminDashboard;
