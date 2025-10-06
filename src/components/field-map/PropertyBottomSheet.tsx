import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, ThumbsDown, ThumbsUp, AlertCircle, Clock, Home } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface PropertyBottomSheetProps {
  property: any;
  onClose: () => void;
  onUpdate: () => void;
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

export function PropertyBottomSheet({ property, onClose, onUpdate }: PropertyBottomSheetProps) {
  const [address, setAddress] = useState(property.address || "");
  const [notes, setNotes] = useState(property.notes || "");
  const [selectedDisposition, setSelectedDisposition] = useState(property.disposition || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleDispositionClick = async (disposition: string) => {
    setSelectedDisposition(disposition);
    await saveProperty(disposition);
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

  const handleSaveNotes = async () => {
    await saveProperty();
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
            <Button
              onClick={handleSaveNotes}
              disabled={saving}
              className="mt-3 w-full bg-red-500 hover:bg-red-600"
            >
              Save Note
            </Button>
          </div>

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
