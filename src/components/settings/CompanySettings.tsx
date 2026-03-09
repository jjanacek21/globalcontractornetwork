import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Save } from "lucide-react";
import { toast } from "sonner";

export function CompanySettings() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    state: "FL",
    zip: "",
    licenseNumber: "",
    licenseState: "FL",
    insuranceProvider: "",
    insurancePolicyNumber: "",
    description: "",
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Company Profile</h2>
          <p className="text-sm text-muted-foreground mt-1">Your company information used on estimates, invoices, and permits</p>
        </div>
        <Button onClick={() => toast.success("Company profile saved")} className="gap-2"><Save className="h-4 w-4" />Save Changes</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Business Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Your Company LLC" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="(555) 123-4567" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={e => update("email", e.target.value)} placeholder="info@company.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://www.company.com" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => update("description", e.target.value)} placeholder="Brief company description..." rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Address & Licensing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Street Address</Label>
              <Input value={form.address} onChange={e => update("address", e.target.value)} placeholder="123 Main St" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city} onChange={e => update("city", e.target.value)} placeholder="Miami" />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={form.state} onValueChange={v => update("state", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="GA">Georgia</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="NC">North Carolina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ZIP</Label>
                <Input value={form.zip} onChange={e => update("zip", e.target.value)} placeholder="33101" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>License Number</Label>
                <Input value={form.licenseNumber} onChange={e => update("licenseNumber", e.target.value)} placeholder="CCC1234567" />
              </div>
              <div className="space-y-2">
                <Label>License State</Label>
                <Select value={form.licenseState} onValueChange={v => update("licenseState", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="GA">Georgia</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Insurance Provider</Label>
                <Input value={form.insuranceProvider} onChange={e => update("insuranceProvider", e.target.value)} placeholder="State Farm" />
              </div>
              <div className="space-y-2">
                <Label>Policy Number</Label>
                <Input value={form.insurancePolicyNumber} onChange={e => update("insurancePolicyNumber", e.target.value)} placeholder="POL-123456" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
