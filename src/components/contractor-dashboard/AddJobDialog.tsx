import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AddJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (jobData: {
    homeowner_name: string;
    homeowner_phone: string;
    homeowner_email: string;
    property_address: string;
    service_type: string;
    scheduled_date: string | null;
    scheduled_time: string | null;
    quoted_amount: number | null;
    notes: string | null;
    status: string;
    job_details: Record<string, unknown>;
    collected_amount: number;
  }) => Promise<unknown>;
}

const serviceTypes = [
  "Roofing",
  "Roof Coating",
  "Windows & Doors",
  "Tree Removal",
  "Landscaping",
  "Mold Remediation",
  "Water Damage",
  "General Repairs",
  "Engineering",
  "Other",
];

export const AddJobDialog = ({ open, onOpenChange, onSubmit }: AddJobDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    homeowner_name: "",
    homeowner_phone: "",
    homeowner_email: "",
    property_address: "",
    service_type: "",
    scheduled_date: "",
    scheduled_time: "",
    quoted_amount: "",
    notes: "",
  });

  const handleSubmit = async () => {
    if (!formData.homeowner_name || !formData.property_address || !formData.service_type) {
      return;
    }

    setLoading(true);
    await onSubmit({
      homeowner_name: formData.homeowner_name,
      homeowner_phone: formData.homeowner_phone || null,
      homeowner_email: formData.homeowner_email || null,
      property_address: formData.property_address,
      service_type: formData.service_type,
      scheduled_date: formData.scheduled_date || null,
      scheduled_time: formData.scheduled_time || null,
      quoted_amount: formData.quoted_amount ? parseFloat(formData.quoted_amount) : null,
      notes: formData.notes || null,
      status: formData.scheduled_date ? "scheduled" : "pending",
      job_details: {},
      collected_amount: 0,
    });
    
    setLoading(false);
    setFormData({
      homeowner_name: "",
      homeowner_phone: "",
      homeowner_email: "",
      property_address: "",
      service_type: "",
      scheduled_date: "",
      scheduled_time: "",
      quoted_amount: "",
      notes: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Job</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Homeowner Name *</Label>
              <Input
                value={formData.homeowner_name}
                onChange={(e) => setFormData({ ...formData, homeowner_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.homeowner_phone}
                onChange={(e) => setFormData({ ...formData, homeowner_phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.homeowner_email}
                onChange={(e) => setFormData({ ...formData, homeowner_email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            
            <div className="col-span-2">
              <Label>Property Address *</Label>
              <Input
                value={formData.property_address}
                onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
                placeholder="123 Main St, City, FL 33101"
              />
            </div>
            
            <div>
              <Label>Service Type *</Label>
              <Select
                value={formData.service_type}
                onValueChange={(value) => setFormData({ ...formData, service_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Quoted Amount</Label>
              <Input
                type="number"
                value={formData.quoted_amount}
                onChange={(e) => setFormData({ ...formData, quoted_amount: e.target.value })}
                placeholder="5000"
              />
            </div>
            
            <div>
              <Label>Scheduled Date</Label>
              <Input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />
            </div>
            
            <div>
              <Label>Scheduled Time</Label>
              <Input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              />
            </div>
            
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about the job..."
                rows={3}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !formData.homeowner_name || !formData.property_address || !formData.service_type}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
