import { useState } from "react";
import { useLeads } from "@/hooks/useLeads";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];
type LeadType = Database["public"]["Enums"]["lead_type"];
type ContactSource = Database["public"]["Enums"]["contact_source"];

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  properties: Property[];
  companyId?: string;
  onLeadCreated: () => void;
}

const LEAD_SOURCES: { value: ContactSource; label: string }[] = [
  { value: "door_knock", label: "Door Knock" },
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website" },
  { value: "phone", label: "Phone" },
  { value: "social_media", label: "Social Media" },
  { value: "advertisement", label: "Advertisement" },
  { value: "storm_chaser", label: "Storm Chaser" },
  { value: "home_show", label: "Home Show" },
  { value: "other", label: "Other" },
];

export function CreateLeadDialog({
  open,
  onOpenChange,
  contactId,
  properties,
  companyId,
  onLeadCreated,
}: CreateLeadDialogProps) {
  const { createLead } = useLeads();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    property_id: "",
    lead_type: "retail" as LeadType,
    source: "" as ContactSource | "",
    expected_value: "",
    qualification_notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.property_id) {
      return;
    }

    setIsSubmitting(true);

    const lead = await createLead({
      contact_id: contactId,
      property_id: formData.property_id,
      company_id: companyId,
      lead_type: formData.lead_type,
      source: formData.source || null,
      expected_value: formData.expected_value ? parseFloat(formData.expected_value) : null,
      qualification_notes: formData.qualification_notes || null,
      status: "new",
    });

    setIsSubmitting(false);

    if (lead) {
      onLeadCreated();
      setFormData({
        property_id: "",
        lead_type: "retail",
        source: "",
        expected_value: "",
        qualification_notes: "",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="property_id">Property *</Label>
            {properties.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No properties available. Add a property first.
              </p>
            ) : (
              <Select
                value={formData.property_id}
                onValueChange={(value) => setFormData({ ...formData, property_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.address_line1}, {property.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead_type">Lead Type</Label>
            <Select
              value={formData.lead_type}
              onValueChange={(value: LeadType) => setFormData({ ...formData, lead_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Lead Source</Label>
            <Select
              value={formData.source}
              onValueChange={(value: ContactSource) => setFormData({ ...formData, source: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((source) => (
                  <SelectItem key={source.value} value={source.value}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_value">Expected Value ($)</Label>
            <Input
              id="expected_value"
              type="number"
              value={formData.expected_value}
              onChange={(e) => setFormData({ ...formData, expected_value: e.target.value })}
              placeholder="15000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qualification_notes">Qualification Notes</Label>
            <Textarea
              id="qualification_notes"
              value={formData.qualification_notes}
              onChange={(e) => setFormData({ ...formData, qualification_notes: e.target.value })}
              placeholder="Notes about this lead..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || properties.length === 0}>
              {isSubmitting ? "Creating..." : "Create Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
