import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  insurance_company?: string;
  insurance_policy?: string;
  lead_source?: string;
  pipeline_stage?: string;
  notes?: string;
}

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSuccess: () => void;
}

export function CustomerDialog({ open, onOpenChange, customer, onSuccess }: CustomerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    phone: "",
    email: "",
    insurance_company: "",
    insurance_policy: "",
    lead_source: "",
    pipeline_stage: "lead",
    notes: "",
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        zip_code: customer.zip_code || "",
        phone: customer.phone || "",
        email: customer.email || "",
        insurance_company: customer.insurance_company || "",
        insurance_policy: customer.insurance_policy || "",
        lead_source: customer.lead_source || "",
        pipeline_stage: customer.pipeline_stage || "lead",
        notes: customer.notes || "",
      });
    } else {
      setFormData({
        name: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        phone: "",
        email: "",
        insurance_company: "",
        insurance_policy: "",
        lead_source: "",
        pipeline_stage: "lead",
        notes: "",
      });
    }
  }, [customer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (customer) {
        const { error } = await supabase
          .from("customers")
          .update(formData as any)
          .eq("id", customer.id);

        if (error) throw error;
        toast.success("Customer updated successfully");
      } else {
        const { error } = await supabase
          .from("customers")
          .insert([{ ...formData, assigned_rep_id: user?.id }] as any);

        if (error) throw error;
        toast.success("Customer added successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving customer:", error);
      toast.error(error.message || "Failed to save customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          <DialogDescription>
            {customer ? "Update customer information" : "Enter customer details to add to your pipeline"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">Zip Code</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="insurance_company">Insurance Company</Label>
              <Input
                id="insurance_company"
                value={formData.insurance_company}
                onChange={(e) => setFormData({ ...formData, insurance_company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurance_policy">Policy Number</Label>
              <Input
                id="insurance_policy"
                value={formData.insurance_policy}
                onChange={(e) => setFormData({ ...formData, insurance_policy: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lead_source">Lead Source</Label>
              <Input
                id="lead_source"
                value={formData.lead_source}
                onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
                placeholder="e.g., Referral, Website, Door Knocking"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pipeline_stage">Pipeline Stage</Label>
              <Select
                value={formData.pipeline_stage}
                onValueChange={(value) => setFormData({ ...formData, pipeline_stage: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="estimate_sent">Estimate Sent</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="in_production">In Production</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                customer ? "Update Customer" : "Add Customer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
