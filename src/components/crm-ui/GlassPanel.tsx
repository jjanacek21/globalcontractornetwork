import React from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  blur?: "sm" | "md" | "lg";
  opacity?: number;
  glowBorder?: boolean;
}

const blurMap = {
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
};

export const GlassPanel = ({
  children,
  className,
  blur = "md",
  opacity = 0.8,
  glowBorder = false,
}: GlassPanelProps) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/30",
        blurMap[blur],
        glowBorder && "animate-glass-glow",
        className
      )}
      style={{
        backgroundColor: `hsl(var(--card) / ${opacity})`,
      }}
    >
      {children}
    </div>
  );
};
