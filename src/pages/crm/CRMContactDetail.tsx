import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContact, type ContactWithDetails } from "@/hooks/useContacts";
import { useContacts } from "@/hooks/useContacts";
import { useNotes } from "@/hooks/useNotes";
import { NotesList } from "@/components/crm/NotesList";
import { LeadDetailSheet } from "@/components/crm/LeadDetailSheet";
import { useLead } from "@/hooks/useLeads";
import { useLeads } from "@/hooks/useLeads";
import { useContactDocuments } from "@/hooks/useContactDocuments";
import { useContactCommunications } from "@/hooks/useContactCommunications";
import { SendEmailDialog } from "@/components/crm/SendEmailDialog";
import { AddressGeocoder } from "@/components/crm/AddressGeocoder";
import { EstimateBuilderDialog } from "@/components/estimates/EstimateBuilderDialog";
import { InlineRoofMeasurement } from "@/components/crm/InlineRoofMeasurement";
import { ContactPropertyMap, type MeasurementPin } from "@/components/crm/ContactPropertyMap";
import { ContactEstimatesCard } from "@/components/estimates/ContactEstimatesCard";
import { useContactEstimates } from "@/hooks/useEstimateBuilderV2";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateLeadDialog } from "@/components/crm/CreateLeadDialog";
import { EditContactDialog } from "@/components/crm/EditContactDialog";
import {
  ArrowLeft, Phone, Mail, MapPin, Edit, Plus, Copy, Send,
  ExternalLink, Calendar, Star, Briefcase, MessageSquare,
  FileText, Upload, PhoneCall, Clock, User, TrendingUp, Trash2, Image, File, Ruler, DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const CONTACT_STATUSES = [
  { value: "new", label: "New" },
  { value: "qualified", label: "Qualified" },
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
  { value: "not_home", label: "Not Home" },
  { value: "converted", label: "Converted" },
];

export default function CRMContactDetail() {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const { contact, isLoading, refetch } = useContact(contactId || null);
  const { updateContact } = useContacts();
  const { toast } = useToast();
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [showEditContact, setShowEditContact] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showSendEmail, setShowSendEmail] = useState(false);
  const [showEstimateBuilder, setShowEstimateBuilder] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [autoTriggerMeasurement, setAutoTriggerMeasurement] = useState(false);
  const { notes, isLoading: notesLoading, createNote, deleteNote } = useNotes("contact", contactId || null);
  const { lead: selectedLead, isLoading: leadLoading, refetch: refetchLead } = useLead(selectedLeadId);
  const { updateLeadStatus } = useLeads(contact?.company_id || undefined);
  const { estimates, isLoading: estimatesLoading, refetch: refetchEstimates } = useContactEstimates(contactId || null);

  // Measurements
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [measurementsLoading, setMeasurementsLoading] = useState(false);

  useEffect(() => {
    if (!contactId) return;
    setMeasurementsLoading(true);
    supabase
      .from("roof_measurements")
      .select("*")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMeasurements(data || []);
        setMeasurementsLoading(false);
      });
  }, [contactId]);

  // Documents & Communications
  const { documents, isLoading: docsLoading, isUploading, uploadDocument, deleteDocument, getSignedUrl } = useContactDocuments(contactId || null);
  const { communications, isLoading: commsLoading, stats: commStats, logCommunication } = useContactCommunications(contactId || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commNote, setCommNote] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Contact not found</p>
        <Button variant="outline" onClick={() => navigate("/member/crm/contacts")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contacts
        </Button>
      </div>
    );
  }

  const initials = `${contact.first_name?.[0] || ""}${contact.last_name?.[0] || ""}`.toUpperCase();
  const fullName = `${contact.first_name} ${contact.last_name}`;
  const leadCount = contact.leads?.length || 0;
  const propertyCount = contact.properties?.length || 0;
  const primaryProperty = contact.properties?.[0];
  const primaryAddress = primaryProperty
    ? [primaryProperty.address_line1, primaryProperty.city, primaryProperty.state, primaryProperty.zip].filter(Boolean).join(", ")
    : null;

  const handleStatusChange = async (status: string) => {
    await updateContact(contact.id, { status });
    refetch();
  };

  const copyPortalLink = () => {
    const link = `${window.location.origin}/portal/homeowner/${contact.id}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Portal link copied to clipboard" });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      await uploadDocument(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLogComm = async (type: string) => {
    await logCommunication({
      comm_type: type,
      direction: "outbound",
      content: commNote || `${type.charAt(0).toUpperCase() + type.slice(1)} initiated`,
      company_id: contact.company_id || undefined,
    });
    setCommNote("");
  };

  const handleViewDocument = async (doc: any) => {
    const url = await getSignedUrl(doc.file_path);
    if (url) window.open(url, "_blank");
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string | null) => {
    if (type?.startsWith("image/")) return <Image className="h-4 w-4 text-blue-500" />;
    return <File className="h-4 w-4 text-orange-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/member/crm/contacts")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Client Management
      </Button>

      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 text-2xl">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{fullName}</h1>
                  <Badge variant="outline" className="text-xs">
                    #{contact.id.slice(0, 8).toUpperCase()}
                  </Badge>
                </div>
                {contact.source && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Source: {contact.source.replace(/_/g, " ")}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                  {contact.primary_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {contact.primary_phone}
                    </span>
                  )}
                  {contact.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> {contact.email}
                    </span>
                  )}
                  {primaryAddress && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {primaryAddress}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-start gap-2 lg:ml-auto">
              <Select value={contact.status || "new"} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => handleLogComm("call")}>
                <Phone className="mr-1 h-4 w-4" /> Call
              </Button>
              {contact.email && (
                <Button variant="outline" size="sm" onClick={() => setShowSendEmail(true)}>
                  <Mail className="mr-1 h-4 w-4" /> Email
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowEditContact(true)}>
                <Edit className="mr-1 h-4 w-4" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveTab("measurements");
                  setAutoTriggerMeasurement(true);
                }}
              >
                <Ruler className="mr-1 h-4 w-4" /> Measure Roof
              </Button>
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => navigate(`/member/crm/estimates/new?contact_id=${contact.id}`)}
              >
                <DollarSign className="mr-1 h-4 w-4" /> New Estimate
              </Button>
              <Button
                size="sm"
                className="bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,30%)] text-white"
                onClick={() => setShowCreateLead(true)}
              >
                <Plus className="mr-1 h-4 w-4" /> Create Lead
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Summary */}
      {contact.leads && contact.leads.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-100 text-blue-800">
                  {contact.leads.length} Lead{contact.leads.length > 1 ? "s" : ""}
                </Badge>
                {contact.leads[0].expected_value && (
                  <span className="text-sm font-semibold text-green-600">
                    ${contact.leads[0].expected_value.toLocaleString()}
                  </span>
                )}
                <Badge variant="outline">{contact.leads[0].status || "new"}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(`/member/crm/leads/${contact.leads![0].id}`)}>View Details</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="measurements">Measurements</TabsTrigger>
          <TabsTrigger value="estimates">Estimates</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Homeowner Portal Access</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-md p-3">
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span className="truncate">{window.location.origin}/portal/homeowner/{contact.id}</span>
                <Button variant="ghost" size="sm" className="ml-auto shrink-0" onClick={copyPortalLink}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Lead Score", value: "—", icon: Star },
              { label: "Created", value: contact.created_at ? format(new Date(contact.created_at), "MMM d, yyyy") : "—", icon: Calendar },
              { label: "Source", value: contact.source?.replace(/_/g, " ") || "—", icon: TrendingUp },
              { label: "Status", value: contact.status || "New", icon: User },
              { label: "Total Jobs", value: leadCount.toString(), icon: Briefcase },
            ].map((stat, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <stat.icon className="h-4 w-4" />
                    <span className="text-xs">{stat.label}</span>
                  </div>
                  <p className="text-lg font-semibold capitalize">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Contact Information</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setShowEditContact(true)}>
                  <Edit className="mr-1 h-4 w-4" /> Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Primary Phone</p>
                  <p className="font-medium">{contact.primary_phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Secondary Phone</p>
                  <p className="font-medium">{contact.secondary_phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{contact.email || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Preferred Contact</p>
                  <p className="font-medium capitalize">{contact.preferred_contact_method || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Spouse</p>
                  <p className="font-medium">
                    {contact.spouse_first_name ? `${contact.spouse_first_name} ${contact.spouse_last_name || ""}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Address</p>
                  <p className="font-medium">{primaryAddress || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Properties ({propertyCount})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddressGeocoder
                placeholder="Search to add a property address..."
                onSelect={(address, coords) => {
                  toast({ title: "Address selected", description: `${address} [${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}]` });
                }}
              />
              {contact.properties && contact.properties.length > 0 ? (
                <div className="space-y-3">
                  {contact.properties.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{p.address_line1}</p>
                        <p className="text-xs text-muted-foreground">
                          {[p.city, p.state, p.zip].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>
                  ))}
                  {/* Satellite map for the primary property */}
                  {primaryProperty?.lat && primaryProperty?.lng && (
                    <ContactPropertyMap
                      lat={primaryProperty.lat}
                      lng={primaryProperty.lng}
                      address={primaryAddress || undefined}
                      measurements={measurements
                        .filter((m: any) => m.latitude && m.longitude)
                        .map((m: any): MeasurementPin => ({
                          id: m.id,
                          lat: m.latitude,
                          lng: m.longitude,
                          roof_type: m.roof_type,
                          total_squares: m.total_squares || 0,
                        }))}
                      onPinDragged={async (id, newLat, newLng) => {
                        await supabase.from("roof_measurements").update({
                          latitude: newLat,
                          longitude: newLng,
                        }).eq("id", id);
                        setMeasurements((prev) =>
                          prev.map((m) => m.id === id ? { ...m, latitude: newLat, longitude: newLng } : m)
                        );
                        toast({ title: "Pin moved", description: "Measurement location updated." });
                      }}
                      onPinTypeToggle={async (id, newType) => {
                        await supabase.from("roof_measurements").update({
                          roof_type: newType,
                        }).eq("id", id);
                        setMeasurements((prev) =>
                          prev.map((m) => m.id === id ? { ...m, roof_type: newType } : m)
                        );
                        toast({ title: `Switched to ${newType}` });
                      }}
                      onMeasureAll={async () => {
                        const pins = measurements.filter((m: any) => m.latitude && m.longitude);
                        const results: any[] = [];
                        for (const pin of pins) {
                          const roofTypeOverride = pin.roof_type?.toLowerCase() === "flat" ? "flat"
                            : pin.roof_type?.toLowerCase() === "low slope" ? "low_slope"
                            : undefined;
                          const { data } = await supabase.functions.invoke("solar-roof-measure", {
                            body: {
                              latitude: pin.latitude,
                              longitude: pin.longitude,
                              address: pin.address,
                              roof_type_override: roofTypeOverride,
                            },
                          });
                          if (data?.success) {
                            const d = data.data;
                            await supabase.from("roof_measurements").update({
                              total_area_sqft: d.total_with_waste_sqft,
                              total_squares: d.total_squares,
                              pitch_degrees: d.average_pitch_degrees,
                              pitch_multiplier: d.pitch_multiplier,
                              waste_percent: d.waste_percent,
                              complexity: d.complexity,
                              segments_count: d.roof_segments_count,
                              quality: d.quality,
                              solar_api_response: d,
                            }).eq("id", pin.id);
                            results.push({ ...pin, total_squares: d.total_squares, total_area_sqft: d.total_with_waste_sqft });
                          } else {
                            results.push(pin);
                          }
                        }
                        // Refresh measurements
                        const { data: refreshed } = await supabase
                          .from("roof_measurements")
                          .select("*")
                          .eq("contact_id", contactId!)
                          .order("created_at", { ascending: false });
                        setMeasurements(refreshed || []);
                        toast({ title: "Measurement complete", description: `${pins.length} pin${pins.length > 1 ? "s" : ""} measured.` });
                      }}
                    />
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No properties added yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Leads", value: leadCount, color: "text-blue-600" },
              { label: "Active Jobs", value: 0, color: "text-green-600" },
              { label: "Closed", value: contact.leads?.filter(l => l.status === "closed_won" || l.status === "closed_lost").length || 0, color: "text-muted-foreground" },
            ].map((s, i) => (
              <Card key={i}>
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {contact.leads && contact.leads.length > 0 ? (
            <div className="space-y-3">
              {contact.leads.map((lead) => (
                <Card key={lead.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">Lead #{lead.id.slice(0, 8).toUpperCase()}</p>
                        <Badge variant="outline" className="text-xs capitalize">{lead.status || "new"}</Badge>
                        <Badge variant="outline" className="text-xs capitalize">{lead.lead_type}</Badge>
                      </div>
                      {lead.expected_value && (
                        <p className="text-sm text-green-600 mt-1">${lead.expected_value.toLocaleString()}</p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/member/crm/leads/${lead.id}`)}>View</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No leads yet. Click "+ Create Lead" to get started.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Measurements Tab */}
        <TabsContent value="measurements" className="space-y-6">
          {/* Inline AI Measurement Runner */}
          <InlineRoofMeasurement
            contactId={contact.id}
            contactAddress={primaryAddress}
            companyId={contact.company_id}
            leadId={contact.leads?.[0]?.id}
            autoTrigger={autoTriggerMeasurement}
            onMeasurementSaved={() => {
              // Refresh measurements list
              supabase
                .from("roof_measurements")
                .select("*")
                .eq("contact_id", contact.id)
                .order("created_at", { ascending: false })
                .then(({ data }) => setMeasurements(data || []));
            }}
          />

          {/* Saved Measurements List */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Saved Measurements</h3>
            {measurementsLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : measurements.length > 0 ? (
              <div className="space-y-3">
                {measurements.map((m) => (
                  <Card key={m.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{m.address}</p>
                            <Badge variant="outline" className="text-xs capitalize">{m.source === "ai_solar" ? "AI" : m.source}</Badge>
                            {m.quality && (
                              <Badge variant="outline" className={`text-xs ${
                                m.quality === "HIGH" || m.quality === "high" ? "border-green-500/50 text-green-700" :
                                m.quality === "MEDIUM" || m.quality === "medium" ? "border-yellow-500/50 text-yellow-700" :
                                "border-red-500/50 text-red-700"
                              }`}>{m.quality}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span><strong>{m.total_squares?.toFixed(2)}</strong> squares</span>
                            <span><strong>{m.total_area_sqft?.toLocaleString()}</strong> sq ft</span>
                            {m.pitch && <span>Pitch: {m.pitch}</span>}
                            {m.pitch_degrees && <span>Pitch: {Number(m.pitch_degrees).toFixed(1)}°</span>}
                            {m.complexity && <span>{m.complexity}</span>}
                            {m.waste_percent && <span>{m.waste_percent}% waste</span>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {m.created_at ? format(new Date(m.created_at), "MMM d, yyyy h:mm a") : "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {m.lead_id && (
                            <Button variant="outline" size="sm" onClick={() => navigate(`/member/crm/leads/${m.lead_id}`)}>
                              View Lead
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => navigate(`/member/crm/estimates/new?contact_id=${contact.id}&measurement_id=${m.id}`)}>
                            Use for Estimate
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Ruler className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No saved measurements yet. Run an AI measurement above to get started.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Estimates Tab */}
        <TabsContent value="estimates" className="space-y-4">
          {/* Active Measurement Summary */}
          {measurements.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Ruler className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Active Measurement</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-sm font-bold">{measurements[0].total_squares?.toFixed(2)} squares</span>
                        <span className="text-sm text-muted-foreground">{measurements[0].total_area_sqft?.toLocaleString()} sq ft</span>
                        {(measurements[0].pitch || measurements[0].pitch_degrees) && (
                          <span className="text-sm text-muted-foreground">
                            Pitch: {measurements[0].pitch || `${Number(measurements[0].pitch_degrees).toFixed(1)}°`}
                          </span>
                        )}
                        <Badge variant="outline" className="text-xs capitalize">
                          {measurements[0].source === "ai_solar" ? "AI" : measurements[0].source || "—"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("measurements")}>
                    View All
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <ContactEstimatesCard
            estimates={estimates}
            isLoading={estimatesLoading}
            onCreateNew={() => navigate(`/member/crm/estimates/new?contact_id=${contact.id}`)}
          />
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <NotesList
            notes={notes}
            onAddNote={createNote}
            onDeleteNote={deleteNote}
          />
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication" className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Add a note to the communication log..."
              value={commNote}
              onChange={(e) => setCommNote(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <Button variant="outline" size="sm" onClick={() => handleLogComm("call")}>
              <PhoneCall className="mr-1 h-4 w-4" /> Log Call
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleLogComm("email")}>
              <Mail className="mr-1 h-4 w-4" /> Log Email
            </Button>
            {contact.email && (
              <Button size="sm" onClick={() => setShowSendEmail(true)}>
                <Send className="mr-1 h-4 w-4" /> Send Email
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => handleLogComm("sms")}>
              <MessageSquare className="mr-1 h-4 w-4" /> Log SMS
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total", value: commStats.total },
              { label: "Calls", value: commStats.calls },
              { label: "Emails", value: commStats.emails },
              { label: "SMS", value: commStats.sms },
            ].map((s, i) => (
              <Card key={i}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Communication Timeline</CardTitle></CardHeader>
            <CardContent>
              {communications.length > 0 ? (
                <div className="space-y-3">
                  {communications.map((comm) => (
                    <div key={comm.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="mt-0.5">
                        {comm.comm_type === "call" && <PhoneCall className="h-4 w-4 text-green-600" />}
                        {comm.comm_type === "email" && <Mail className="h-4 w-4 text-blue-600" />}
                        {comm.comm_type === "sms" && <MessageSquare className="h-4 w-4 text-purple-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">{comm.comm_type}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{comm.direction}</Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(new Date(comm.created_at), "MMM d, yyyy h:mm a")}
                          </span>
                        </div>
                        {comm.content && <p className="text-sm mt-1">{comm.content}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No communication history yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Documents & Files</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-1 h-4 w-4" /> {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      {getFileIcon(doc.file_type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.file_size)} · {format(new Date(doc.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteDocument(doc)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No documents uploaded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Lead Dialog */}
      <CreateLeadDialog
        open={showCreateLead}
        onOpenChange={setShowCreateLead}
        contactId={contact.id}
        properties={contact.properties || []}
        companyId={contact.company_id || undefined}
        onLeadCreated={refetch}
      />

      {/* Edit Contact Dialog */}
      <EditContactDialog
        open={showEditContact}
        onOpenChange={setShowEditContact}
        contact={contact}
        properties={contact.properties}
        onContactUpdated={() => {
          refetch();
          setShowEditContact(false);
        }}
      />

      {/* Lead Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLead}
        open={!!selectedLeadId}
        onOpenChange={(open) => { if (!open) setSelectedLeadId(null); }}
        onStatusChange={async (status) => {
          if (selectedLeadId) {
            await updateLeadStatus(selectedLeadId, status as any);
            refetchLead();
            refetch();
          }
        }}
      />

      {/* Send Email Dialog */}
      {contact.email && (
        <SendEmailDialog
          open={showSendEmail}
          onOpenChange={setShowSendEmail}
          contactEmail={contact.email}
          contactName={fullName}
          onEmailSent={() => {
            logCommunication({
              comm_type: "email",
              direction: "outbound",
              content: "Email sent via GCN-CRM",
              company_id: contact.company_id || undefined,
            });
          }}
        />
      )}

      {/* Estimate Builder Dialog */}
      <EstimateBuilderDialog
        open={showEstimateBuilder}
        onOpenChange={setShowEstimateBuilder}
        contactId={contact.id}
        contactName={fullName}
        contactAddress={primaryAddress || undefined}
        customerId={contact.id}
        leadId={contact.leads?.[0]?.id}
        onEstimateCreated={refetchEstimates}
      />
    </div>
  );
}
