import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DollarSign, CheckCircle2, Clock, TrendingUp, Plus } from 'lucide-react';
import { useReferrals } from '@/hooks/useReferrals';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import SubmitReferralDialog from '@/components/referrals/SubmitReferralDialog';

interface ReferralEarningsCardProps {
  contractorId: string;
}

export function ReferralEarningsCard({ contractorId }: ReferralEarningsCardProps) {
  const { referrals, stats, loading } = useReferrals(contractorId);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Calculate additional stats
  const paidReferrals = referrals.filter(r => r.status === 'paid');
  const pendingPayoutReferrals = referrals.filter(r => r.status === 'completed');
  const pendingPayoutAmount = pendingPayoutReferrals.reduce((sum, r) => sum + (r.payout_amount || 0), 0);

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Referral Earnings
        </CardTitle>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" />
          Submit Referral
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Total Paid */}
          <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-600">Total Paid</span>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              ${stats.totalEarnings.toLocaleString()}
            </p>
          </div>

          {/* Pending Payout */}
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-600">Pending</span>
            </div>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              ${pendingPayoutAmount.toLocaleString()}
            </p>
          </div>

          {/* Total Referrals */}
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">Referrals</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {stats.totalSent}
            </p>
          </div>
        </div>

        {/* Recent Paid Referrals */}
        {paidReferrals.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Recent Payments
              </h4>
              <div className="space-y-2">
                {paidReferrals.slice(0, 3).map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between text-sm py-2 px-3 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
                        Paid
                      </Badge>
                      <span className="font-medium">{referral.referred_customer_name}</span>
                      <span className="text-muted-foreground">- {referral.referred_service_type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-green-600">
                        +${referral.payout_amount?.toLocaleString() || 0}
                      </span>
                      {referral.paid_at && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(referral.paid_at), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Pending Payouts */}
        {pendingPayoutReferrals.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Pending Payouts
              </h4>
              <div className="space-y-2">
                {pendingPayoutReferrals.slice(0, 3).map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between text-sm py-2 px-3 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                        Pending
                      </Badge>
                      <span className="font-medium">{referral.referred_customer_name}</span>
                      <span className="text-muted-foreground">- {referral.referred_service_type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-amber-600">
                        ${referral.payout_amount?.toLocaleString() || 'TBD'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {referrals.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No referrals yet. Click <span className="font-medium">Submit Referral</span> to send your first one.
          </p>
        )}
      </CardContent>
      <SubmitReferralDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contractorId={contractorId}
      />
    </Card>
  );
}
