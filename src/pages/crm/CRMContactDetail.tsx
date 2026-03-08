import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContact, type ContactWithDetails } from "@/hooks/useContacts";
import { useContacts } from "@/hooks/useContacts";
import { useNotes } from "@/hooks/useNotes";
import { NotesList } from "@/components/crm/NotesList";
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
  FileText, Upload, PhoneCall, Clock, User, TrendingUp
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
  const { notes, isLoading: notesLoading, createNote, deleteNote } = useNotes("contact", contactId || null);

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
            {/* Avatar & Name */}
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

            {/* Actions */}
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
              <Button variant="outline" size="sm">
                <Phone className="mr-1 h-4 w-4" /> Call
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowEditContact(true)}>
                <Edit className="mr-1 h-4 w-4" /> Edit
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
              <Button variant="outline" size="sm">View Details</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          {/* Portal Access */}
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

          {/* Stat Cards */}
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

          {/* Contact Info */}
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

          {/* Properties */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Properties ({propertyCount})</CardTitle>
            </CardHeader>
            <CardContent>
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
                    <Button variant="outline" size="sm">View</Button>
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <PhoneCall className="mr-1 h-4 w-4" /> Call Now
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="mr-1 h-4 w-4" /> Send Email
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-1 h-4 w-4" /> Send SMS
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total", value: 0 },
              { label: "Calls", value: 0 },
              { label: "Emails", value: 0 },
              { label: "SMS", value: 0 },
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
            <CardContent className="text-center text-muted-foreground py-8">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No communication history yet.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Documents & Files</CardTitle>
                <Button variant="outline" size="sm">
                  <Upload className="mr-1 h-4 w-4" /> Upload
                </Button>
              </div>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground py-8">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No documents uploaded yet.</p>
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
    </div>
  );
}
