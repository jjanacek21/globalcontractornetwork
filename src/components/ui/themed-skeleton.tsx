import { cn } from "@/lib/utils";

interface ThemedSkeletonProps {
  className?: string;
  variant?: "default" | "card" | "text" | "avatar" | "button";
}

function ThemedSkeleton({ className, variant = "default" }: ThemedSkeletonProps) {
  const baseClasses = "animate-pulse rounded-md bg-primary/10 dark:bg-primary/20";
  
  const variantClasses = {
    default: "",
    card: "h-32 w-full",
    text: "h-4 w-full",
    avatar: "h-10 w-10 rounded-full",
    button: "h-10 w-24",
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)} />
  );
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card p-6 space-y-4", className)}>
      <div className="flex items-center gap-4">
        <ThemedSkeleton variant="avatar" />
        <div className="space-y-2 flex-1">
          <ThemedSkeleton className="h-4 w-1/3" />
          <ThemedSkeleton className="h-3 w-1/2" />
        </div>
      </div>
      <ThemedSkeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <ThemedSkeleton variant="button" />
        <ThemedSkeleton variant="button" className="w-20" />
      </div>
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-border/50 bg-muted/30">
        <ThemedSkeleton className="h-4 w-24" />
        <ThemedSkeleton className="h-4 w-32" />
        <ThemedSkeleton className="h-4 w-28" />
        <ThemedSkeleton className="h-4 w-20 ml-auto" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-border/30 last:border-0">
          <ThemedSkeleton className="h-4 w-24" />
          <ThemedSkeleton className="h-4 w-32" />
          <ThemedSkeleton className="h-4 w-28" />
          <ThemedSkeleton className="h-4 w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <ThemedSkeleton className="h-4 w-20" />
        <ThemedSkeleton variant="avatar" className="h-8 w-8" />
      </div>
      <ThemedSkeleton className="h-8 w-24" />
      <ThemedSkeleton className="h-3 w-16" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TableSkeleton rows={5} />
        </div>
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}

function WizardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex gap-4 justify-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <ThemedSkeleton className="h-8 w-8 rounded-full" />
            <ThemedSkeleton className="h-3 w-16 hidden md:block" />
          </div>
        ))}
      </div>
      
      {/* Form Card */}
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-6 max-w-2xl mx-auto">
        <div className="space-y-2">
          <ThemedSkeleton className="h-6 w-48" />
          <ThemedSkeleton className="h-4 w-72" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <ThemedSkeleton className="h-4 w-24" />
            <ThemedSkeleton className="h-12 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <ThemedSkeleton className="h-4 w-20" />
              <ThemedSkeleton className="h-12 w-full" />
            </div>
            <div className="space-y-2">
              <ThemedSkeleton className="h-4 w-20" />
              <ThemedSkeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
        <div className="flex justify-between pt-4">
          <ThemedSkeleton variant="button" className="w-24" />
          <ThemedSkeleton variant="button" className="w-32" />
        </div>
      </div>
    </div>
  );
}

export { 
  ThemedSkeleton, 
  CardSkeleton, 
  TableSkeleton, 
  StatCardSkeleton, 
  DashboardSkeleton, 
  WizardSkeleton 
};
