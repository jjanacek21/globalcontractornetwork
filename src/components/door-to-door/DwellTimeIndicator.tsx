import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";

interface DwellTimeIndicatorProps {
  requiredSeconds: number;
  onComplete: () => void;
  onCancel: () => void;
}

export function DwellTimeIndicator({
  requiredSeconds,
  onComplete,
  onCancel
}: DwellTimeIndicatorProps) {
  const [elapsed, setElapsed] = useState(0);
  const progress = Math.min((elapsed / requiredSeconds) * 100, 100);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= requiredSeconds) {
          clearInterval(interval);
          onComplete();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [requiredSeconds, onComplete]);

  const remaining = Math.max(requiredSeconds - elapsed, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
        <div className="w-24 h-24 mx-auto rounded-full border-4 border-primary flex items-center justify-center relative">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-muted/20"
            />
            <circle
              cx="48"
              cy="48"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 * (1 - progress / 100)}
              className="text-primary transition-all duration-1000"
            />
          </svg>
          <span className="text-3xl font-bold text-primary">{remaining}</span>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Dwell Time Verification</h3>
          <p className="text-muted-foreground text-sm">
            Please wait at the door for {requiredSeconds} seconds to verify your knock
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{elapsed}s / {requiredSeconds}s</span>
        </div>

        <button
          onClick={onCancel}
          className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
