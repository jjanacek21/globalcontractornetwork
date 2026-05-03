import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, ThumbsDown, ThumbsUp, AlertCircle, Clock, Home, Pencil, Save, UserPlus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PropertyBottomSheetProps {
  property: any;
  onClose: () => void;
  onUpdate: () => void;
  onAddMeasurement?: () => void;
}

interface DispositionButton {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const dispositions: DispositionButton[] = [
  { value: "not_home", label: "Not Home", icon: <Home className="h-5 w-5" />, color: "bg-orange-500" },
  { value: "not_interested", label: "Not Interested", icon: <X className="h-5 w-5" />, color: "bg-red-600" },
  { value: "interested", label: "Interested", icon: <ThumbsUp className="h-5 w-5" />, color: "bg-green-600" },
  { value: "follow_up", label: "Follow Up", icon: <Clock className="h-5 w-5" />, color: "bg-yellow-500" },
  { value: "new_roof", label: "New Roof", icon: <ThumbsDown className="h-5 w-5" />, color: "bg-gray-600" },
  { value: "old_roof", label: "Old Roof", icon: <AlertCircle className="h-5 w-5" />, color: "bg-red-700" },
  { value: "storm_damage", label: "Storm Damage", icon: <AlertCircle className="h-5 w-5" />, color: "bg-yellow-600" },
  { value: "inspection_scheduled", label: "Inspection Scheduled", icon: <Clock className="h-5 w-5" />, color: "bg-blue-600" },
  { value: "contracted", label: "Contracted", icon: <ThumbsUp className="h-5 w-5" />, color: "bg-green-700" },
];

export function PropertyBottomSheet({ property, onClose, onUpdate, onAddMeasurement }: PropertyBottomSheetProps) {
  const [address, setAddress] = useState(property.address || "");
  const [notes, setNotes] = useState(property.notes || "");
  const [selectedDisposition, setSelectedDisposition] = useState(property.disposition || "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [insuranceCompany, setInsuranceCompany] = useState("");
  const [leadSource, setLeadSource] = useState("FieldMap");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleDispositionClick = (disposition: string) => {
    setSelectedDisposition(disposition);
  };

  const saveProperty = async (disposition?: string) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const propertyData = {
        address: address || "Unknown Address",
        latitude: property.latitude,
        longitude: property.longitude,
        disposition: disposition || selectedDisposition || null,
        notes,
        last_contacted_at: new Date().toISOString(),
        last_contacted_by: user.id,
        created_by: user.id,
      };

      if (property.id && property.id !== "new") {
        const { error } = await supabase
          .from("field_properties")
          .update({
            ...propertyData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", property.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("field_properties")
          .insert([propertyData]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Property updated successfully",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error saving property",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsCustomer = async () => {
    if (!phone) {
      toast({
        title: "Phone required",
        description: "Please enter a phone number to save as customer",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // First save/update property
      const propertyData = {
        address: address || "Unknown Address",
        latitude: property.latitude,
        longitude: property.longitude,
        disposition: selectedDisposition || null,
        notes,
        last_contacted_at: new Date().toISOString(),
        last_contacted_by: user.id,
        created_by: user.id,
      };

      let propertyId = property.id;

      if (property.id && property.id !== "new" && property.id !== "temp") {
        const { error } = await supabase
          .from("field_properties")
          .update({
            ...propertyData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", property.id);

        if (error) throw error;
      } else {
        const { data: newProperty, error } = await supabase
          .from("field_properties")
          .insert([propertyData])
          .select()
          .single();

        if (error) throw error;
        propertyId = newProperty.id;
      }

      // Create customer
      const { error: customerError } = await supabase
        .from("permit_customers")
        .insert({
          name: address || "Unknown Customer",
          address: address,
          phone,
          email: email || null,
          insurance_company: insuranceCompany || null,
          lead_source: leadSource,
          notes,
          assigned_rep_id: user.id,
        });

      if (customerError) throw customerError;

      toast({
        title: "Success",
        description: "Property saved and customer created",
      });

      onUpdate();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error saving customer",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex-1">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter address..."
                className="text-lg font-semibold mb-1"
              />
              <p className="text-sm text-muted-foreground">
                Lat: {property.latitude.toFixed(6)}, Lng: {property.longitude.toFixed(6)}
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">CONTACT INFORMATION</h3>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(123) 456-7890"
                type="tel"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label>Insurance Company</Label>
              <Input
                value={insuranceCompany}
                onChange={(e) => setInsuranceCompany(e.target.value)}
                placeholder="Insurance company name"
              />
            </div>
            <div className="space-y-2">
              <Label>Lead Source</Label>
              <Select value={leadSource} onValueChange={setLeadSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FieldMap">Field Map</SelectItem>
                  <SelectItem value="DoorKnock">Door Knock</SelectItem>
                  <SelectItem value="InboundCall">Inbound Call</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Disposition Buttons */}
          <div>
            <h3 className="text-sm font-semibold mb-3">DISPOSITION</h3>
            <div className="grid grid-cols-3 gap-3">
              {dispositions.map((disp) => (
                <Button
                  key={disp.value}
                  variant={selectedDisposition === disp.value ? "default" : "outline"}
                  onClick={() => handleDispositionClick(disp.value)}
                  disabled={saving}
                  className={`flex flex-col items-center justify-center h-24 ${
                    selectedDisposition === disp.value ? disp.color : ""
                  }`}
                >
                  {disp.icon}
                  <span className="text-xs mt-1 text-center">{disp.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <h3 className="text-sm font-semibold mb-3">NOTES</h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter notes about this property..."
              className="min-h-[120px]"
            />
          </div>

          {/* Save Actions */}
          <div className="flex gap-2">
            <Button
              onClick={async () => await saveProperty()}
              disabled={saving}
              variant="outline"
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Property
            </Button>
            <Button
              onClick={handleSaveAsCustomer}
              disabled={saving || !phone}
              className="flex-1"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Save as Customer
            </Button>
          </div>

          {/* Add Measurement Button */}
          {onAddMeasurement && (
            <div>
              <Button
                onClick={async () => {
                  // Auto-save property if not already saved
                  if (property.id === "temp" || property.id === "new") {
                    await saveProperty();
                  }
                  onAddMeasurement();
                  onClose();
                }}
                className="w-full"
                size="lg"
                variant="secondary"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Add Roof Measurement
              </Button>
            </div>
          )}

          {/* Customer Link Section */}
          {property.customer_id && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Linked to customer in CRM
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
