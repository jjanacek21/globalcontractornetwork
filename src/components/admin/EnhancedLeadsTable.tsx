import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, Loader2, Eye, Calendar, MapPin, Wrench, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { LeadDetailsDialog } from "@/components/admin/LeadDetailsDialog";

interface UnifiedLead {
  id: string;
  source: string;
  customerName: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  createdAt: string;
  details: string;
  workType: string;
  location: string | null;
}

const WORK_TYPE_MAP: Record<string, string> = {
  'Coating Kings': 'Roof Coating',
  'Green Home Improvements': 'Windows & Doors',
  'Supplement Kings': 'Insurance Claims',
  'Permit Queens': 'Permits',
  'Roofing Services': 'Roofing',
  'Contact Request': 'General Inquiry',
  'Prep Your Property': 'Property Prep',
  'Emergency Mitigation': 'Emergency Services'
};

const SOURCE_TABLE_MAP: Record<string, string> = {
  'Coating Kings': 'coating_leads',
  'Green Home Improvements': 'window_leads',
  'Supplement Kings': 'supplement_leads',
  'Permit Queens': 'permit_projects',
  'Roofing Services': 'roofing_consultations',
  'Contact Request': 'contact_requests',
  'Prep Your Property': 'service_requests',
};

export default function EnhancedLeadsTable() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<UnifiedLead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [workTypeFilter, setWorkTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  
  // Dialog state
  const [selectedLead, setSelectedLead] = useState<UnifiedLead | null>(null);
  const [selectedLeadRawData, setSelectedLeadRawData] = useState<any>(null);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [leadDialogMode, setLeadDialogMode] = useState<'view' | 'edit'>('view');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const [
        coatingLeads, roofingConsultations, supplementLeads, permitProjects,
        contactRequests, serviceRequests, windowLeads
      ] = await Promise.all([
        supabase.from("coating_leads").select("*").order("created_at", { ascending: false }),
        supabase.from("roofing_consultations").select("*").order("created_at", { ascending: false }),
        supabase.from("supplement_leads").select("*").order("created_at", { ascending: false }),
        supabase.from("permit_projects").select("*").order("created_at", { ascending: false }),
        supabase.from("contact_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("service_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("window_leads").select("*").order("created_at", { ascending: false }),
      ]);

      const unifiedLeads: UnifiedLead[] = [];

      (coatingLeads.data || []).forEach(lead => {
        unifiedLeads.push({ 
          id: lead.id, 
          source: "Coating Kings", 
          customerName: lead.name, 
          email: lead.email, 
          phone: lead.phone, 
          status: lead.status, 
          createdAt: lead.created_at || "", 
          details: `${lead.coating_type} - ${lead.property_address}`,
          workType: "Roof Coating",
          location: extractCity(lead.property_address)
        });
      });

      (roofingConsultations.data || []).forEach(lead => {
        const addressField = (lead as any).address || (lead as any).property_address || '';
        unifiedLeads.push({ 
          id: lead.id, 
          source: "Roofing Services", 
          customerName: lead.customer_name || "Unknown", 
          email: lead.customer_email, 
          phone: lead.customer_phone, 
          status: lead.status, 
          createdAt: lead.created_at || "", 
          details: `${lead.roof_type || "N/A"} - ${lead.sqft || 0} sqft`,
          workType: "Roofing",
          location: extractCity(addressField)
        });
      });

      (supplementLeads.data || []).forEach(lead => {
        unifiedLeads.push({ 
          id: lead.id, 
          source: "Supplement Kings", 
          customerName: lead.customer_name, 
          email: lead.customer_email, 
          phone: lead.customer_phone, 
          status: lead.status, 
          createdAt: lead.created_at || "", 
          details: `${lead.claim_type} - ${lead.property_city}`,
          workType: "Insurance Claims",
          location: lead.property_city
        });
      });

      (permitProjects.data || []).forEach(lead => {
        unifiedLeads.push({ 
          id: lead.id, 
          source: "Permit Queens", 
          customerName: lead.customer_name, 
          email: lead.customer_email, 
          phone: lead.customer_phone, 
          status: lead.status, 
          createdAt: lead.created_at || "", 
          details: `${lead.service_type} - ${lead.property_address}`,
          workType: "Permits",
          location: extractCity(lead.property_address)
        });
      });

      (contactRequests.data || []).forEach(lead => {
        unifiedLeads.push({ 
          id: lead.id, 
          source: "Contact Request", 
          customerName: lead.name, 
          email: lead.email, 
          phone: lead.phone, 
          status: lead.status, 
          createdAt: lead.created_at || "", 
          details: lead.message?.substring(0, 50) || "General inquiry",
          workType: "General Inquiry",
          location: null
        });
      });

      (serviceRequests.data || []).forEach(lead => {
        unifiedLeads.push({ 
          id: lead.id, 
          source: "Prep Your Property", 
          customerName: lead.name, 
          email: lead.email, 
          phone: lead.phone, 
          status: lead.status, 
          createdAt: lead.created_at || "", 
          details: lead.property_address || "Service request",
          workType: "Property Prep",
          location: extractCity(lead.property_address)
        });
      });

      (windowLeads.data || []).forEach(lead => {
        unifiedLeads.push({ 
          id: lead.id, 
          source: "Green Home Improvements", 
          customerName: lead.name, 
          email: lead.email, 
          phone: lead.phone, 
          status: lead.status, 
          createdAt: lead.created_at || "", 
          details: `${lead.total_windows || 0} windows - ${lead.property_address}`,
          workType: "Windows & Doors",
          location: extractCity(lead.property_address)
        });
      });

      unifiedLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLeads(unifiedLeads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({ title: "Error", description: "Failed to load leads", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const extractCity = (address: string | null): string | null => {
    if (!address) return null;
    const parts = address.split(",");
    if (parts.length >= 2) {
      return parts[parts.length - 2].trim();
    }
    return parts[0]?.trim() || null;
  };

  const handleLeadClick = async (lead: UnifiedLead, mode: 'view' | 'edit' = 'view') => {
    const tableName = SOURCE_TABLE_MAP[lead.source];
    if (tableName) {
      const { data } = await supabase.from(tableName as any).select('*').eq('id', lead.id).maybeSingle();
      setSelectedLeadRawData(data);
    }
    setSelectedLead(lead);
    setLeadDialogMode(mode);
    setLeadDialogOpen(true);
  };

  const handleDeleteLead = async (lead: UnifiedLead) => {
    const tableName = SOURCE_TABLE_MAP[lead.source];
    if (!tableName) {
      toast({ title: "Error", description: "Cannot delete this lead type", variant: "destructive" });
      return;
    }
    
    setDeletingId(lead.id);
    try {
      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', lead.id);

      if (error) throw error;

      toast({ title: "Success", description: "Lead deleted successfully" });
      fetchLeads();
    } catch (error: any) {
      console.error("Error deleting lead:", error);
      toast({ title: "Error", description: error.message || "Failed to delete lead", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  // Get unique values for filters
  const uniqueSources = [...new Set(leads.map(l => l.source))];
  const uniqueWorkTypes = [...new Set(leads.map(l => l.workType))];
  const uniqueLocations = [...new Set(leads.map(l => l.location).filter(Boolean))] as string[];
  const uniqueStatuses = [...new Set(leads.map(l => l.status).filter(Boolean))] as string[];

  // Apply filters
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery);
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesWorkType = workTypeFilter === "all" || lead.workType === workTypeFilter;
    const matchesLocation = locationFilter === "all" || lead.location === locationFilter;
    return matchesSearch && matchesSource && matchesStatus && matchesWorkType && matchesLocation;
  });

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
          <SelectTrigger className="w-44">
            <Wrench className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Work Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Work Types</SelectItem>
            {uniqueWorkTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-40">
            <MapPin className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {uniqueLocations.map(loc => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {uniqueStatuses.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-44">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {uniqueSources.map(source => (
              <SelectItem key={source} value={source}>{source}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredLeads.length} of {leads.length} leads
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Work Type</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No leads found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.slice(0, 100).map((lead) => (
                <TableRow key={`${lead.source}-${lead.id}`} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Badge variant="outline">{lead.source}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-primary/10 text-primary">{lead.workType}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{lead.customerName}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {lead.email && <div>{lead.email}</div>}
                      {lead.phone && <div className="text-muted-foreground">{lead.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.location ? (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {lead.location}
                      </div>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(lead.status)}>{lead.status || "N/A"}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {lead.details}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {lead.createdAt ? format(new Date(lead.createdAt), "MMM d, yyyy") : "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => handleLeadClick(lead, 'view')}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => handleLeadClick(lead, 'edit')}
                        title="Edit lead"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={deletingId === lead.id}
                            title="Delete lead"
                          >
                            {deletingId === lead.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this lead from {lead.customerName}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteLead(lead)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {filteredLeads.length > 100 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing 100 of {filteredLeads.length} leads
        </p>
      )}

      {/* Lead Details Dialog */}
      <LeadDetailsDialog
        open={leadDialogOpen}
        onOpenChange={setLeadDialogOpen}
        lead={selectedLead}
        rawData={selectedLeadRawData}
        mode={leadDialogMode}
        onModeChange={setLeadDialogMode}
        onRefresh={fetchLeads}
      />
    </div>
  );
}
