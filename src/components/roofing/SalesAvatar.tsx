import { cn } from "@/lib/utils";

interface SalesAvatarProps {
  speaking?: boolean;
  className?: string;
}

export const SalesAvatar = ({ speaking = false, className }: SalesAvatarProps) => {
  return (
    <div className={cn("relative", className)}>
      {/* Avatar container with glow effect */}
      <div className={cn(
        "relative w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg transition-all duration-300",
        speaking && "animate-pulse shadow-primary/50 shadow-xl"
      )}>
        {/* Face */}
        <div className="relative">
          {/* Eyes */}
          <div className="flex gap-4 mb-2">
            <div className="w-3 h-3 bg-white rounded-full relative">
              <div className="absolute w-1.5 h-1.5 bg-foreground rounded-full top-0.5 left-0.5" />
            </div>
            <div className="w-3 h-3 bg-white rounded-full relative">
              <div className="absolute w-1.5 h-1.5 bg-foreground rounded-full top-0.5 left-0.5" />
            </div>
          </div>
          {/* Mouth */}
          <div className={cn(
            "w-8 h-3 bg-white rounded-full mx-auto transition-all duration-200",
            speaking && "h-4 rounded-[50%]"
          )} />
        </div>
        
        {/* Hard hat */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-10 bg-yellow-400 rounded-t-full border-b-4 border-yellow-500" />
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-28 h-3 bg-yellow-500 rounded-full" />
      </div>
      
      {/* Sound waves when speaking */}
      {speaking && (
        <>
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-2 h-8 flex flex-col gap-1">
            <div className="w-full h-1 bg-primary/60 rounded animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-full h-2 bg-primary/80 rounded animate-pulse" style={{ animationDelay: '100ms' }} />
            <div className="w-full h-1 bg-primary/60 rounded animate-pulse" style={{ animationDelay: '200ms' }} />
          </div>
        </>
      )}
    </div>
  );
};
