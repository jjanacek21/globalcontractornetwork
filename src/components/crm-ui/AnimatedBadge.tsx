import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  animation?: "none" | "pulse" | "bounce" | "glow";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const variantStyles = {
  default: "bg-muted text-muted-foreground border-border",
  success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-400",
  info: "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
};

const animationStyles = {
  none: "",
  pulse: "animate-pulse",
  bounce: "animate-bounce",
  glow: "animate-glow-pulse",
};

export const AnimatedBadge = ({
  children,
  variant = "default",
  animation = "none",
  size = "md",
  className,
}: AnimatedBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium transition-all",
        variantStyles[variant],
        sizeStyles[size],
        animationStyles[animation],
        className
      )}
    >
      {children}
    </span>
  );
};
