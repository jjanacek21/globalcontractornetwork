import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STAGES = [
  { key: "lead", label: "Lead" },
  { key: "inspection", label: "Inspection" },
  { key: "estimate", label: "Estimate" },
  { key: "contract", label: "Contract" },
  { key: "permit", label: "Permit" },
  { key: "production", label: "Production" },
  { key: "complete", label: "Complete" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

// Map lead_status enum values to our stage keys
const STATUS_TO_STAGE: Record<string, StageKey> = {
  new: "lead",
  contact_made: "lead",
  inspection_scheduled: "inspection",
  inspected: "inspection",
  estimate_sent: "estimate",
  negotiating: "estimate",
  closed_won: "contract",
  closed_lost: "lead",
  no_deal: "lead",
};

interface JobProgressTrackerProps {
  leadStatus?: string | null;
  /** Override stage directly instead of mapping from lead status */
  currentStage?: StageKey;
}

export function JobProgressTracker({ leadStatus, currentStage }: JobProgressTrackerProps) {
  const active = currentStage || (leadStatus ? STATUS_TO_STAGE[leadStatus] || "lead" : "lead");
  const activeIndex = STAGES.findIndex((s) => s.key === active);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {STAGES.map((stage, i) => {
          const isComplete = i < activeIndex;
          const isCurrent = i === activeIndex;
          const isFuture = i > activeIndex;

          return (
            <div key={stage.key} className="flex items-center flex-1 last:flex-none">
              {/* Node */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                    isComplete && "bg-green-500 border-green-500 text-white",
                    isCurrent && "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20",
                    isFuture && "bg-muted border-border text-muted-foreground"
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium whitespace-nowrap",
                    isComplete && "text-green-600 dark:text-green-400",
                    isCurrent && "text-primary font-bold",
                    isFuture && "text-muted-foreground"
                  )}
                >
                  {stage.label}
                </span>
              </div>

              {/* Connector */}
              {i < STAGES.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-1 mt-[-18px]",
                    i < activeIndex ? "bg-green-500" : "bg-border"
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

export { STAGES, STATUS_TO_STAGE };
export type { StageKey };
