import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Building2, Save, Loader2 } from "lucide-react";

interface CompanyProfileTabProps {
  companyId: string;
}

interface CompanyProfile {
  name: string;
  description: string;
  bio_short: string;
  bio_long: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  website: string;
  min_contract_value_out_of_area: number;
}

export const CompanyProfileTab = ({ companyId }: CompanyProfileTabProps) => {
  const [profile, setProfile] = useState<CompanyProfile>({
    name: "",
    description: "",
    bio_short: "",
    bio_long: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    phone: "",
    email: "",
    website: "",
    min_contract_value_out_of_area: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("companies")
          .select("*")
          .eq("id", companyId)
          .single();

        if (error) throw error;
        if (data) {
          setProfile({
            name: data.name || "",
            description: data.description || "",
            bio_short: data.bio_short || "",
            bio_long: data.bio_long || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            zip_code: data.zip_code || "",
            phone: data.phone || "",
            email: data.email || "",
            website: data.website || "",
            min_contract_value_out_of_area: data.min_contract_value_out_of_area || 0
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [companyId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: profile.name,
          description: profile.description,
          bio_short: profile.bio_short,
          bio_long: profile.bio_long,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          zip_code: profile.zip_code,
          phone: profile.phone,
          email: profile.email,
          website: profile.website,
          min_contract_value_out_of_area: profile.min_contract_value_out_of_area
        })
        .eq("id", companyId);

      if (error) throw error;
      toast({ title: "Profile Updated", description: "Company profile has been saved successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading profile...</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Profile
          </CardTitle>
          <CardDescription>
            This information is displayed to property owners when they browse the contractor directory
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bio_short">Short Bio</Label>
              <Input
                id="bio_short"
                value={profile.bio_short}
                onChange={(e) => setProfile({ ...profile, bio_short: e.target.value })}
                placeholder="One-line description of your company"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bio_long">About Us</Label>
              <Textarea
                id="bio_long"
                value={profile.bio_long}
                onChange={(e) => setProfile({ ...profile, bio_long: e.target.value })}
                placeholder="Detailed description of your company, services, and values"
                rows={5}
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Contact Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder="https://"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={profile.state}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP</Label>
                  <Input
                    id="zip"
                    value={profile.zip_code}
                    onChange={(e) => setProfile({ ...profile, zip_code: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Service Settings</h3>
            <div className="space-y-2">
              <Label htmlFor="minContract">Minimum Contract Value (Out of Service Area)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  id="minContract"
                  type="number"
                  min="0"
                  value={profile.min_contract_value_out_of_area}
                  onChange={(e) => setProfile({ ...profile, min_contract_value_out_of_area: parseFloat(e.target.value) || 0 })}
                  className="max-w-[200px]"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Jobs outside your service area must meet this minimum value
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
