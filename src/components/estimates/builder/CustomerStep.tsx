import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Search, ArrowRight } from "lucide-react";
import { useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database["public"]["Tables"]["contacts"]["Row"];

const LEAD_STATUSES = [
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "negotiating", label: "Negotiating" },
  { value: "closed_won", label: "Closed Won" },
  { value: "closed_lost", label: "Closed Lost" },
] as const;

interface CustomerStepProps {
  contacts: Contact[];
  selectedContactId: string;
  onSelect: (id: string) => void;
  onNext: () => void;
}

export function CustomerStep({ contacts, selectedContactId, onSelect, onNext }: CustomerStepProps) {
  const [search, setSearch] = useState("");
  const [leadStatus, setLeadStatus] = useState("contacted");

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    return fullName.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.primary_phone?.toLowerCase().includes(q);
  });

  const selected = contacts.find(c => c.id === selectedContactId);

  const displayName = (c: Contact) => `${c.first_name} ${c.last_name}`;
  const initials = (c: Contact) => `${c.first_name?.[0] || ""}${c.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Select Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts by name, email, or phone..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No contacts found.</p>
          ) : (
            <div className="grid gap-2 max-h-80 overflow-y-auto">
              {filtered.slice(0, 20).map(contact => (
                <button
                  key={contact.id}
                  onClick={() => onSelect(contact.id)}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all duration-200 ${
                    selectedContactId === contact.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {initials(contact)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{displayName(contact)}</p>
                    {contact.email && <p className="text-xs text-muted-foreground truncate">{contact.email}</p>}
                    {contact.primary_phone && <p className="text-xs text-muted-foreground truncate">{contact.primary_phone}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <p className="font-semibold">{displayName(selected)}</p>
                <p className="text-sm text-muted-foreground">{selected.email || selected.primary_phone || "No contact info"}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-44">
                  <Label className="text-xs text-muted-foreground mb-1 block">Lead Status</Label>
                  <Select value={leadStatus} onValueChange={setLeadStatus}>
                    <SelectTrigger className="h-9 text-sm bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={onNext} className="self-end">
                  Next: Measurement <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
