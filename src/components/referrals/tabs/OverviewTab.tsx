import { useOverviewStats, useActivityFeed, useTopPartners } from "@/hooks/referrals";
import { BrandCard, GoldText3D, KPICard, TierBadge, BrandSkeleton, fmtMoney } from "@/components/referrals/ui/primitives";
import { DollarSign, Clock, Users, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatDistanceToNow } from "date-fns";

const ICONS: Record<string, JSX.Element> = {
  check: <span>✓</span>, dollar: <span>$</span>, star: <span>★</span>,
  arrow: <span>→</span>, alert: <span>!</span>, plus: <span>+</span>,
};

export function OverviewTab({ contractor }: { contractor: any }) {
  const { data: stats, isLoading } = useOverviewStats(contractor?.id);
  const { data: activity } = useActivityFeed(contractor?.id);
  const { data: topPartners } = useTopPartners(contractor?.id);

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <BrandSkeleton key={i} className="h-32" />)}
      </div>
    );
  }

  const score = stats.score;
  const scoreNum = score?.score ?? 0;
  const tier = (score?.tier ?? "bronze") as "bronze" | "silver" | "gold" | "platinum";
  const residualRate = Number(score?.residual_rate ?? 1.5);
  const nextTarget = scoreNum >= 90 ? null : scoreNum >= 70 ? 90 : scoreNum >= 40 ? 70 : 40;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Lifetime Earned" value={fmtMoney(stats.lifetimeEarned)}
          sublabel={`+${fmtMoney(stats.thisMonth)} this month`}
          icon={<DollarSign className="w-5 h-5" />} delay={0} />
        <KPICard label="Pending Payouts" value={fmtMoney(stats.escrow)}
          sublabel={`${stats.pendingRefs} active referrals`}
          icon={<Clock className="w-5 h-5" />} delay={0.5} />
        <KPICard label="Client Pool" value={stats.poolCount}
          sublabel={`${stats.poolActive} active in network`}
          icon={<Users className="w-5 h-5" />} delay={1} />
        <KPICard label="Contractor Score" value={scoreNum} goldValue
          sublabel={<span><TierBadge tier={tier} /> · {residualRate}% residuals</span>}
          icon={<Award className="w-5 h-5" />} delay={1.5} />
      </div>

      {/* Score breakdown + Earnings chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BrandCard className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--r-muted)" }}>Contractor Score</div>
            <TierBadge tier={tier} />
          </div>
          <div className="flex justify-center my-4">
            <svg width="170" height="170" viewBox="0 0 170 170">
              <circle cx="85" cy="85" r="72" fill="none" stroke="var(--r-cream-3)" strokeWidth="14" />
              <circle cx="85" cy="85" r="72" fill="none" stroke="url(#goldGrad)" strokeWidth="14" strokeLinecap="round"
                strokeDasharray="452" strokeDashoffset={452 * (1 - scoreNum / 100)}
                transform="rotate(-90 85 85)" />
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F4D98A" /><stop offset="50%" stopColor="#C9A24A" /><stop offset="100%" stopColor="#8E6F2A" />
                </linearGradient>
              </defs>
              <text x="85" y="92" textAnchor="middle" fontSize="38" fontWeight="700" fontFamily="Fraunces, serif" fill="#8E6F2A">{scoreNum}</text>
            </svg>
          </div>
          <div className="space-y-3">
            {[
              { label: "Quality of Work", val: score?.quality ?? 0, max: 30 },
              { label: "Referrals Given", val: score?.refs_given ?? 0, max: 25 },
              { label: "Referrals Completed", val: score?.refs_completed ?? 0, max: 25 },
              { label: "On-Time + NPS", val: score?.ontime_nps ?? 0, max: 20 },
            ].map(r => (
              <div key={r.label}>
                <div className="flex justify-between text-xs mb-1" style={{ color: "var(--r-ink)" }}>
                  <span>{r.label}</span>
                  <span style={{ color: "var(--r-muted)" }}>{r.val}/{r.max}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--r-cream-3)" }}>
                  <div className="h-full" style={{
                    width: `${Math.min(100, (r.val / r.max) * 100)}%`,
                    background: "linear-gradient(90deg,#F4D98A,#C9A24A,#8E6F2A)",
                  }} />
                </div>
              </div>
            ))}
          </div>
          {nextTarget && (
            <div className="mt-4 brand-card-cream rounded-lg p-3 text-xs"
              style={{ border: "1px solid rgba(201,162,74,0.4)", color: "var(--r-green-deep)" }}>
              <strong>Next: {nextTarget >= 90 ? "Platinum" : nextTarget >= 70 ? "Gold" : "Silver"} ({nextTarget}+)</strong> — {nextTarget - scoreNum} more points unlocks higher residuals.
            </div>
          )}
        </BrandCard>

        <BrandCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-serif-display text-lg font-semibold" style={{ color: "var(--r-green-deep)" }}>Earnings · Last 6 Months</div>
              <div className="text-xs" style={{ color: "var(--r-muted)" }}>Outbound bonuses + residuals from your client pool</div>
            </div>
            <div className="flex gap-2">
              <span className="pill pill-green">Bonuses</span>
              <span className="pill pill-gold">Residuals</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chart}>
                <XAxis dataKey="month" stroke="var(--r-muted)" fontSize={12} />
                <YAxis stroke="var(--r-muted)" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: "var(--r-paper)", border: "1px solid var(--r-line)", borderRadius: 10 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="bonuses" stackId="a" fill="#1F4D32" name="Bonuses" radius={[0, 0, 0, 0]} />
                <Bar dataKey="residuals" stackId="a" fill="#C9A24A" name="Residuals" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BrandCard>
      </div>

      {/* Activity + Top partners */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BrandCard className="lg:col-span-2">
          <div className="font-serif-display text-lg font-semibold mb-4" style={{ color: "var(--r-green-deep)" }}>Recent Activity</div>
          {(!activity || activity.length === 0) ? (
            <div className="text-sm py-8 text-center" style={{ color: "var(--r-muted)" }}>No activity yet — start by referring a customer.</div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--r-line)" }}>
              {activity.map((a: any) => (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    a.color_token === "gold" ? "tier-gold" : a.color_token === "amber" ? "pill-amber" : "pill-green"
                  }`}>{ICONS[a.icon_token] ?? "•"}</div>
                  <div className="flex-1 text-sm" style={{ color: "var(--r-ink)" }} dangerouslySetInnerHTML={{ __html: a.message_html }} />
                  <div className="text-xs" style={{ color: "var(--r-muted)" }}>{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</div>
                </li>
              ))}
            </ul>
          )}
        </BrandCard>

        <BrandCard>
          <div className="font-serif-display text-lg font-semibold mb-4" style={{ color: "var(--r-green-deep)" }}>Top Earning Partners</div>
          {(!topPartners || topPartners.length === 0) ? (
            <div className="text-sm py-6 text-center" style={{ color: "var(--r-muted)" }}>No closed referrals yet.</div>
          ) : (
            <ul className="space-y-3">
              {topPartners.map((p: any) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-semibold" style={{ color: "var(--r-green-deep)" }}>{p.company_name}</div>
                    <div className="text-xs" style={{ color: "var(--r-muted)" }}>{p.category}</div>
                  </div>
                  <GoldText3D className="font-bold">{fmtMoney(p.total)}</GoldText3D>
                </li>
              ))}
            </ul>
          )}
        </BrandCard>
      </div>
    </div>
  );
}
