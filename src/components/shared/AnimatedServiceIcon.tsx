import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedServiceIconProps {
  icon: LucideIcon;
  className?: string;
  size?: "sm" | "md" | "lg";
  delay?: number;
  variant?: "primary" | "accent" | "muted";
}

export function AnimatedServiceIcon({
  icon: Icon,
  className,
  size = "md",
  delay = 0,
  variant = "primary",
}: AnimatedServiceIconProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  const variantClasses = {
    primary: "text-primary/30 dark:text-primary/40",
    accent: "text-accent/40",
    muted: "text-muted-foreground/20",
  };

  return (
    <div
      className={cn(
        "absolute pointer-events-none",
        "animate-float-icon",
        className
      )}
      style={{
        animationDelay: `${delay}s`,
        animationDuration: "6s",
      }}
    >
      <Icon
        className={cn(
          sizeClasses[size],
          variantClasses[variant],
          "drop-shadow-lg transition-colors"
        )}
      />
    </div>
  );
}

// Add the keyframes to index.css or use this inline style component
export function FloatingIconsBackground({
  icons,
}: {
  icons: { icon: LucideIcon; position: string; delay?: number; size?: "sm" | "md" | "lg" }[];
}) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map((item, index) => (
        <AnimatedServiceIcon
          key={index}
          icon={item.icon}
          className={item.position}
          delay={item.delay || index * 0.5}
          size={item.size}
        />
      ))}
    </div>
  );
}
