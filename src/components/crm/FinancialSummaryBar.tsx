import { DollarSign, CheckCircle, AlertCircle, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FinancialSummaryBarProps {
  totalEstimate: number;
  approvedAmount: number;
  outstandingBalance: number;
  paymentStatus: "unpaid" | "partial" | "paid";
}

const paymentStatusConfig = {
  unpaid: { label: "Unpaid", color: "text-destructive", bg: "bg-destructive/10" },
  partial: { label: "Partial", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/20" },
  paid: { label: "Paid", color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/20" },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value);
}

export function FinancialSummaryBar({
  totalEstimate,
  approvedAmount,
  outstandingBalance,
  paymentStatus,
}: FinancialSummaryBarProps) {
  const psCfg = paymentStatusConfig[paymentStatus];

  const items = [
    { label: "Total Estimate", value: formatCurrency(totalEstimate), icon: DollarSign, accent: "text-primary" },
    { label: "Approved", value: formatCurrency(approvedAmount), icon: CheckCircle, accent: "text-green-600 dark:text-green-400" },
    { label: "Outstanding", value: formatCurrency(outstandingBalance), icon: AlertCircle, accent: "text-destructive" },
    { label: "Payment", value: psCfg.label, icon: CreditCard, accent: psCfg.color },
  ];

  return (
    <Card>
      <CardContent className="p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted")}>
                  <Icon className={cn("h-4 w-4", item.accent)} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={cn("text-sm font-bold", item.accent)}>{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
