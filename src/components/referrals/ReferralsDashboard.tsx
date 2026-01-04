import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReferrals } from "@/hooks/useReferrals";
import SubmitReferralDialog from "./SubmitReferralDialog";
import { 
  Lightbulb, 
  CheckCircle2, 
  DollarSign, 
  Plus, 
  Clock, 
  Phone, 
  Calendar,
  Wrench,
  ArrowRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }> = {
  submitted: { label: "Submitted", variant: "secondary", icon: Clock },
  contacted: { label: "Contacted", variant: "outline", icon: Phone },
  scheduled: { label: "Scheduled", variant: "outline", icon: Calendar },
  in_progress: { label: "In Progress", variant: "default", icon: Wrench },
  completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
  paid: { label: "Paid", variant: "default", icon: DollarSign },
};

interface ReferralsDashboardProps {
  contractorId: string;
}

const ReferralsDashboard = ({ contractorId }: ReferralsDashboardProps) => {
  const { referrals, stats, loading } = useReferrals(contractorId);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 w-24 bg-muted rounded mb-2" />
                <div className="h-8 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Opportunities Identified</p>
                <p className="text-3xl font-bold">{stats.totalSent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Referrals Completed</p>
                <p className="text-3xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Referral Earnings</p>
                <p className="text-3xl font-bold">${stats.totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit Button + Recent Referrals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Your Referrals</CardTitle>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Submit Referral
          </Button>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Referrals Yet</h3>
              <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                When you identify work outside your trade, submit a referral to earn when the job is completed.
              </p>
              <Button onClick={() => setDialogOpen(true)} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Submit Your First Referral
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.slice(0, 5).map((referral) => {
                const statusConfig = STATUS_CONFIG[referral.status] || STATUS_CONFIG.submitted;
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <StatusIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{referral.referred_customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {referral.referred_service_type} • {referral.property_address.split(",")[0]}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(referral.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {referrals.length > 5 && (
                <Button variant="ghost" className="w-full gap-2 text-muted-foreground">
                  View All {referrals.length} Referrals
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <SubmitReferralDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contractorId={contractorId}
      />
    </div>
  );
};

export default ReferralsDashboard;
