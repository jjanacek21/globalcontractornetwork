import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useContacts } from "@/hooks/useContacts";
import { CreateContactDialog } from "@/components/crm/CreateContactDialog";
import { UserPlus, Search, Plus, ArrowDownRight, ArrowUpRight, Users, LayoutGrid, List, Eye, Upload, Settings2, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

const BOARD_COLUMNS = [
  { value: "new", label: "New/Unqualified" },
  { value: "not_home", label: "Not Home" },
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
];

export default function CRMContacts() {
  const navigate = useNavigate();
  const { contacts, isLoading, fetchContacts } = useContacts();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [viewMode, setViewMode] = useState<"board" | "table">("board");

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    return `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.primary_phone?.includes(q);
  });

  const stats = [
    { label: "Leads Converted to...", value: contacts.filter(c => c.status === "converted").length, icon: ArrowUpRight, iconColor: "text-green-500" },
    { label: "New (2 Weeks)", value: contacts.filter(c => { const d = new Date(c.created_at || ""); return d > new Date(Date.now() - 14 * 86400000); }).length, icon: ArrowUpRight, iconColor: "text-green-500" },
    { label: "Leads", value: contacts.length, icon: ArrowDownRight, iconColor: "text-orange-500" },
    { label: "Avg Score", value: "0%", icon: User, iconColor: "text-blue-500" },
  ];

  const goToContact = (id: string) => navigate(`/member/crm/contacts/${id}`);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Client Management</h1>
          <p className="text-muted-foreground">Manage your contacts and jobs with professional CRM tools</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4" />Import CSV</Button>
          <Button variant="outline" size="sm"><Settings2 className="mr-2 h-4 w-4" />Set as Default</Button>
          <Button size="sm" className="bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,30%)] text-white">
            <Plus className="mr-2 h-4 w-4" />Add Lead
          </Button>
          <Button size="sm" className="bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,30%)] text-white" onClick={() => setShowAdd(true)}>
            <UserPlus className="mr-2 h-4 w-4" />New Contact
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${s.iconColor}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Toggle Bar */}
      <div className="flex flex-wrap items-center gap-3 border-b pb-3">
        <Select defaultValue="contacts">
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="contacts">Contacts</SelectItem>
            <SelectItem value="leads">Leads</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}>
          <List className="mr-1 h-4 w-4" />Table
        </Button>
        <Button variant={viewMode === "board" ? "default" : "outline"} size="sm" onClick={() => setViewMode("board")}>
          <LayoutGrid className="mr-1 h-4 w-4" />Board
        </Button>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Statuses</SelectItem></SelectContent>
        </Select>
        <Select defaultValue="25">
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="25">25 per page</SelectItem><SelectItem value="50">50 per page</SelectItem></SelectContent>
        </Select>
        <Button variant="outline" size="sm"><Users className="mr-1 h-4 w-4" />All Reps</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : viewMode === "board" ? (
        <div>
          <h2 className="text-lg font-semibold mb-3">Contacts by Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {BOARD_COLUMNS.map(col => {
              const colContacts = filtered.filter(c => (c.status || "new") === col.value);
              return (
                <div key={col.value}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-sm">{col.label}</h3>
                    <Badge variant="outline" className="text-xs">{colContacts.length}</Badge>
                  </div>
                  <div className="space-y-2 min-h-[120px] bg-muted/30 rounded-lg p-2">
                    {colContacts.map(contact => (
                      <Card key={contact.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => goToContact(contact.id)}>
                        <CardContent className="p-3">
                          <p className="font-medium text-sm">{contact.first_name} {contact.last_name}</p>
                          <p className="text-xs text-muted-foreground mt-1">Primary Owner</p>
                          <p className="text-xs text-muted-foreground">—</p>
                          <Button variant="link" size="sm" className="p-0 h-auto text-xs text-primary mt-1" onClick={(e) => { e.stopPropagation(); goToContact(contact.id); }}>
                            <Eye className="mr-1 h-3 w-3" />View
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Rep</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => goToContact(c.id)}>
                  <TableCell className="font-medium">{c.first_name} {c.last_name}</TableCell>
                  <TableCell>{c.email || "—"}</TableCell>
                  <TableCell>{c.primary_phone || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{c.status || "New"}</Badge></TableCell>
                  <TableCell>{c.source?.replace(/_/g, " ") || "—"}</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.created_at ? format(new Date(c.created_at), "MMM d, yyyy") : "—"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No contacts found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <CreateContactDialog open={showAdd} onOpenChange={setShowAdd} onContactCreated={fetchContacts} />
    </div>
  );
}
