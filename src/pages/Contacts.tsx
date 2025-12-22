import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContacts } from "@/hooks/useContacts";
import { ContactCard } from "@/components/crm/ContactCard";
import { QuickAddContact } from "@/components/crm/QuickAddContact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search } from "lucide-react";

export default function Contacts() {
  const { contacts, isLoading } = useContacts();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const navigate = useNavigate();

  const filteredContacts = contacts.filter((contact) => {
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
    const email = contact.email?.toLowerCase() || "";
    const phone = contact.primary_phone || "";
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query) || phone.includes(query);
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground">Manage your customer contacts</p>
        </div>
        <Button onClick={() => setShowAddContact(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No contacts found</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowAddContact(true)}>
            Add your first contact
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onClick={() => navigate(`/crm/contacts/${contact.id}`)}
            />
          ))}
        </div>
      )}

      <QuickAddContact
        open={showAddContact}
        onOpenChange={setShowAddContact}
        onSuccess={(id) => navigate(`/crm/contacts/${id}`)}
      />
    </div>
  );
}
