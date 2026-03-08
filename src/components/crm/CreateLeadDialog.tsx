import { useState } from "react";
import { useLeads } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  { value: "canvass", label: "Canvass / Door Knock" },
  { value: "referral", label: "Referral" },
  { value: "web_form", label: "Website Form" },
  { value: "inbound_call", label: "Inbound Call" },
  { value: "social_media", label: "Social Media" },
  { value: "advertisement", label: "Advertisement" },
  { value: "door_hanger", label: "Door Hanger" },
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
  const [useExistingProperty, setUseExistingProperty] = useState(properties.length > 0);
  const [formData, setFormData] = useState({
    property_id: properties.length > 0 ? properties[0].id : "",
    lead_type: "retail" as LeadType,
    source: "" as ContactSource | "",
    expected_value: "",
    qualification_notes: "",
    // Inline address fields
    address_line1: "",
    city: "",
    state: "",
    zip: "",
  });

  const handleUseSameAddress = (checked: boolean) => {
    if (checked && properties.length > 0) {
      setUseExistingProperty(true);
      setFormData(prev => ({
        ...prev,
        property_id: properties[0].id,
        address_line1: properties[0].address_line1 || "",
        city: properties[0].city || "",
        state: properties[0].state || "",
        zip: properties[0].zip || "",
      }));
    } else {
      setUseExistingProperty(false);
      setFormData(prev => ({
        ...prev,
        property_id: "",
        address_line1: "",
        city: "",
        state: "",
        zip: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let propertyId = formData.property_id;

    // If no existing property selected, create one from inline address
    if (!propertyId && formData.address_line1.trim()) {
      const { data: newProperty, error } = await supabase
        .from("properties")
        .insert({
          contact_id: contactId,
          company_id: companyId || null,
          address_line1: formData.address_line1,
          city: formData.city || null,
          state: formData.state || null,
          zip: formData.zip || null,
        })
        .select()
        .single();

      if (error || !newProperty) {
        setIsSubmitting(false);
        return;
      }
      propertyId = newProperty.id;
    }

    if (!propertyId) {
      setIsSubmitting(false);
      return;
    }

    const lead = await createLead({
      contact_id: contactId,
      property_id: propertyId,
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
      onOpenChange(false);
      setFormData({
        property_id: "",
        lead_type: "retail",
        source: "",
        expected_value: "",
        qualification_notes: "",
        address_line1: "",
        city: "",
        state: "",
        zip: "",
      });
    }
  };

  const hasAddress = useExistingProperty ? !!formData.property_id : !!formData.address_line1.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Property Selection / Address Entry */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Property Address *</Label>

            {properties.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="use_same"
                  checked={useExistingProperty}
                  onCheckedChange={(checked) => handleUseSameAddress(!!checked)}
                />
                <Label htmlFor="use_same" className="text-sm font-normal cursor-pointer">
                  Use existing property address
                </Label>
              </div>
            )}

            {useExistingProperty && properties.length > 0 ? (
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
                      {property.address_line1}{property.city ? `, ${property.city}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder="Street Address"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                  <Input
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                  <Input
                    placeholder="ZIP"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  />
                </div>
              </div>
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
            <Label htmlFor="qualification_notes">Notes</Label>
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
            <Button type="submit" disabled={isSubmitting || !hasAddress}>
              {isSubmitting ? "Creating..." : "Create Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
