import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import ReferralsDashboard from "@/components/referrals/ReferralsDashboard";

export default function ContractorReferralsPage() {
  const navigate = useNavigate();
  const [contractorId, setContractorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/network-login");
        return;
      }
      const { data } = await supabase
        .from("contractor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data) {
        navigate("/member/dashboard");
        return;
      }
      setContractorId(data.id);
      setLoading(false);
    })();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/member/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">Referrals</h1>
          <div className="w-32" />
        </div>
      </header>
      <main className="container max-w-5xl mx-auto px-4 py-6">
        {contractorId && <ReferralsDashboard contractorId={contractorId} />}
      </main>
    </div>
  );
}
