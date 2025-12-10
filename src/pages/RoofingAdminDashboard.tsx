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
import { Loader2, LogOut, Home, Search, Calendar, Users, DollarSign, Clock, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface Consultation {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  roof_type: string | null;
  priority: string | null;
  timeline: string | null;
  budget: string | null;
  zip_code: string | null;
  sqft: number | null;
  recommended_package: string | null;
  estimated_price: number | null;
  appointment_type: string | null;
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

const RoofingAdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [appointmentFilter, setAppointmentFilter] = useState<string>("all");

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/roofing/admin/auth");
        return;
      }

      // Verify admin status
      const { data: adminData } = await supabase
        .from("roofing_admins")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!adminData) {
        await supabase.auth.signOut();
        navigate("/roofing/admin/auth");
        return;
      }

      fetchConsultations();
    };

    checkAuthAndFetch();
  }, [navigate]);

  const fetchConsultations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("roofing_consultations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error("Error fetching consultations:", error);
      toast({
        title: "Error",
        description: "Failed to load consultations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("roofing_consultations")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setConsultations(prev =>
        prev.map(c => c.id === id ? { ...c, status: newStatus } : c)
      );

      toast({
        title: "Status updated",
        description: `Consultation status changed to ${newStatus}`,
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

  const filteredConsultations = consultations.filter(c => {
    const matchesSearch =
      !searchQuery ||
      c.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.zip_code?.includes(searchQuery);

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesAppointment =
      appointmentFilter === "all" ||
      (appointmentFilter === "zoom" && c.appointment_type === "zoom") ||
      (appointmentFilter === "in-person" && c.appointment_type === "in-person") ||
      (appointmentFilter === "none" && !c.appointment_date);

    return matchesSearch && matchesStatus && matchesAppointment;
  });

  // Stats
  const totalConsultations = consultations.length;
  const scheduledConsultations = consultations.filter(c => c.appointment_date).length;
  const totalEstimatedRevenue = consultations.reduce((sum, c) => sum + (c.estimated_price || 0), 0);
  const newConsultations = consultations.filter(c => c.status === "new").length;

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Roof Type", "Package", "Estimated Price", "Appointment", "Status", "Created"];
    const rows = filteredConsultations.map(c => [
      c.customer_name || "",
      c.customer_email || "",
      c.customer_phone || "",
      c.roof_type || "",
      c.recommended_package || "",
      c.estimated_price || "",
      c.appointment_date ? `${c.appointment_date} ${c.appointment_time}` : "Not scheduled",
      c.status || "",
      c.created_at ? format(new Date(c.created_at), "PP") : "",
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roofing-consultations-${format(new Date(), "yyyy-MM-dd")}.csv`;
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
            <h1 className="text-xl font-bold">Roofing Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
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
                  <p className="text-sm text-muted-foreground">Total Consultations</p>
                  <p className="text-2xl font-bold">{totalConsultations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New (Action Needed)</p>
                  <p className="text-2xl font-bold">{newConsultations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="text-2xl font-bold">{scheduledConsultations}</p>
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
                  <p className="text-sm text-muted-foreground">Est. Revenue</p>
                  <p className="text-2xl font-bold">${totalEstimatedRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Consultations</CardTitle>
            <CardDescription>Manage all roofing consultation requests and scheduled appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or zip code..."
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
              <Select value={appointmentFilter} onValueChange={setAppointmentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by appointment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="in-person">In-Person</SelectItem>
                  <SelectItem value="none">Not Scheduled</SelectItem>
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
                    <TableHead>Package</TableHead>
                    <TableHead>Est. Price</TableHead>
                    <TableHead>Appointment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsultations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No consultations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredConsultations.map((consultation) => (
                      <TableRow key={consultation.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{consultation.customer_name || "N/A"}</p>
                            <p className="text-sm text-muted-foreground">{consultation.customer_email}</p>
                            <p className="text-sm text-muted-foreground">{consultation.customer_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{consultation.recommended_package || "N/A"}</p>
                            <p className="text-sm text-muted-foreground">{consultation.roof_type}</p>
                            {consultation.sqft && (
                              <p className="text-sm text-muted-foreground">{consultation.sqft.toLocaleString()} sq ft</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {consultation.estimated_price ? (
                            <span className="font-semibold text-green-600">
                              ${consultation.estimated_price.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {consultation.appointment_date ? (
                            <div>
                              <Badge variant={consultation.appointment_type === "zoom" ? "secondary" : "default"}>
                                {consultation.appointment_type === "zoom" ? "Zoom" : "In-Person"}
                              </Badge>
                              <p className="text-sm mt-1">
                                {format(new Date(consultation.appointment_date), "MMM d, yyyy")}
                              </p>
                              <p className="text-sm text-muted-foreground">{consultation.appointment_time}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not scheduled</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={consultation.status || "new"}
                            onValueChange={(value) => handleStatusChange(consultation.id, value)}
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
                        <TableCell>
                          {consultation.created_at
                            ? format(new Date(consultation.created_at), "MMM d, yyyy")
                            : "-"}
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

export default RoofingAdminDashboard;
