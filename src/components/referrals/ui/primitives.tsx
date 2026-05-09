import { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function GreenButton3D({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "green-3d-btn inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function GoldText3D({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("gold-text-3d font-serif-display", className)}>{children}</span>;
}

type Tier = "bronze" | "silver" | "gold" | "platinum";
export function TierBadge({ tier }: { tier: Tier }) {
  return <span className={`tier-badge tier-${tier}`}>{tier}</span>;
}

type PillVariant = "green" | "gold" | "amber" | "rose" | "muted";
export function Pill({ variant = "green", children }: { variant?: PillVariant; children: ReactNode }) {
  return <span className={`pill pill-${variant}`}>{children}</span>;
}

export function BrandCard({
  children,
  cream = false,
  className,
}: {
  children: ReactNode;
  cream?: boolean;
  className?: string;
}) {
  return <div className={cn("brand-card p-5", cream && "brand-card-cream", className)}>{children}</div>;
}

export function KPICard({
  label,
  value,
  sublabel,
  icon,
  delay = 0,
  goldValue = false,
}: {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  icon?: ReactNode;
  delay?: number;
  goldValue?: boolean;
}) {
  return (
    <BrandCard className="relative overflow-hidden">
      {icon && (
        <div
          className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center float-chip"
          style={{
            background: "linear-gradient(180deg,#F4D98A,#C9A24A)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 10px rgba(142,111,42,0.3)",
            color: "#3a2a08",
            animationDelay: `${delay}s`,
          }}
        >
          {icon}
        </div>
      )}
      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--r-muted)" }}>
        {label}
      </div>
      <div className={cn("mt-2 text-3xl font-bold font-serif-display", goldValue && "gold-text-3d")}
        style={!goldValue ? { color: "var(--r-green-deep)" } : undefined}
      >
        {value}
      </div>
      {sublabel && <div className="mt-1 text-xs" style={{ color: "var(--r-muted)" }}>{sublabel}</div>}
    </BrandCard>
  );
}

export function BrandSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md", className)}
      style={{ background: "var(--r-cream-3)" }}
    />
  );
}

export function StatusPill({ status }: { status: string }) {
  if (status === "won") return <Pill variant="green">Closed Won</Pill>;
  if (status === "in_progress") return <Pill variant="amber">In Progress</Pill>;
  if (status === "lost") return <Pill variant="rose">Lost</Pill>;
  if (status === "expired") return <Pill variant="muted">Expired</Pill>;
  return <Pill variant="muted">{status}</Pill>;
}

export function fmtMoney(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
