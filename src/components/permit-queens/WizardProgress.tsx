import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';

interface WizardStep {
  number: number;
  title: string;
  description: string;
}

interface WizardProgressProps {
  steps: WizardStep[];
  currentStep: number;
  className?: string;
  completionPercentage?: number;
  onStepClick?: (stepNumber: number) => void;
}

export function WizardProgress({ steps, currentStep, className, completionPercentage, onStepClick }: WizardProgressProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const canClick = isCompleted && onStepClick;
          
          return (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={!canClick}
                  onClick={() => canClick && onStepClick(step.number)}
                  className={cn(
                    // Larger touch targets on mobile
                    isMobile ? "w-12 h-12" : "w-10 h-10",
                    "rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                    canClick && "cursor-pointer hover:ring-2 hover:ring-primary/40 active:scale-95"
                  )}
                >
                  {isCompleted ? <Check className={cn(isMobile ? "w-6 h-6" : "w-5 h-5")} /> : step.number}
                </button>
                <div className="mt-2 text-center">
                  <p className={cn(
                    "font-medium",
                    isMobile ? "text-xs" : "text-sm",
                    (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {isMobile ? `Step ${step.number}` : step.title}
                  </p>
                  {!isMobile && (
                    <p className="text-xs text-muted-foreground hidden md:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-2 md:mx-4 rounded-full transition-all",
                    currentStep > step.number ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Completion percentage bar */}
      {completionPercentage !== undefined && (
        <div className="mt-4 md:mt-6 space-y-2">
          <Progress value={completionPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {completionPercentage}% complete
          </p>
        </div>
      )}
    </div>
  );
}
