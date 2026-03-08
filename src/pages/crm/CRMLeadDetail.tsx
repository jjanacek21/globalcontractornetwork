import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLead, useLeads, LEAD_STATUSES } from "@/hooks/useLeads";
import { useNotes } from "@/hooks/useNotes";
import { NotesList } from "@/components/crm/NotesList";
import { useContactDocuments } from "@/hooks/useContactDocuments";
import { useContactCommunications } from "@/hooks/useContactCommunications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Phone, Mail, MapPin, PhoneCall, MessageSquare,
  FileText, Upload, Clock, ExternalLink, Trash2, Image, File, Home, DollarSign
} from "lucide-react";
import { format } from "date-fns";

export default function CRMLeadDetail() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { lead, isLoading, refetch } = useLead(leadId || null);
  const { updateLeadStatus } = useLeads();
  const { notes, createNote, deleteNote } = useNotes("lead", leadId || null);
  const contactId = lead?.contact_id || null;
  const { documents, isUploading, uploadDocument, deleteDocument, getSignedUrl } = useContactDocuments(contactId);
  const { communications, stats: commStats, logCommunication } = useContactCommunications(contactId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commNote, setCommNote] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Lead not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const contact = lead.contact;
  const property = lead.property;
  const fullName = contact ? `${contact.first_name} ${contact.last_name}` : "Unknown";
  const address = property ? [property.address_line1, property.city, property.state, property.zip].filter(Boolean).join(", ") : "—";
  const statusInfo = LEAD_STATUSES.find(s => s.value === lead.status) || LEAD_STATUSES[0];

  const handleStatusChange = async (status: string) => {
    await updateLeadStatus(lead.id, status as any);
    refetch();
  };

  const handleLogComm = async (type: string) => {
    await logCommunication({ comm_type: type, direction: "outbound", content: commNote || `${type} initiated`, lead_id: leadId });
    setCommNote("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      await uploadDocument(file, leadId);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleViewDoc = async (doc: any) => {
    const url = await getSignedUrl(doc.file_path);
    if (url) window.open(url, "_blank");
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      {/* Lead Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{fullName}</h1>
                <Badge variant="outline">#{lead.id.slice(0, 8).toUpperCase()}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {address}
                </div>
                {contact?.primary_phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" /> {contact.primary_phone}
                  </div>
                )}
                {contact?.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" /> {contact.email}
                  </div>
                )}
                {(lead as any).roof_type && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Home className="h-4 w-4" /> Roof: {(lead as any).roof_type}{(lead as any).roof_age ? ` (${(lead as any).roof_age} yrs)` : ""}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-start gap-2">
              <Select value={lead.status || "new"} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {contact && (
                <Button variant="outline" size="sm" onClick={() => navigate(`/member/crm/contacts/${contact.id}`)}>
                  View Contact
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Expected Value</p>
            <p className="text-xl font-bold text-green-600">
              {lead.expected_value ? `$${lead.expected_value.toLocaleString()}` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Lead Type</p>
            <p className="text-xl font-bold capitalize">{lead.lead_type}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Priority</p>
            <p className="text-xl font-bold capitalize">{(lead as any).priority || "Medium"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Created</p>
            <p className="text-xl font-bold">
              {lead.created_at ? format(new Date(lead.created_at), "MMM d") : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notes">
        <TabsList>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="space-y-4">
          <NotesList notes={notes} onAddNote={createNote} onDeleteNote={deleteNote} />
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Add note..."
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
            <Button variant="outline" size="sm" onClick={() => handleLogComm("sms")}>
              <MessageSquare className="mr-1 h-4 w-4" /> Log SMS
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-4">
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
            <CardContent className="p-4">
              {communications.length > 0 ? (
                <div className="space-y-3">
                  {communications.map((comm) => (
                    <div key={comm.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      {comm.comm_type === "call" && <PhoneCall className="h-4 w-4 text-green-600 mt-0.5" />}
                      {comm.comm_type === "email" && <Mail className="h-4 w-4 text-blue-600 mt-0.5" />}
                      {comm.comm_type === "sms" && <MessageSquare className="h-4 w-4 text-purple-600 mt-0.5" />}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">{comm.comm_type}</Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(new Date(comm.created_at), "MMM d, h:mm a")}
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

        <TabsContent value="documents" className="space-y-4">
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" multiple className="hidden" onChange={handleFileUpload} />
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Documents</CardTitle>
                <Button variant="outline" size="sm" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-1 h-4 w-4" /> {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      {doc.file_type?.startsWith("image/") ? <Image className="h-4 w-4 text-blue-500" /> : <File className="h-4 w-4 text-orange-500" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.file_size)} · {format(new Date(doc.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleViewDoc(doc)}>
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
    </div>
  );
}
