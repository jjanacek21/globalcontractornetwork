import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, CheckCircle2, XCircle, Building2 } from "lucide-react";
import { AVAILABLE_FEATURES, FeatureKey } from "@/hooks/useContractorFeatures";
import { format } from "date-fns";

interface Contractor {
  id: string;
  company_name: string;
  category: string;
  email: string | null;
  subscription_status: string | null;
  is_verified: boolean | null;
}

interface FeatureAccess {
  id: string;
  feature_name: string;
  is_approved: boolean;
  approved_at: string | null;
}

export default function ContractorFeatureAccess() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchContractors();
  }, []);

  useEffect(() => {
    if (selectedContractor) {
      fetchFeatureAccess(selectedContractor.id);
    }
  }, [selectedContractor]);

  const fetchContractors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contractor_profiles")
        .select("id, company_name, category, email, subscription_status, is_verified")
        .eq("subscription_status", "active")
        .order("company_name");

      if (error) throw error;
      setContractors(data || []);
    } catch (error) {
      console.error("Error fetching contractors:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatureAccess = async (contractorId: string) => {
    try {
      const { data, error } = await supabase
        .from("contractor_feature_access")
        .select("id, feature_name, is_approved, approved_at")
        .eq("contractor_id", contractorId);

      if (error) throw error;
      setFeatureAccess(data || []);
    } catch (error) {
      console.error("Error fetching feature access:", error);
    }
  };

  const toggleFeature = async (featureKey: FeatureKey, currentlyApproved: boolean) => {
    if (!selectedContractor) return;

    setUpdating(featureKey);
    const newApproved = !currentlyApproved;

    try {
      const existingAccess = featureAccess.find(f => f.feature_name === featureKey);

      if (existingAccess) {
        const { error } = await supabase
          .from("contractor_feature_access")
          .update({
            is_approved: newApproved,
            approved_at: newApproved ? new Date().toISOString() : null,
          })
          .eq("id", existingAccess.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("contractor_feature_access")
          .insert({
            contractor_id: selectedContractor.id,
            feature_name: featureKey,
            is_approved: newApproved,
            approved_at: newApproved ? new Date().toISOString() : null,
          });

        if (error) throw error;
      }

      // If approving, send email notification
      if (newApproved) {
        try {
          await supabase.functions.invoke("notify-contractor-access", {
            body: {
              contractor_id: selectedContractor.id,
              approved_features: [featureKey],
            },
          });
        } catch (emailError) {
          console.error("Error sending notification:", emailError);
        }
      }

      toast({
        title: newApproved ? "Feature Enabled" : "Feature Disabled",
        description: `${AVAILABLE_FEATURES.find(f => f.key === featureKey)?.label} has been ${newApproved ? "enabled" : "disabled"} for ${selectedContractor.company_name}.`,
      });

      fetchFeatureAccess(selectedContractor.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update feature access",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const isFeatureApproved = (featureKey: string) => {
    const access = featureAccess.find(f => f.feature_name === featureKey);
    return access?.is_approved === true;
  };

  const getFeatureApprovalDate = (featureKey: string) => {
    const access = featureAccess.find(f => f.feature_name === featureKey);
    return access?.approved_at;
  };

  const filteredContractors = contractors.filter(c =>
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Contractor List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Select Contractor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {filteredContractors.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No contractors found</p>
              ) : (
                filteredContractors.map((contractor) => (
                  <div
                    key={contractor.id}
                    onClick={() => setSelectedContractor(contractor)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedContractor?.id === contractor.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{contractor.company_name}</p>
                        <p className="text-sm text-muted-foreground">{contractor.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {contractor.is_verified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        <Badge variant="outline" className="capitalize">
                          {contractor.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Feature Access Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Access</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedContractor ? (
              <p className="text-center text-muted-foreground py-8">
                Select a contractor to manage their feature access
              </p>
            ) : (
              <div className="space-y-4">
                <div className="pb-4 border-b">
                  <h3 className="font-semibold">{selectedContractor.company_name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedContractor.email}</p>
                </div>

                <div className="space-y-4">
                  {AVAILABLE_FEATURES.map((feature) => {
                    const isApproved = isFeatureApproved(feature.key);
                    const approvalDate = getFeatureApprovalDate(feature.key);
                    const isUpdatingThis = updating === feature.key;

                    return (
                      <div
                        key={feature.key}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={feature.key} className="font-medium cursor-pointer">
                              {feature.label}
                            </Label>
                            {isApproved ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                          {approvalDate && isApproved && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Approved on {format(new Date(approvalDate), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isUpdatingThis && <Loader2 className="h-4 w-4 animate-spin" />}
                          <Switch
                            id={feature.key}
                            checked={isApproved}
                            onCheckedChange={() => toggleFeature(feature.key, isApproved)}
                            disabled={isUpdatingThis}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
