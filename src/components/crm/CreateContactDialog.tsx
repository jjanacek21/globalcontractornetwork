import { useState } from "react";
import { useContacts } from "@/hooks/useContacts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type ContactSource = Database["public"]["Enums"]["contact_source"];
type ContactMethod = Database["public"]["Enums"]["contact_method"];

const LEAD_SOURCES: { value: ContactSource; label: string }[] = [
  { value: "canvass", label: "Canvass / Door Knock" },
  { value: "referral", label: "Referral" },
  { value: "web_form", label: "Website Form" },
  { value: "inbound_call", label: "Inbound Call" },
  { value: "social_media", label: "Social Media" },
  { value: "advertisement", label: "Advertisement" },
  { value: "door_hanger", label: "Door Hanger" },
  { value: "other", label: "Other" },
];

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactCreated?: () => void;
}

export function CreateContactDialog({ open, onOpenChange, onContactCreated }: CreateContactDialogProps) {
  const { createContact } = useContacts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalPhones, setAdditionalPhones] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    primary_phone: "",
    secondary_phone: "",
    source: "" as ContactSource | "",
    source_details: "",
    status: "new",
    preferred_contact_method: "" as ContactMethod | "",
    spouse_first_name: "",
    spouse_last_name: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) return;
    if (!form.email.trim() && !form.primary_phone.trim()) return;

    setIsSubmitting(true);

    // Get current user for created_by
    const { data: { user } } = await supabase.auth.getUser();

    const result = await createContact({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim() || null,
      primary_phone: form.primary_phone.trim() || null,
      secondary_phone: form.secondary_phone.trim() || null,
      source: (form.source as ContactSource) || null,
      source_details: form.source_details.trim() || null,
      status: form.status || "new",
      preferred_contact_method: (form.preferred_contact_method as ContactMethod) || null,
      spouse_first_name: form.spouse_first_name.trim() || null,
      spouse_last_name: form.spouse_last_name.trim() || null,
      created_by_user_id: user?.id || null,
    });

    setIsSubmitting(false);

    if (result) {
      onContactCreated?.();
      onOpenChange(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setForm({
      first_name: "", last_name: "", email: "", primary_phone: "",
      secondary_phone: "", source: "", source_details: "", status: "new",
      preferred_contact_method: "", spouse_first_name: "", spouse_last_name: "", notes: "",
    });
    setAdditionalPhones([]);
    setTags([]);
    setTagInput("");
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name *</Label>
              <Input value={form.first_name} onChange={(e) => update("first_name", e.target.value)} required />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input value={form.last_name} onChange={(e) => update("last_name", e.target.value)} required />
            </div>
          </div>

          {/* Contact */}
          <div>
            <Label>Email {!form.primary_phone && "*"}</Label>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@example.com" />
          </div>
          <div>
            <Label>Phone {!form.email && "*"}</Label>
            <Input value={form.primary_phone} onChange={(e) => update("primary_phone", e.target.value)} placeholder="(555) 555-5555" />
          </div>
          <div>
            <Label>Secondary Phone</Label>
            <Input value={form.secondary_phone} onChange={(e) => update("secondary_phone", e.target.value)} />
          </div>

          {/* Additional Phones */}
          {additionalPhones.map((phone, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={phone}
                onChange={(e) => {
                  const copy = [...additionalPhones];
                  copy[i] = e.target.value;
                  setAdditionalPhones(copy);
                }}
                placeholder="Additional phone"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => setAdditionalPhones(additionalPhones.filter((_, j) => j !== i))}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={() => setAdditionalPhones([...additionalPhones, ""])}>
            <Plus className="mr-1 h-3 w-3" /> Add Phone
          </Button>

          {/* Spouse */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Spouse First Name</Label>
              <Input value={form.spouse_first_name} onChange={(e) => update("spouse_first_name", e.target.value)} />
            </div>
            <div>
              <Label>Spouse Last Name</Label>
              <Input value={form.spouse_last_name} onChange={(e) => update("spouse_last_name", e.target.value)} />
            </div>
          </div>

          {/* Source & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Lead Source *</Label>
              <Select value={form.source} onValueChange={(v) => update("source", v)}>
                <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="not_home">Not Home</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preferred Contact Method */}
          <div>
            <Label>Preferred Contact Method</Label>
            <Select value={form.preferred_contact_method} onValueChange={(v) => update("preferred_contact_method", v)}>
              <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="text">Text</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    <button type="button" className="ml-1" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Additional notes..." rows={3} />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!form.first_name || !form.last_name || (!form.email && !form.primary_phone))}
              className="bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,30%)] text-white"
            >
              {isSubmitting ? "Creating..." : "Create Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
