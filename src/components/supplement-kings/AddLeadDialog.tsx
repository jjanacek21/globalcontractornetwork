import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  contractorId: string;
}

export function AddLeadDialog({ open, onOpenChange, onSuccess, contractorId }: AddLeadDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    property_address: "",
    property_city: "",
    property_state: "FL",
    property_zip: "",
    claim_type: "",
    insurance_company: "",
    claim_number: "",
    date_of_loss: "",
    urgency: "standard",
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('supplement_leads')
        .insert({
          ...formData,
          contractor_id: contractorId,
          date_of_loss: formData.date_of_loss || null
        });

      if (error) throw error;

      toast({
        title: "Lead submitted!",
        description: "Your lead has been submitted successfully. We'll start working on it right away.",
      });

      setFormData({
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        property_address: "",
        property_city: "",
        property_state: "FL",
        property_zip: "",
        claim_type: "",
        insurance_company: "",
        claim_number: "",
        date_of_loss: "",
        urgency: "standard",
        notes: ""
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit lead.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Submit New Lead</DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter the claim details and we'll get started on your estimate within 24-48 hours.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white border-b border-slate-700 pb-2">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name" className="text-slate-300">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_phone" className="text-slate-300">Phone</Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customer_email" className="text-slate-300">Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* Property Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white border-b border-slate-700 pb-2">Property Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="property_address" className="text-slate-300">Property Address *</Label>
                <Input
                  id="property_address"
                  value={formData.property_address}
                  onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="property_city" className="text-slate-300">City *</Label>
                <Input
                  id="property_city"
                  value={formData.property_city}
                  onChange={(e) => setFormData({ ...formData, property_city: e.target.value })}
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="property_state" className="text-slate-300">State</Label>
                  <Input
                    id="property_state"
                    value={formData.property_state}
                    onChange={(e) => setFormData({ ...formData, property_state: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_zip" className="text-slate-300">ZIP</Label>
                  <Input
                    id="property_zip"
                    value={formData.property_zip}
                    onChange={(e) => setFormData({ ...formData, property_zip: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Claim Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white border-b border-slate-700 pb-2">Claim Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="claim_type" className="text-slate-300">Claim Type *</Label>
                <Select
                  value={formData.claim_type}
                  onValueChange={(value) => setFormData({ ...formData, claim_type: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select claim type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="wind">Wind</SelectItem>
                    <SelectItem value="hail">Hail</SelectItem>
                    <SelectItem value="water">Water</SelectItem>
                    <SelectItem value="fire">Fire</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="urgency" className="text-slate-300">Urgency</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="standard">Standard (48hr)</SelectItem>
                    <SelectItem value="urgent">Urgent (24hr)</SelectItem>
                    <SelectItem value="rush">Rush (Same Day)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance_company" className="text-slate-300">Insurance Company</Label>
                <Input
                  id="insurance_company"
                  value={formData.insurance_company}
                  onChange={(e) => setFormData({ ...formData, insurance_company: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claim_number" className="text-slate-300">Claim Number</Label>
                <Input
                  id="claim_number"
                  value={formData.claim_number}
                  onChange={(e) => setFormData({ ...formData, claim_number: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_loss" className="text-slate-300">Date of Loss</Label>
                <Input
                  id="date_of_loss"
                  type="date"
                  value={formData.date_of_loss}
                  onChange={(e) => setFormData({ ...formData, date_of_loss: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-300">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information about the claim..."
              className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}