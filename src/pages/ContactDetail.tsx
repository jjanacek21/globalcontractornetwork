import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContact, useContacts } from "@/hooks/useContacts";
import { useProperties } from "@/hooks/useProperties";
import { useLeads } from "@/hooks/useLeads";
import { useNotes } from "@/hooks/useNotes";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Phone, Mail, MapPin, Plus, Edit, Trash2, User, Home, FileText, Clock } from "lucide-react";
import { PropertyCard } from "@/components/crm/PropertyCard";
import { LeadCard } from "@/components/crm/LeadCard";
import { ActivityTimeline } from "@/components/crm/ActivityTimeline";
import { AddPropertyDialog } from "@/components/crm/AddPropertyDialog";
import { CreateLeadDialog } from "@/components/crm/CreateLeadDialog";
import { EditContactDialog } from "@/components/crm/EditContactDialog";
import { NotesList } from "@/components/crm/NotesList";
import { ApprovalCards } from "@/components/crm/ApprovalCards";
import { FinancialSummaryBar } from "@/components/crm/FinancialSummaryBar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type LeadStatus = Database["public"]["Enums"]["lead_status"];

const ContactDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { contact, isLoading, refetch } = useContact(id || null);
  const { deleteContact } = useContacts();
  const { properties, createProperty } = useProperties(id || undefined);
  const { leads, createLead, updateLeadStatus, deleteLead } = useLeads();
  const { notes, createNote, deleteNote } = useNotes("contact", id || "");
  
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [showEditContact, setShowEditContact] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const contactLeads = leads.filter(l => l.contact_id === id);

  const handleDeleteContact = async () => {
    if (id) {
      const success = await deleteContact(id);
      if (success) {
        navigate("/crm/contacts");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Contact not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/crm/contacts")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contacts
        </Button>
      </div>
    );
  }

  const fullName = `${contact.first_name} ${contact.last_name}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/crm/contacts")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{fullName}</h1>
            <div className="flex items-center gap-4 mt-1 text-muted-foreground">
              {contact.primary_phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {contact.primary_phone}
                </span>
              )}
              {contact.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {contact.email}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEditContact(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status & Source */}
      <div className="flex gap-2">
        {contact.status && <Badge variant="secondary">{contact.status}</Badge>}
        {contact.source && <Badge variant="outline">{contact.source}</Badge>}
        {contact.preferred_contact_method && (
          <Badge variant="outline">Prefers: {contact.preferred_contact_method}</Badge>
        )}
      </div>

      {/* Financial Summary */}
      <FinancialSummaryBar
        totalEstimate={0}
        approvedAmount={0}
        outstandingBalance={0}
        paymentStatus="unpaid"
      />

      {/* Approval Requirements */}
      <ApprovalCards />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Properties ({properties.length})
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Leads ({contactLeads.length})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Full Name</label>
                  <p className="font-medium">{fullName}</p>
                </div>
                {contact.spouse_first_name && (
                  <div>
                    <label className="text-sm text-muted-foreground">Spouse</label>
                    <p className="font-medium">
                      {contact.spouse_first_name} {contact.spouse_last_name}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-muted-foreground">Primary Phone</label>
                  <p className="font-medium">{contact.primary_phone || "N/A"}</p>
                </div>
                {contact.secondary_phone && (
                  <div>
                    <label className="text-sm text-muted-foreground">Secondary Phone</label>
                    <p className="font-medium">{contact.secondary_phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="font-medium">{contact.email || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Source</label>
                  <p className="font-medium">{contact.source || "N/A"}</p>
                </div>
                {contact.source_details && (
                  <div>
                    <label className="text-sm text-muted-foreground">Source Details</label>
                    <p className="font-medium">{contact.source_details}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <NotesList
                  notes={notes}
                  onAddNote={(content) => createNote(content)}
                  onDeleteNote={(noteId) => deleteNote(noteId)}
                />
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityTimeline entityType="contact" entityId={id || ""} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Properties</h3>
            <Button onClick={() => setShowAddProperty(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </div>
          {properties.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No properties linked to this contact yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leads" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Leads</h3>
            <Button onClick={() => setShowCreateLead(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Lead
            </Button>
          </div>
          {contactLeads.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No leads for this contact yet. Add a property first, then create a lead.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contactLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onStatusChange={(status: LeadStatus) => updateLeadStatus(lead.id, status)}
                  onDelete={() => deleteLead(lead.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline entityType="contact" entityId={id || ""} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddPropertyDialog
        open={showAddProperty}
        onOpenChange={setShowAddProperty}
        contactId={id || ""}
        onPropertyCreated={(property) => {
          refetch();
          setShowAddProperty(false);
        }}
      />

      <CreateLeadDialog
        open={showCreateLead}
        onOpenChange={setShowCreateLead}
        contactId={id || ""}
        properties={properties}
        onLeadCreated={() => {
          refetch();
          setShowCreateLead(false);
        }}
      />

      <EditContactDialog
        open={showEditContact}
        onOpenChange={setShowEditContact}
        contact={contact}
        onContactUpdated={refetch}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {fullName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContact}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContactDetail;
