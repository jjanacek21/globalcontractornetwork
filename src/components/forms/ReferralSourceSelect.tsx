import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";

const REFERRAL_SOURCES = [
  { value: "google", label: "Google Search" },
  { value: "facebook", label: "Facebook/Instagram" },
  { value: "friend", label: "Friend/Family" },
  { value: "previous_customer", label: "Previous Customer" },
  { value: "contractor", label: "Contractor" },
  { value: "yard_sign", label: "Yard Sign" },
  { value: "flyer", label: "Flyer/Mailer" },
  { value: "home_show", label: "Home Show/Event" },
  { value: "real_estate", label: "Real Estate Agent" },
  { value: "insurance", label: "Insurance Company" },
  { value: "other", label: "Other" },
];

interface Contractor {
  id: string;
  company_name: string;
}

interface ReferralSourceSelectProps {
  referralSource: string;
  referralContractorId: string | null;
  onReferralSourceChange: (value: string) => void;
  onContractorChange: (id: string | null) => void;
  className?: string;
}

export function ReferralSourceSelect({
  referralSource,
  referralContractorId,
  onReferralSourceChange,
  onContractorChange,
  className = "",
}: ReferralSourceSelectProps) {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (referralSource === "contractor") {
      fetchContractors();
    }
  }, [referralSource]);

  const fetchContractors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contractor_profiles")
        .select("id, company_name")
        .order("company_name");

      if (error) throw error;
      setContractors(data || []);
    } catch (error) {
      console.error("Error fetching contractors:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContractors = contractors.filter((c) =>
    c.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSourceChange = (value: string) => {
    onReferralSourceChange(value);
    if (value !== "contractor") {
      onContractorChange(null);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label>How did you hear about us?</Label>
        <Select value={referralSource} onValueChange={handleSourceChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select referral source" />
          </SelectTrigger>
          <SelectContent>
            {REFERRAL_SOURCES.map((source) => (
              <SelectItem key={source.value} value={source.value}>
                {source.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {referralSource === "contractor" && (
        <div className="space-y-2">
          <Label>Select Company</Label>
          {loading ? (
            <div className="text-sm text-muted-foreground py-2">Loading contractors...</div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={referralContractorId || ""}
                onValueChange={(value) => onContractorChange(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contractor company" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredContractors.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No contractors found
                    </div>
                  ) : (
                    filteredContractors.map((contractor) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        {contractor.company_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      )}
    </div>
  );
}
