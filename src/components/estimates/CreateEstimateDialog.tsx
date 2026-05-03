import { useState, useEffect } from "react";
import { useEstimates } from "@/hooks/useEstimates";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type Customer = Database["public"]["Tables"]["customers"]["Row"];

interface CreateEstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateEstimateDialog({ open, onOpenChange }: CreateEstimateDialogProps) {
  const { createEstimate } = useEstimates();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    notes: "",
    tax_rate: "7",
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data } = await supabase
        .from("permit_customers")
        .select("*")
        .order("name", { ascending: true });
      setCustomers(data || []);
    };
    if (open) {
      fetchCustomers();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_id) return;

    setIsSubmitting(true);

    const estimate = await createEstimate({
      customer_id: formData.customer_id,
      notes: formData.notes || null,
      tax_rate: parseFloat(formData.tax_rate) || 0,
      status: "draft",
      subtotal: 0,
      tax_amount: 0,
      total: 0,
    });

    setIsSubmitting(false);

    if (estimate) {
      onOpenChange(false);
      setFormData({
        customer_id: "",
        notes: "",
        tax_rate: "7",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Estimate</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer_id">Customer *</Label>
            {customers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No customers available. Create a customer first.
              </p>
            ) : (
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_rate">Tax Rate (%)</Label>
            <Input
              id="tax_rate"
              type="number"
              step="0.01"
              value={formData.tax_rate}
              onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
              placeholder="7"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes for this estimate..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.customer_id}>
              {isSubmitting ? "Creating..." : "Create Estimate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
