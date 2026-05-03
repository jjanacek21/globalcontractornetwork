import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Save, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

export function CompanySettings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "", phone: "", email: "", website: "", address: "", city: "",
    state: "FL", zip_code: "", license_number: "", license_state: "FL",
    license_expiration: "", insurance_provider: "", insurance_policy_number: "",
    insurance_expiration: "", workers_comp_provider: "", workers_comp_expiration: "",
    description: "", logo_url: "",
  });

  const { data: companies, isLoading } = useQuery({
    queryKey: ["company-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("permit_companies").select("*").limit(1);
      if (error) throw error;
      return data;
    },
  });

  const company = companies?.[0];

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || "",
        phone: company.phone || "",
        email: company.email || "",
        website: company.website || "",
        address: company.address || "",
        city: company.city || "",
        state: company.state || "FL",
        zip_code: company.zip_code || "",
        license_number: company.license_number || "",
        license_state: company.license_state || "FL",
        license_expiration: company.license_expiration || "",
        insurance_provider: company.insurance_provider || "",
        insurance_policy_number: company.insurance_policy_number || "",
        insurance_expiration: company.insurance_expiration || "",
        workers_comp_provider: company.workers_comp_provider || "",
        workers_comp_expiration: company.workers_comp_expiration || "",
        description: company.description || "",
        logo_url: company.logo_url || "",
      });
    }
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (company) {
        const { error } = await supabase.from("permit_companies").update(form).eq("id", company.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("permit_companies").insert({ ...form });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      toast.success("Company profile saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) { toast.error("Only JPG/PNG allowed"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }

    const ext = file.name.split(".").pop();
    const path = `logos/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("company-photos").upload(path, file);
    if (error) { toast.error("Upload failed"); return; }
    const { data: urlData } = supabase.storage.from("company-photos").getPublicUrl(path);
    setForm(prev => ({ ...prev, logo_url: urlData.publicUrl }));
    toast.success("Logo uploaded");
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Company Profile</h2>
          <p className="text-sm text-muted-foreground mt-1">Your company information used on estimates, invoices, and permits</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Business Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Logo */}
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-4">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="h-16 w-16 rounded-lg object-cover border border-border" />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center text-muted-foreground border border-dashed border-border">
                    <Building2 className="h-6 w-6" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <span><Upload className="h-3 w-3" />Upload Logo</span>
                  </Button>
                  <input type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>
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

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Address</CardTitle></CardHeader>
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
                    <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ZIP</Label>
                  <Input value={form.zip_code} onChange={e => update("zip_code", e.target.value)} placeholder="33101" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Licensing & Insurance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>License Number</Label>
                  <Input value={form.license_number} onChange={e => update("license_number", e.target.value)} placeholder="CCC1234567" />
                </div>
                <div className="space-y-2">
                  <Label>License State</Label>
                  <Select value={form.license_state} onValueChange={v => update("license_state", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>License Expiration</Label>
                <Input type="date" value={form.license_expiration} onChange={e => update("license_expiration", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Insurance Provider</Label>
                  <Input value={form.insurance_provider} onChange={e => update("insurance_provider", e.target.value)} placeholder="State Farm" />
                </div>
                <div className="space-y-2">
                  <Label>Policy Number</Label>
                  <Input value={form.insurance_policy_number} onChange={e => update("insurance_policy_number", e.target.value)} placeholder="POL-123456" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Insurance Expiration</Label>
                <Input type="date" value={form.insurance_expiration} onChange={e => update("insurance_expiration", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Workers Comp Provider</Label>
                  <Input value={form.workers_comp_provider} onChange={e => update("workers_comp_provider", e.target.value)} placeholder="Provider name" />
                </div>
                <div className="space-y-2">
                  <Label>Workers Comp Expiration</Label>
                  <Input type="date" value={form.workers_comp_expiration} onChange={e => update("workers_comp_expiration", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
