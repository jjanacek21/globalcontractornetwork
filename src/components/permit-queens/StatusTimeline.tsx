import { CheckCircle2, Circle, Clock, FileText, AlertCircle, CreditCard, Send, Search, AlertTriangle, Award, FolderCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const PIPELINE_STAGES = [
  { key: 'intake', label: 'Intake', icon: FileText },
  { key: 'data_capture', label: 'Data Capture', icon: FileText },
  { key: 'docs_needed', label: 'Documents', icon: FolderCheck },
  { key: 'packet_assembly', label: 'Assembly', icon: Clock },
  { key: 'compliance_check', label: 'Compliance', icon: Search },
  { key: 'awaiting_payment', label: 'Payment', icon: CreditCard },
  { key: 'ready_to_submit', label: 'Ready', icon: Send },
  { key: 'under_review', label: 'Review', icon: Clock },
  { key: 'corrections_needed', label: 'Corrections', icon: AlertTriangle },
  { key: 'approved_ready_to_pay', label: 'Approved', icon: CheckCircle2 },
  { key: 'issued_closed', label: 'Issued', icon: Award },
];

interface StatusTimelineProps {
  currentStatus: string;
  className?: string;
  compact?: boolean;
}

export function StatusTimeline({ currentStatus, className, compact = false }: StatusTimelineProps) {
  const currentIndex = PIPELINE_STAGES.findIndex(s => s.key === currentStatus);

  // For compact view, show simplified stages
  const displayStages = compact
    ? PIPELINE_STAGES.filter(s => 
        ['intake', 'docs_needed', 'awaiting_payment', 'under_review', 'issued_closed'].includes(s.key)
      )
    : PIPELINE_STAGES;

  return (
    <div className={cn("w-full", className)}>
      <div className={cn(
        "flex items-center justify-between",
        compact ? "gap-2" : "gap-1"
      )}>
        {displayStages.map((stage, index) => {
          const fullIndex = PIPELINE_STAGES.findIndex(s => s.key === stage.key);
          const isCompleted = fullIndex < currentIndex;
          const isCurrent = stage.key === currentStatus;
          const isCorrection = stage.key === 'corrections_needed' && currentStatus === 'corrections_needed';
          const Icon = stage.icon;

          return (
            <div key={stage.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "rounded-full flex items-center justify-center transition-all",
                    compact ? "w-8 h-8" : "w-10 h-10",
                    isCompleted && "bg-green-500 text-white",
                    isCurrent && !isCorrection && "bg-amber-500 text-white ring-4 ring-amber-200",
                    isCorrection && "bg-red-500 text-white ring-4 ring-red-200",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
                  ) : (
                    <Icon className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
                  )}
                </div>
                {!compact && (
                  <span
                    className={cn(
                      "mt-2 text-xs text-center max-w-[80px]",
                      isCompleted && "text-green-600 font-medium",
                      isCurrent && "text-amber-600 font-semibold",
                      !isCompleted && !isCurrent && "text-muted-foreground"
                    )}
                  >
                    {stage.label}
                  </span>
                )}
              </div>

              {index < displayStages.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-1 rounded-full",
                    fullIndex < currentIndex ? "bg-green-500" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function getStatusLabel(status: string): string {
  const stage = PIPELINE_STAGES.find(s => s.key === status);
  return stage?.label || status;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'issued_closed':
    case 'approved_ready_to_pay':
      return 'bg-green-100 text-green-800';
    case 'under_review':
    case 'ready_to_submit':
      return 'bg-blue-100 text-blue-800';
    case 'awaiting_payment':
      return 'bg-purple-100 text-purple-800';
    case 'corrections_needed':
      return 'bg-red-100 text-red-800';
    case 'packet_assembly':
    case 'compliance_check':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
