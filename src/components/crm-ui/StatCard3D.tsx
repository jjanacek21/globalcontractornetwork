import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card3D } from "./Card3D";

interface StatCard3DProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  trend?: {
    direction: "up" | "down";
    value: number;
  };
  color?: "primary" | "accent" | "success" | "warning" | "danger";
  className?: string;
}

const colorVariants = {
  primary: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    trendUp: "text-emerald-500",
    trendDown: "text-red-500",
  },
  accent: {
    iconBg: "bg-accent/20",
    iconColor: "text-accent-foreground",
    trendUp: "text-emerald-500",
    trendDown: "text-red-500",
  },
  success: {
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    trendUp: "text-emerald-500",
    trendDown: "text-red-500",
  },
  warning: {
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    trendUp: "text-emerald-500",
    trendDown: "text-red-500",
  },
  danger: {
    iconBg: "bg-red-500/10",
    iconColor: "text-red-500",
    trendUp: "text-emerald-500",
    trendDown: "text-red-500",
  },
};

export const StatCard3D = ({
  title,
  value,
  prefix = "",
  suffix = "",
  icon: Icon,
  trend,
  color = "primary",
  className,
}: StatCard3DProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const colors = colorVariants[color];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animateValue();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  const animateValue = () => {
    const duration = 1000;
    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(startValue + (value - startValue) * easeOutQuart);
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  const formatValue = (val: number) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + "M";
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(1) + "K";
    }
    return val.toLocaleString();
  };

  return (
    <div ref={cardRef}>
      <Card3D glassEffect className={cn("p-6", className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-foreground animate-count-up">
                {prefix}{formatValue(displayValue)}{suffix}
              </span>
            </div>
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                trend.direction === "up" ? colors.trendUp : colors.trendDown
              )}>
                {trend.direction === "up" ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{trend.value}%</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
          <div className={cn(
            "rounded-xl p-3 animate-icon-float",
            colors.iconBg
          )}>
            <Icon className={cn("h-6 w-6", colors.iconColor)} />
          </div>
        </div>
      </Card3D>
    </div>
  );
};
