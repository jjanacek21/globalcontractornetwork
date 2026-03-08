import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useContacts } from "@/hooks/useContacts";
import { UserPlus, Search, Phone, Mail, User } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function CRMContacts() {
  const { contacts, isLoading, createContact, deleteContact } = useContacts();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", primary_phone: "" });

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    return `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.primary_phone?.includes(q);
  });

  const handleCreate = async () => {
    if (!form.first_name || !form.last_name) return;
    await createContact(form as any);
    setForm({ first_name: "", last_name: "", email: "", primary_phone: "" });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground">{contacts.length} total contacts</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button><UserPlus className="mr-2 h-4 w-4" />Add Contact</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Contact</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>First Name</Label><Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></div>
                <div><Label>Last Name</Label><Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></div>
              </div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={form.primary_phone} onChange={e => setForm(f => ({ ...f, primary_phone: e.target.value }))} /></div>
              <Button onClick={handleCreate} className="w-full">Create Contact</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(contact => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{contact.first_name} {contact.last_name}</h3>
                    {contact.status && <Badge variant="outline" className="text-xs">{contact.status}</Badge>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {contact.primary_phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" /><span>{contact.primary_phone}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" /><span className="truncate">{contact.email}</span>
                    </div>
                  )}
                </div>
                {contact.source && (
                  <Badge variant="secondary" className="text-xs mt-3">{contact.source.replace(/_/g, ' ')}</Badge>
                )}
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No contacts found. Add your first contact to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
