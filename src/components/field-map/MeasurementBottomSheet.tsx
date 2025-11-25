import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface MeasurementBottomSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: (customerId: string, notes: string) => void;
  measurements: {
    area: number;
    pitchedArea: number;
    squares: number;
    perimeter: number;
  };
  polygonData: any;
}

interface Customer {
  id: string;
  name: string;
  address?: string;
}

export function MeasurementBottomSheet({
  open,
  onClose,
  onSave,
  measurements,
  polygonData,
}: MeasurementBottomSheetProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadCustomers();
    }
  }, [open]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, address")
        .order("name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading customers",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!selectedCustomerId) {
      toast({
        title: "Customer required",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("measurements").insert({
        customer_id: selectedCustomerId,
        total_square_feet: measurements.pitchedArea,
        total_squares: measurements.squares,
        notes,
        polygon_data: polygonData,
      });

      if (error) throw error;

      toast({
        title: "Measurement saved",
        description: "Roof measurement has been saved successfully",
      });

      onSave(selectedCustomerId, notes);
      onClose();
      setSelectedCustomerId("");
      setNotes("");
    } catch (error: any) {
      toast({
        title: "Error saving measurement",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[500px]">
        <SheetHeader>
          <SheetTitle>Save Roof Measurement</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Measurement Summary */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pitched Area:</span>
              <span className="font-medium">{measurements.pitchedArea.toFixed(2)} sq ft</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-semibold">Total Squares:</span>
              <span className="text-lg font-bold text-primary">{measurements.squares.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Perimeter:</span>
              <span className="font-medium">{measurements.perimeter.toFixed(2)} ft</span>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="space-y-2">
            <Label>Select Customer</Label>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a customer..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} {customer.address && `- ${customer.address}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this measurement..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={saving || !selectedCustomerId}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Measurement
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
