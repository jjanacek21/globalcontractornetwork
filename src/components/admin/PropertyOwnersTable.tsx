import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, Eye, Mail, Phone, MapPin, Calendar, User, FileText, Camera, Star } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface PropertyOwner {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
  role: string | null;
}

interface OwnerDetails {
  profile: PropertyOwner;
  coatingLeads: any[];
  windowLeads: any[];
  contactRequests: any[];
  projects: any[];
  photos: any[];
  appointments: any[];
}

const PropertyOwnersTable = () => {
  const [loading, setLoading] = useState(true);
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<OwnerDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPropertyOwners();
  }, []);

  const fetchPropertyOwners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone, created_at, role")
        .eq("role", "homeowner")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOwners(data || []);
    } catch (error) {
      console.error("Error fetching property owners:", error);
      toast({
        title: "Error",
        description: "Failed to load property owners",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewOwner = async (owner: PropertyOwner) => {
    setLoadingDetails(true);
    setDialogOpen(true);

    try {
      // Fetch all related data separately - cast to any to avoid type recursion issues
      const coatingLeadsResult = await supabase.from("coating_leads").select("*").eq("user_id", owner.id);
      const windowLeadsResult = await supabase.from("window_leads").select("*").eq("user_id", owner.id);
      const contactRequestsResult = await supabase.from("contact_requests").select("*").eq("user_id", owner.id);
      const projectsResult = await (supabase.from("homeowner_projects") as any).select("*").eq("homeowner_id", owner.id);
      const photosResult = await supabase.from("homeowner_photos").select("*").eq("user_id", owner.id);
      const appointmentsResult = await supabase.from("homeowner_appointments").select("*").eq("homeowner_id", owner.id);

      setSelectedOwner({
        profile: owner,
        coatingLeads: coatingLeadsResult.data || [],
        windowLeads: windowLeadsResult.data || [],
        contactRequests: contactRequestsResult.data || [],
        projects: projectsResult.data || [],
        photos: photosResult.data || [],
        appointments: appointmentsResult.data || [],
      });
    } catch (error) {
      console.error("Error fetching owner details:", error);
      toast({
        title: "Error",
        description: "Failed to load owner details",
        variant: "destructive",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const getFullName = (owner: PropertyOwner) => {
    const parts = [owner.first_name, owner.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Unknown";
  };

  const filteredOwners = owners.filter((owner) => {
    const name = getFullName(owner).toLowerCase();
    const email = owner.email?.toLowerCase() || "";
    const phone = owner.phone || "";
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query) || phone.includes(query);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary">{filteredOwners.length} property owners</Badge>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOwners.length === 0 ? (
              <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No property owners found
                </TableCell>
              </TableRow>
            ) : (
              filteredOwners.map((owner) => (
                <TableRow key={owner.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      {getFullName(owner)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {owner.email ? (
                      <a href={`mailto:${owner.email}`} className="text-primary hover:underline">
                        {owner.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {owner.phone ? (
                      <a href={`tel:${owner.phone}`} className="text-primary hover:underline">
                        {owner.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {owner.created_at ? format(new Date(owner.created_at), "MMM d, yyyy") : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleViewOwner(owner)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Owner Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Property Owner Details
            </DialogTitle>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedOwner ? (
            <div className="space-y-6">
              {/* Profile Info */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-xl font-semibold">
                        {getFullName(selectedOwner.profile)}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {selectedOwner.profile.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {selectedOwner.profile.email}
                          </div>
                        )}
                        {selectedOwner.profile.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {selectedOwner.profile.phone}
                          </div>
                        )}
                        {selectedOwner.profile.created_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Joined {format(new Date(selectedOwner.profile.created_at), "MMM d, yyyy")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 pb-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                      <FileText className="h-4 w-4" />
                      <span className="text-xs">Leads</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {selectedOwner.coatingLeads.length + selectedOwner.windowLeads.length + selectedOwner.contactRequests.length}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                      <Star className="h-4 w-4" />
                      <span className="text-xs">Projects</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedOwner.projects.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                      <Camera className="h-4 w-4" />
                      <span className="text-xs">Photos</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedOwner.photos.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs">Appointments</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedOwner.appointments.length}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              {(selectedOwner.coatingLeads.length > 0 || selectedOwner.windowLeads.length > 0) && (
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-4">Lead Submissions</h4>
                    <div className="space-y-3">
                      {selectedOwner.coatingLeads.slice(0, 3).map((lead) => (
                        <div key={lead.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{lead.coating_type} Coating</p>
                            <p className="text-sm text-muted-foreground">{lead.property_address}</p>
                          </div>
                          <Badge>{lead.status || "new"}</Badge>
                        </div>
                      ))}
                      {selectedOwner.windowLeads.slice(0, 3).map((lead) => (
                        <div key={lead.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">Window Project ({lead.total_windows} windows)</p>
                            <p className="text-sm text-muted-foreground">{lead.property_address}</p>
                          </div>
                          <Badge>{lead.status || "new"}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Projects */}
              {selectedOwner.projects.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-4">Projects</h4>
                    <div className="space-y-3">
                      {selectedOwner.projects.slice(0, 5).map((project) => (
                        <div key={project.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{project.title || project.service_type}</p>
                            <p className="text-sm text-muted-foreground">{project.property_address}</p>
                          </div>
                          <Badge variant={project.status === "completed" ? "default" : "secondary"}>
                            {project.status || "pending"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Appointments */}
              {selectedOwner.appointments.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-4">Appointments</h4>
                    <div className="space-y-3">
                      {selectedOwner.appointments.slice(0, 5).map((appt) => (
                        <div key={appt.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{appt.service_type}</p>
                            <p className="text-sm text-muted-foreground">
                              {appt.scheduled_date} at {appt.scheduled_time}
                              {appt.contractor?.company_name && ` • ${appt.contractor.company_name}`}
                            </p>
                          </div>
                          <Badge variant={appt.status === "confirmed" ? "default" : "secondary"}>
                            {appt.status || "pending"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyOwnersTable;
