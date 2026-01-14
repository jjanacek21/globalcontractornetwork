import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, ArrowUpRight, ArrowDownLeft, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface CompanyReferralsTabProps {
  companyId: string;
}

interface Referral {
  id: string;
  referred_customer_name: string;
  referred_customer_email: string | null;
  referred_customer_phone: string | null;
  referred_service_type: string;
  property_address: string;
  status: string;
  job_amount: number | null;
  payout_amount: number | null;
  created_at: string;
  referring_contractor?: {
    company_name: string;
    first_name: string;
    last_name: string;
  };
  team?: {
    name: string;
  };
}

export const CompanyReferralsTab = ({ companyId }: CompanyReferralsTabProps) => {
  const [outgoingReferrals, setOutgoingReferrals] = useState<Referral[]>([]);
  const [incomingReferrals, setIncomingReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        // Fetch outgoing referrals (from this company's contractors)
        const { data: outgoing, error: outError } = await supabase
          .from("contractor_referrals")
          .select(`
            *,
            referring_contractor:contractor_profiles!contractor_referrals_referring_contractor_id_fkey(
              company_name,
              first_name,
              last_name
            ),
            team:teams(name)
          `)
          .eq("company_id", companyId)
          .order("created_at", { ascending: false });

        if (outError) throw outError;
        setOutgoingReferrals(outgoing || []);

        // Fetch incoming referrals (assigned to this company)
        const { data: incoming, error: inError } = await supabase
          .from("contractor_referrals")
          .select(`
            *,
            referring_contractor:contractor_profiles!contractor_referrals_referring_contractor_id_fkey(
              company_name,
              first_name,
              last_name
            )
          `)
          .eq("assigned_contractor_id", companyId)
          .order("created_at", { ascending: false });

        if (inError) throw inError;
        setIncomingReferrals(incoming || []);
      } catch (error) {
        console.error("Error fetching referrals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, [companyId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "working":
        return <Badge className="bg-blue-500">Working</Badge>;
      case "in-progress":
        return <Badge className="bg-purple-500">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "paid":
        return <Badge className="bg-emerald-600">Paid</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const calculateTotals = (referrals: Referral[]) => {
    const pending = referrals.filter(r => r.status === "pending").length;
    const working = referrals.filter(r => r.status === "working" || r.status === "in-progress").length;
    const completed = referrals.filter(r => r.status === "completed" || r.status === "paid").length;
    const totalEarnings = referrals
      .filter(r => r.status === "paid")
      .reduce((sum, r) => sum + (r.payout_amount || 0), 0);
    const expectedEarnings = referrals
      .filter(r => r.status !== "paid")
      .reduce((sum, r) => sum + (r.job_amount ? r.job_amount * 0.1 : 0), 0);
    
    return { pending, working, completed, totalEarnings, expectedEarnings };
  };

  const outgoingTotals = calculateTotals(outgoingReferrals);

  const ReferralTable = ({ referrals, showTeam = false }: { referrals: Referral[], showTeam?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Service</TableHead>
          {showTeam && <TableHead>Team</TableHead>}
          <TableHead>Referred By</TableHead>
          <TableHead>Job Amount</TableHead>
          <TableHead>Payout</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {referrals.map((referral) => (
          <TableRow key={referral.id}>
            <TableCell>{format(new Date(referral.created_at), "MMM d, yyyy")}</TableCell>
            <TableCell className="font-medium">{referral.referred_customer_name}</TableCell>
            <TableCell>{referral.referred_service_type}</TableCell>
            {showTeam && <TableCell>{referral.team?.name || "-"}</TableCell>}
            <TableCell>
              {referral.referring_contractor?.first_name} {referral.referring_contractor?.last_name}
            </TableCell>
            <TableCell>
              {referral.job_amount ? `$${referral.job_amount.toLocaleString()}` : "-"}
            </TableCell>
            <TableCell>
              {referral.payout_amount ? `$${referral.payout_amount.toLocaleString()}` : "-"}
            </TableCell>
            <TableCell>{getStatusBadge(referral.status)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">{outgoingTotals.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Working</p>
            <p className="text-2xl font-bold">{outgoingTotals.working}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold">{outgoingTotals.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Expected</p>
            <p className="text-2xl font-bold text-amber-600">${outgoingTotals.expectedEarnings.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Earned</p>
            <p className="text-2xl font-bold text-green-600">${outgoingTotals.totalEarnings.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="outgoing">
        <TabsList>
          <TabsTrigger value="outgoing" className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Outgoing ({outgoingReferrals.length})
          </TabsTrigger>
          <TabsTrigger value="incoming" className="flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4" />
            Incoming ({incomingReferrals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="outgoing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Outgoing Referrals
              </CardTitle>
              <CardDescription>Referrals your team has sent to other contractors</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading referrals...</p>
              ) : outgoingReferrals.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No outgoing referrals yet.</p>
                </div>
              ) : (
                <ReferralTable referrals={outgoingReferrals} showTeam />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incoming">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownLeft className="h-5 w-5" />
                Incoming Referrals
              </CardTitle>
              <CardDescription>Referrals assigned to your company</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading referrals...</p>
              ) : incomingReferrals.length === 0 ? (
                <div className="text-center py-8">
                  <ArrowDownLeft className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No incoming referrals yet.</p>
                </div>
              ) : (
                <ReferralTable referrals={incomingReferrals} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
