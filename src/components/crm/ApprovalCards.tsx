import { FileText, DollarSign, ClipboardList, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type ApprovalStatus = "not_started" | "in_progress" | "complete";

interface ApprovalCardItem {
  label: string;
  icon: React.ElementType;
  status: ApprovalStatus;
  statusLabel: string;
  progress?: number;
  progressLabel?: string;
}

const statusStyles: Record<ApprovalStatus, string> = {
  not_started: "border-muted bg-muted/30 text-muted-foreground",
  in_progress: "border-yellow-400 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
  complete: "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
};

const dotStyles: Record<ApprovalStatus, string> = {
  not_started: "bg-muted-foreground",
  in_progress: "bg-yellow-500",
  complete: "bg-green-500",
};

interface ApprovalCardsProps {
  contractStatus?: "not_sent" | "sent" | "signed";
  estimateStatus?: "not_sent" | "sent" | "approved";
  nocStatus?: "not_filed" | "filed" | "recorded";
  photosCount?: number;
  photosRequired?: number;
}

function mapStatus(value: string, stages: string[]): ApprovalStatus {
  if (value === stages[2]) return "complete";
  if (value === stages[1]) return "in_progress";
  return "not_started";
}

export function ApprovalCards({
  contractStatus = "not_sent",
  estimateStatus = "not_sent",
  nocStatus = "not_filed",
  photosCount = 0,
  photosRequired = 4,
}: ApprovalCardsProps) {
  const photoProgress = Math.min((photosCount / photosRequired) * 100, 100);
  const photoApproval: ApprovalStatus =
    photosCount >= photosRequired ? "complete" : photosCount > 0 ? "in_progress" : "not_started";

  const cards: ApprovalCardItem[] = [
    {
      label: "Contract",
      icon: FileText,
      status: mapStatus(contractStatus, ["not_sent", "sent", "signed"]),
      statusLabel: contractStatus === "signed" ? "Signed" : contractStatus === "sent" ? "Sent" : "Not Sent",
    },
    {
      label: "Estimate",
      icon: DollarSign,
      status: mapStatus(estimateStatus, ["not_sent", "sent", "approved"]),
      statusLabel: estimateStatus === "approved" ? "Approved" : estimateStatus === "sent" ? "Sent" : "Not Sent",
    },
    {
      label: "Notice of Commencement",
      icon: ClipboardList,
      status: mapStatus(nocStatus, ["not_filed", "filed", "recorded"]),
      statusLabel: nocStatus === "recorded" ? "Recorded" : nocStatus === "filed" ? "Filed" : "Not Filed",
    },
    {
      label: "Photos",
      icon: Camera,
      status: photoApproval,
      statusLabel: `${photosCount}/${photosRequired} Required`,
      progress: photoProgress,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className={cn("border-2 transition-colors", statusStyles[card.status])}>
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <Icon className="h-6 w-6" />
              <p className="text-xs font-semibold leading-tight">{card.label}</p>
              <div className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", dotStyles[card.status])} />
                <span className="text-xs font-medium">{card.statusLabel}</span>
              </div>
              {card.progress !== undefined && (
                <Progress value={card.progress} className="h-1.5 w-full" />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
