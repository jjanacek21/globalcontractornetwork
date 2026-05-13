import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  LogOut, User, ArrowRight, Crown, DollarSign, Search, ClipboardCheck,
  GraduationCap, Megaphone, Settings, Users, Sparkles, Briefcase, MapPinned,
  Building2, Rocket, Construction, Lightbulb
} from "lucide-react";
import gcnLogo from "@/assets/gcn-logo.jpg";

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface ContractorProfile {
  id: string;
  company_name: string;
  category: string;
  subscription_status: string | null;
  is_verified: boolean | null;
  company_id: string | null;
}

interface CompanyMembership {
  companyId: string;
  companyName: string;
  role: string;
}

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

interface ServiceCard {
  icon: any;
  title: string;
  description: string;
  link?: string;
  badge?: string;
  comingSoon?: boolean;
  demoLink?: string;
}

const ServiceTile = ({ s, onClick, index }: { s: ServiceCard; onClick: () => void; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 24, rotateX: -8 }}
    animate={{ opacity: 1, y: 0, rotateX: 0 }}
    transition={{ duration: 0.55, delay: index * 0.05, ease: [0.175, 0.885, 0.32, 1.275] }}
    whileHover={s.comingSoon ? {} : { y: -8, rotateX: 2, rotateY: -2, scale: 1.02 }}
    style={{ transformStyle: "preserve-3d", perspective: 1000 }}
  >
    <Card
      onClick={s.comingSoon && !s.demoLink ? undefined : onClick}
      className={`relative overflow-hidden glass-card border-border/40 h-full ${
        s.comingSoon && !s.demoLink ? "opacity-70" : "cursor-pointer"
      }`}
      style={{
        boxShadow: "0 10px 30px -12px hsl(var(--primary) / 0.18), 0 4px 12px -6px hsl(var(--accent) / 0.12), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
      }}
    >
      {/* gradient halo */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 blur-3xl opacity-60" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-gradient-to-tr from-primary/30 to-accent/10 blur-3xl opacity-50" />

      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <motion.div
            whileHover={{ rotate: [0, -6, 6, 0], scale: 1.08 }}
            transition={{ duration: 0.6 }}
            className="h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg ring-1 ring-accent/40"
            style={{ boxShadow: "0 8px 20px -8px hsl(var(--primary) / 0.6), inset 0 1px 0 hsl(45 100% 80% / 0.4)" }}
          >
            <s.icon className="h-5 w-5" />
          </motion.div>
          {s.badge && (
            <Badge className="text-[10px] bg-gradient-to-r from-accent to-amber-300 text-accent-foreground border-0 shadow">
              {s.badge}
            </Badge>
          )}
          {s.comingSoon && <Badge variant="outline" className="text-[10px] border-accent/50 text-accent-foreground bg-accent/10">Coming Soon</Badge>}
        </div>
        <CardTitle className="text-lg mt-4 group-hover:text-primary transition-colors">{s.title}</CardTitle>
        <CardDescription className="leading-relaxed">{s.description}</CardDescription>
      </CardHeader>
      {!s.comingSoon && (
        <CardContent className="pt-0 relative">
          <div className="flex items-center text-sm font-medium text-primary gap-1.5 transition-all">
            Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      )}
      {s.comingSoon && s.demoLink && (
        <CardContent className="pt-0 relative">
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="inline-flex items-center text-sm font-medium text-primary gap-1.5 hover:underline cursor-pointer"
          >
            Try the Demo <ArrowRight className="h-4 w-4" />
          </button>
        </CardContent>
      )}
    </Card>
  </motion.div>
);

const MemberDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [contractorProfile, setContractorProfile] = useState<ContractorProfile | null>(null);
  const [companyMembership, setCompanyMembership] = useState<CompanyMembership | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("services");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/join");
        return;
      }
      try {
        const [{ data: profileData }, { data: contractorData }, { data: superAdminData }, { data: companyMemberData }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle(),
          supabase.from("contractor_profiles").select("*").eq("user_id", session.user.id).maybeSingle(),
          supabase.from("super_admins").select("id").eq("user_id", session.user.id).maybeSingle(),
          supabase.from("company_members").select("company_id, role, companies:company_id (name)").eq("user_id", session.user.id).eq("is_active", true).maybeSingle(),
        ]);
        if (profileData) setProfile(profileData as UserProfile);
        if (contractorData) setContractorProfile(contractorData as ContractorProfile);
        setIsSuperAdmin(!!superAdminData);
        if (companyMemberData) {
          setCompanyMembership({
            companyId: companyMemberData.company_id,
            companyName: (companyMemberData.companies as any)?.name || "Your Company",
            role: companyMemberData.role,
          });
          if (companyMemberData.role === "company_admin") setIsCompanyAdmin(true);
        }
        // Also check company_admins table
        const { data: companyAdminData } = await supabase
          .from("company_admins")
          .select("company_id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (companyAdminData) {
          setIsCompanyAdmin(true);
          if (!companyMemberData) {
            const { data: companyData } = await supabase
              .from("companies")
              .select("name")
              .eq("id", companyAdminData.company_id)
              .maybeSingle();
            setCompanyMembership({
              companyId: companyAdminData.company_id,
              companyName: (companyData as any)?.name || "Your Company",
              role: "company_admin",
            });
          }
        }
        setActiveTab("services");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.warn("signOut error (ignored):", err);
    }
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("sb-"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
    navigate("/", { replace: true });
  };

  const isContractor = !!contractorProfile;
  const isPendingContractor = isContractor && contractorProfile?.subscription_status === "pending";
  const profileRoute = (!isContractor && !isSuperAdmin) ? "/homeowner-profile" : "/my-profile";

  const contractorServices: ServiceCard[] = [
    { icon: DollarSign, title: "Estimating / Supplementing", description: "Professional estimates & insurance claim supplements", link: "/supplement-kings" },
    { icon: Megaphone, title: "Digital Marketing, Management & Design", description: "Social media, ads, SEO, web design & CRM support", link: "/digital-marketing" },
    { icon: Crown, title: "Permit Expediting", description: "Fast-track Florida building permits", link: "/permit-queens/dashboard" },
    { icon: GraduationCap, title: "Training Academy", description: "Certifications & business courses for pros", link: "/learning" },
    { icon: Search, title: "Directory", description: "Browse 500+ verified local contractors", link: "/directory" },
  ];

  const contractorApps: ServiceCard[] = [
    { icon: Users, title: "Contractor Social Hub", description: "Connect, message and post with the network", link: "/social", badge: "Coming Soon" },
    { icon: Briefcase, title: "Job Marketplace", description: "Browse and bid on homeowner job requests", link: "/job-board" },
    { icon: MapPinned, title: "Door to Door World", description: "GPS-tracked canvassing with gamified challenges", link: "/door-to-door" },
    { icon: Building2, title: "PropertyIQ", description: "Property intel reports, owner data & roof analysis", comingSoon: true, demoLink: "/ni/dashboard" },
    { icon: Lightbulb, title: "Referrals", description: "Earn bounties, manage your client pool, and track residuals.", link: "/dashboard/referrals" },
    { icon: Rocket, title: "GCN App", description: "Rep card, Measure, Estimate, Analyze, Pre-Cap, Proposals, Contract, Invoice", link: "https://globalcontractor.app", badge: "Premium" },
  ];

  const homeownerServices: ServiceCard[] = [
    { icon: Sparkles, title: "Instant Quote", description: "AI-powered estimates for roofing, windows, emergency, landscaping & cleaning", link: "/instant-quote" },
    { icon: Search, title: "Directory", description: "Browse 500+ verified local contractors", link: "/directory" },
    { icon: Briefcase, title: "Job Marketplace", description: "Post your project and browse what others are paying", link: "/homeowner/marketplace" },
    { icon: Crown, title: "Permit Expediting", description: "Fast-track Florida building permits for your property", link: "/permit-queens/dashboard" },
    { icon: ClipboardCheck, title: "Maintenance Membership", description: "Preventative maintenance & property care plans for property owners", link: "/maintenance-membership", badge: "Coming Soon" },
  ];

  const showAppsTab = isSuperAdmin || isContractor;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  const initials = `${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? ""}`.toUpperCase() || "M";
  const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Member";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient cinematic background */}
      <div className="floating-orb floating-orb-1" />
      <div className="floating-orb floating-orb-2" />
      <div className="floating-orb floating-orb-3" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-3">
          <motion.button
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(profileRoute)}
            className="flex items-center gap-3 group rounded-full pl-1 pr-4 py-1 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent border border-border/40 hover:border-accent/50 transition-all"
            aria-label="My Profile"
          >
            <div
              className="h-10 w-10 rounded-full bg-gradient-to-br from-primary via-primary/80 to-accent text-primary-foreground flex items-center justify-center text-sm font-bold ring-2 ring-accent/40 group-hover:ring-accent transition-all"
              style={{ boxShadow: "0 6px 16px -6px hsl(var(--primary) / 0.6), inset 0 1px 0 hsl(45 100% 80% / 0.5)" }}
            >
              {initials}
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-semibold leading-tight">{fullName}</span>
              <span className="text-[11px] text-muted-foreground leading-tight">My Profile</span>
            </div>
          </motion.button>

          <Link to="/" className="hidden md:flex items-center gap-2 group">
            <img src={gcnLogo} alt="GCN" className="h-8 w-auto rounded transition-transform group-hover:scale-105" />
            <span className="text-sm font-semibold gold-shimmer-text">Global Contractor Network</span>
          </Link>

          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin/auth")}>
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-border/60 backdrop-blur">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-10 space-y-10 relative">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-2"
        >
          <span className="text-sm text-accent font-semibold uppercase tracking-widest">{getTimeGreeting()}</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              {profile?.first_name || "Member"}
            </span>
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            {isContractor
              ? "Run your business — services from the network and the apps that power your day."
              : "Your property hub — instant quotes, trusted contractors, and the upcoming Maintenance Membership."}
          </p>
        </motion.div>

        {isPendingContractor && (
          <Card className="border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 glass-card">
            <CardContent className="pt-6 flex items-start gap-3">
              <Construction className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100">Application Under Review</p>
                <p className="text-sm text-amber-700 dark:text-amber-200/80">Your contractor application is being reviewed. You'll receive an email once approved.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3-tab nav */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full max-w-2xl ${showAppsTab ? 'grid-cols-3' : 'grid-cols-2'} h-12 p-1 glass-card border border-border/40 rounded-2xl`}>
            <TabsTrigger value="profile" className="rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
              <User className="h-4 w-4 mr-2" /> My Profile
            </TabsTrigger>
            <TabsTrigger value="services" className="rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
              <Briefcase className="h-4 w-4 mr-2" />
              {isSuperAdmin ? "All Services" : isContractor ? "Contractor Services" : "Services"}
            </TabsTrigger>
            {showAppsTab && (
              <TabsTrigger value="apps" className="rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
                <Rocket className="h-4 w-4 mr-2" />
                {isSuperAdmin ? "All Apps" : "Contractor Apps"}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Profile tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="glass-card border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> Profile Overview
                </CardTitle>
                <CardDescription>Your account info and quick actions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Name</p>
                    <p className="font-semibold">
                      {[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Email</p>
                    <p className="font-semibold break-all">{profile?.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Account Type</p>
                    <p className="font-semibold capitalize">
                      {isSuperAdmin ? "Super Admin" : isContractor ? "Contractor" : "Property Owner"}
                    </p>
                  </div>
                  {contractorProfile?.company_name && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Company</p>
                      <p className="font-semibold">{contractorProfile.company_name}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button onClick={() => navigate(profileRoute)} className="bg-gradient-to-r from-primary to-primary/80">
                    Edit Full Profile <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/forgot-password")}>
                    Reset Password
                  </Button>
                  {(isCompanyAdmin || isSuperAdmin) && (
                    <Button
                      onClick={() => navigate("/company/dashboard")}
                      className="bg-gradient-to-r from-accent to-amber-400 text-accent-foreground"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Manage Company{companyMembership?.companyName ? `: ${companyMembership.companyName}` : ""}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services tab */}
          <TabsContent value="services" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {isSuperAdmin ? "All Services (Admin View)" : isContractor ? "Contractor Services" : "Services"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isSuperAdmin
                  ? "Full admin access — every contractor and homeowner service."
                  : isContractor
                  ? "Services the Global Contractor Network offers to help your business grow."
                  : "Get a quote, find a verified contractor, or join the Maintenance Membership."}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(isSuperAdmin
                ? [...contractorServices, ...homeownerServices.filter(h => !contractorServices.some(c => c.title === h.title) && h.title !== "Job Marketplace" && h.title !== "Maintenance Membership")]
                : isContractor ? contractorServices : homeownerServices
              ).map((s, i) => (
                <ServiceTile key={s.title} s={s} index={i} onClick={() => handleTileClick(s)} />
              ))}
            </div>
          </TabsContent>

          {/* Apps tab — contractors & admins only */}
          {showAppsTab && (
            <TabsContent value="apps" className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {isSuperAdmin ? "All Apps (Admin View)" : "Contractor Apps"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isSuperAdmin
                    ? "Full admin access — every contractor app and property-owner program."
                    : "Tools to run your day-to-day business — and the all-in-one suite arriving in 2026."}
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {contractorApps.map((s, i) => (
                  <ServiceTile key={s.title} s={s} index={i} onClick={() => handleTileClick(s)} />
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {companyMembership && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card border-accent/30">
              <CardContent className="pt-6 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs uppercase tracking-wider text-accent font-semibold">Company</p>
                  <p className="font-semibold text-lg">{companyMembership.companyName}</p>
                  <p className="text-xs text-muted-foreground">Role: {companyMembership.role}</p>
                </div>
                <Button onClick={() => navigate("/company/dashboard")} className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
                  Manage Company <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default MemberDashboard;
