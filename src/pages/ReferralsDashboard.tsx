import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCurrentContractor } from "@/hooks/referrals/useCurrentContractor";
import { OverviewTab } from "@/components/referrals/tabs/OverviewTab";
import { PartnersTab } from "@/components/referrals/tabs/PartnersTab";
import { BountyTiersTab } from "@/components/referrals/tabs/BountyTiersTab";
import { MyClientsTab } from "@/components/referrals/tabs/MyClientsTab";
import { SentTab } from "@/components/referrals/tabs/SentTab";
import { ReceivedTab } from "@/components/referrals/tabs/ReceivedTab";
import { PayoutsTab } from "@/components/referrals/tabs/PayoutsTab";
import { AvailableReferralsTab } from "@/components/referrals/tabs/AvailableReferralsTab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "available", label: "Available Referrals" },
  { id: "partners", label: "Referral Partners" },
  { id: "tiers", label: "My Bounty Tiers" },
  { id: "clients", label: "My Clients" },
  { id: "sent", label: "Sent" },
  { id: "received", label: "Received" },
  { id: "payouts", label: "Payouts" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function ReferralsDashboard() {
  const [tab, setTab] = useState<TabId>("overview");
  const { data: contractor, isLoading } = useCurrentContractor();

  return (
    <div className="referrals-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/member/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
            style={{ color: "var(--r-green-deep)" }}
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>

        {/* Hero */}
        <div className="brand-card brand-card-cream p-6 sm:p-8 mb-6 relative overflow-hidden">
          <div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none opacity-50"
            style={{ background: "radial-gradient(circle, rgba(201,162,74,0.35) 0%, transparent 70%)" }}
          />
          <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--r-muted)" }}>
            Welcome back{contractor?.company_name ? `, ${contractor.company_name}` : ""}
          </div>
          <h1 className="mt-2 font-serif-display text-3xl sm:text-5xl font-semibold leading-tight" style={{ color: "var(--r-green-deep)" }}>
            Trusted referrals. <span className="italic gold-shine">Real residuals.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base" style={{ color: "var(--r-muted)" }}>
            Refer customers across the network, set your own bounty schedule, and earn lifetime residuals on every client you bring in.
          </p>
        </div>

        {/* Tab nav */}
        <div className="brand-card p-2 mb-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className="px-4 py-2 rounded-[8px] text-sm font-semibold whitespace-nowrap transition-colors"
                style={
                  tab === t.id
                    ? { background: "var(--r-green-deep)", color: "var(--r-cream)" }
                    : { color: "var(--r-green-deep)" }
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab body */}
        {isLoading || !contractor ? (
          <div className="brand-card p-10 text-center" style={{ color: "var(--r-muted)" }}>
            Loading your referral dashboard…
          </div>
        ) : (
          <>
            {tab === "overview" && <OverviewTab contractor={contractor} />}
            {tab === "partners" && <PartnersTab contractor={contractor} />}
            {tab === "tiers" && <BountyTiersTab contractor={contractor} />}
            {tab === "clients" && <MyClientsTab contractor={contractor} />}
            {tab === "sent" && <SentTab contractor={contractor} />}
            {tab === "received" && <ReceivedTab contractor={contractor} />}
            {tab === "payouts" && <PayoutsTab contractor={contractor} />}
          </>
        )}
      </div>
    </div>
  );
}
