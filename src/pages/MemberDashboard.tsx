import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  LogOut, User, ArrowRight, Crown, DollarSign, Search, ClipboardCheck,
  GraduationCap, Megaphone, Settings, Users, Sparkles, Briefcase, MapPinned,
  Building2, Rocket, Construction
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
}

const ServiceTile = ({ s, onClick }: { s: ServiceCard; onClick: () => void }) => (
  <Card
    onClick={s.comingSoon ? undefined : onClick}
    className={`group transition-all ${
      s.comingSoon ? "opacity-70" : "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
    }`}
  >
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <s.icon className="h-5 w-5 text-primary" />
        </div>
        {s.badge && <Badge variant="secondary" className="text-[10px]">{s.badge}</Badge>}
        {s.comingSoon && <Badge variant="outline" className="text-[10px]">Coming Soon</Badge>}
      </div>
      <CardTitle className="text-lg mt-3">{s.title}</CardTitle>
      <CardDescription>{s.description}</CardDescription>
    </CardHeader>
    {!s.comingSoon && (
      <CardContent className="pt-0">
        <div className="flex items-center text-sm text-primary group-hover:gap-2 gap-1 transition-all">
          Open <ArrowRight className="h-4 w-4" />
        </div>
      </CardContent>
    )}
  </Card>
);

const MemberDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [contractorProfile, setContractorProfile] = useState<ContractorProfile | null>(null);
  const [companyMembership, setCompanyMembership] = useState<CompanyMembership | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
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
        }
        // default tab: contractors -> services, homeowners -> services (with homeowner-only items)
        setActiveTab("services");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isContractor = !!contractorProfile;
  const isPendingContractor = isContractor && contractorProfile?.subscription_status === "pending";
  const isCompanyAdmin = !!companyMembership && ["company_admin", "owner", "admin"].includes(companyMembership.role);
  const canManageCompany = isCompanyAdmin || isSuperAdmin;

  // Contractor Services tab
  const contractorServices: ServiceCard[] = [
    { icon: DollarSign, title: "Estimating / Supplementing", description: "Professional estimates & insurance claim supplements", link: "/supplement-kings" },
    { icon: Megaphone, title: "Digital Marketing, Management & Design", description: "Social media, ads, SEO, web design & CRM support", link: "/digital-marketing" },
    { icon: Crown, title: "Permit Expediting", description: "Fast-track Florida building permits", link: "/permit-queens/dashboard" },
    { icon: GraduationCap, title: "Training Academy", description: "Certifications & business courses for pros", link: "/learning" },
    { icon: Search, title: "Directory", description: "Browse 500+ verified local contractors", link: "/directory" },
  ];

  // Contractor Apps tab
  const contractorApps: ServiceCard[] = [
    { icon: Users, title: "Contractor Social Hub", description: "Connect, message and post with the network", link: "/social", badge: "Coming Soon" },
    { icon: Briefcase, title: "Job Marketplace", description: "Browse and bid on homeowner job requests", link: "/job-board" },
    { icon: MapPinned, title: "Door to Door World", description: "GPS-tracked canvassing with gamified challenges", link: "/door-to-door" },
    { icon: Building2, title: "PropertyIQ", description: "Property intel reports, owner data & roof analysis", link: "/property-iq" },
    { icon: Rocket, title: "GCN Business Suite", description: "Estimating, invoicing, contracts, prospecting, gamification, social & marketplace — all in one.", comingSoon: true },
  ];

  // Homeowner-only services (shown to non-contractors instead of Contractor Apps tab)
  const homeownerServices: ServiceCard[] = [
    { icon: Sparkles, title: "Instant Quote", description: "AI-powered estimates for roofing, windows, emergency, landscaping & cleaning", link: "/instant-quote" },
    { icon: Search, title: "Directory", description: "Browse 500+ verified local contractors", link: "/directory" },
    { icon: ClipboardCheck, title: "Maintenance Membership", description: "Preventative maintenance & property care plans for property owners", link: "/maintenance-membership", badge: "Coming Soon" },
  ];

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-3">
          {/* Profile Button — top-left, primary entry */}
          <button
            onClick={() => navigate("/my-profile")}
            className="flex items-center gap-3 group rounded-full pl-1 pr-3 py-1 hover:bg-muted transition-colors"
            aria-label="My Profile"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-sm font-semibold ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-medium leading-tight">{fullName}</span>
              <span className="text-[11px] text-muted-foreground leading-tight">My Profile</span>
            </div>
          </button>

          <Link to="/" className="hidden md:flex items-center gap-2">
            <img src={gcnLogo} alt="GCN" className="h-8 w-auto rounded" />
            <span className="text-sm font-semibold">Global Contractor Network</span>
          </Link>

          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin/auth")}>
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Welcome */}
        <div className="space-y-2">
          <span className="text-sm text-primary font-medium">{getTimeGreeting()}</span>
          <h1 className="text-3xl md:text-4xl font-bold">
            Welcome back, <span className="text-primary">{profile?.first_name || "Member"}</span>
          </h1>
          <p className="text-muted-foreground">
            {isContractor
              ? "Run your business — services from the network and the apps that power your day."
              : "Your property hub — instant quotes, trusted contractors, and the upcoming Maintenance Membership."}
          </p>
        </div>

        {isPendingContractor && (
          <Card className="border-amber-300/50 bg-amber-50 dark:bg-amber-950/20">
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
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="profile" onClick={() => navigate("/my-profile")}>
              <User className="h-4 w-4 mr-2" /> My Profile
            </TabsTrigger>
            <TabsTrigger value="services">
              <Briefcase className="h-4 w-4 mr-2" />
              {isContractor ? "Contractor Services" : "Services"}
            </TabsTrigger>
            <TabsTrigger value="apps">
              <Rocket className="h-4 w-4 mr-2" />
              {isContractor ? "Contractor Apps" : "For Property Owners"}
            </TabsTrigger>
          </TabsList>

          {/* Services tab */}
          <TabsContent value="services" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-1">
                {isContractor ? "Contractor Services" : "Services"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isContractor
                  ? "Services the Global Contractor Network offers to help your business grow."
                  : "Get a quote, find a verified contractor, or join the Maintenance Membership."}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(isContractor ? contractorServices : homeownerServices).map((s) => (
                <ServiceTile key={s.title} s={s} onClick={() => s.link && navigate(s.link)} />
              ))}
            </div>
          </TabsContent>

          {/* Apps tab */}
          <TabsContent value="apps" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-1">
                {isContractor ? "Contractor Apps" : "For Property Owners"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isContractor
                  ? "Tools to run your day-to-day business — and the all-in-one suite arriving in 2026."
                  : "Property-owner exclusive features and programs."}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(isContractor ? contractorApps : homeownerServices.filter(s => s.title !== "Directory")).map((s) => (
                <ServiceTile key={s.title} s={s} onClick={() => s.link && navigate(s.link)} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {companyMembership && (
          <Card className="bg-muted/40">
            <CardContent className="pt-6 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Company</p>
                <p className="font-semibold">{companyMembership.companyName}</p>
                <p className="text-xs text-muted-foreground">Role: {companyMembership.role}</p>
              </div>
              <Button variant="outline" onClick={() => navigate("/company/dashboard")}>
                Manage Company <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default MemberDashboard;
