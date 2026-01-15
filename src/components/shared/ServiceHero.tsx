import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedServiceIcon } from "./AnimatedServiceIcon";

interface ServiceHeroProps {
  badge?: {
    icon?: LucideIcon;
    text: string;
  };
  title: ReactNode;
  highlightedText?: string;
  description: string;
  children?: ReactNode;
  stats?: Array<{
    value: string;
    label: string;
  }>;
  floatingIcons?: Array<{
    icon: LucideIcon;
    position: string;
    delay?: number;
    size?: "sm" | "md" | "lg";
  }>;
  className?: string;
}

export function ServiceHero({
  badge,
  title,
  highlightedText,
  description,
  children,
  stats,
  floatingIcons,
  className,
}: ServiceHeroProps) {
  return (
    <section className={cn("relative py-20 md:py-32 overflow-hidden", className)}>
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 dark:from-primary/10 dark:via-background dark:to-accent/10" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHptMC02aC0yVjZoMnYxMHptLTYgMjRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJWNmgydjEweiIvPjwvZz48L2c+PC9zdmc+')] opacity-50 dark:opacity-20" />

      {/* Floating icons */}
      {floatingIcons && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {floatingIcons.map((item, index) => (
            <AnimatedServiceIcon
              key={index}
              icon={item.icon}
              className={item.position}
              delay={item.delay || index * 0.5}
              size={item.size}
            />
          ))}
        </div>
      )}

      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          {/* Badge */}
          {badge && (
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
              {badge.icon && <badge.icon className="h-4 w-4" />}
              <span>{badge.text}</span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            {title}
            {highlightedText && (
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {" "}{highlightedText}
              </span>
            )}
          </h1>

          {/* Description */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>

          {/* CTA Buttons */}
          {children && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {children}
            </div>
          )}

          {/* Stats */}
          {stats && stats.length > 0 && (
            <div className={cn(
              "grid gap-8 pt-12 max-w-3xl mx-auto",
              stats.length <= 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4"
            )}>
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
