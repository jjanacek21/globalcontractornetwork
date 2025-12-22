import { useState, useEffect } from "react";
import { useContacts } from "@/hooks/useContacts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database["public"]["Tables"]["contacts"]["Row"];
type ContactSource = Database["public"]["Enums"]["contact_source"];
type ContactMethod = Database["public"]["Enums"]["contact_method"];

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
  onContactUpdated: () => void;
}

const CONTACT_SOURCES: { value: ContactSource; label: string }[] = [
  { value: "canvass", label: "Canvass / Door Knock" },
  { value: "referral", label: "Referral" },
  { value: "web_form", label: "Website Form" },
  { value: "inbound_call", label: "Inbound Call" },
  { value: "social_media", label: "Social Media" },
  { value: "advertisement", label: "Advertisement" },
  { value: "door_hanger", label: "Door Hanger" },
  { value: "other", label: "Other" },
];

const CONTACT_METHODS: { value: ContactMethod; label: string }[] = [
  { value: "call", label: "Phone Call" },
  { value: "text", label: "Text Message" },
  { value: "email", label: "Email" },
];

export function EditContactDialog({
  open,
  onOpenChange,
  contact,
  onContactUpdated,
}: EditContactDialogProps) {
  const { updateContact } = useContacts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    spouse_first_name: "",
    spouse_last_name: "",
    primary_phone: "",
    secondary_phone: "",
    email: "",
    source: "" as ContactSource | "",
    source_details: "",
    preferred_contact_method: "call" as ContactMethod,
    status: "",
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        first_name: contact.first_name || "",
        last_name: contact.last_name || "",
        spouse_first_name: contact.spouse_first_name || "",
        spouse_last_name: contact.spouse_last_name || "",
        primary_phone: contact.primary_phone || "",
        secondary_phone: contact.secondary_phone || "",
        email: contact.email || "",
        source: contact.source || "",
        source_details: contact.source_details || "",
        preferred_contact_method: contact.preferred_contact_method || "call",
        status: contact.status || "",
      });
    }
  }, [contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updated = await updateContact(contact.id, {
      first_name: formData.first_name,
      last_name: formData.last_name,
      spouse_first_name: formData.spouse_first_name || null,
      spouse_last_name: formData.spouse_last_name || null,
      primary_phone: formData.primary_phone || null,
      secondary_phone: formData.secondary_phone || null,
      email: formData.email || null,
      source: formData.source || null,
      source_details: formData.source_details || null,
      preferred_contact_method: formData.preferred_contact_method,
      status: formData.status || null,
    });

    setIsSubmitting(false);

    if (updated) {
      onContactUpdated();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spouse_first_name">Spouse First Name</Label>
              <Input
                id="spouse_first_name"
                value={formData.spouse_first_name}
                onChange={(e) => setFormData({ ...formData, spouse_first_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spouse_last_name">Spouse Last Name</Label>
              <Input
                id="spouse_last_name"
                value={formData.spouse_last_name}
                onChange={(e) => setFormData({ ...formData, spouse_last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_phone">Primary Phone</Label>
              <Input
                id="primary_phone"
                value={formData.primary_phone}
                onChange={(e) => setFormData({ ...formData, primary_phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary_phone">Secondary Phone</Label>
              <Input
                id="secondary_phone"
                value={formData.secondary_phone}
                onChange={(e) => setFormData({ ...formData, secondary_phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_contact_method">Preferred Contact Method</Label>
            <Select
              value={formData.preferred_contact_method}
              onValueChange={(value: ContactMethod) =>
                setFormData({ ...formData, preferred_contact_method: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select
              value={formData.source}
              onValueChange={(value: ContactSource) =>
                setFormData({ ...formData, source: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_SOURCES.map((source) => (
                  <SelectItem key={source.value} value={source.value}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_details">Source Details</Label>
            <Input
              id="source_details"
              value={formData.source_details}
              onChange={(e) => setFormData({ ...formData, source_details: e.target.value })}
              placeholder="e.g., Referred by John Smith"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contact">Contact</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
