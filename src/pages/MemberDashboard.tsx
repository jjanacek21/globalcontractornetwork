import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Home, Building2, ShoppingBag, BookOpen, LogOut, User, 
  ArrowRight, CheckCircle2, Loader2, Crown, DollarSign, 
  AlertTriangle, Trees, Shield, Search, ClipboardCheck, 
  HardHat, DoorOpen, GraduationCap, X, Megaphone,
  Settings, Users, Sparkles, Lightbulb, ChevronRight, MessageCircle, ClipboardList, Briefcase
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import gcnLogo from "@/assets/gcn-logo.jpg";
import ReferralsDashboard from "@/components/referrals/ReferralsDashboard";
import { useHomeownerMessages } from "@/hooks/useHomeownerMessages";

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface NetworkMember {
  id: string;
  member_type: string;
  status: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
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

type ServiceCategory = "all" | "home" | "business" | "emergency" | "shopping" | "learning";

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const getCategoryGradientClass = (category: ServiceCategory) => {
  switch (category) {
    case "home": return "service-gradient-home";
    case "business": return "service-gradient-business";
    case "emergency": return "service-gradient-emergency";
    case "shopping": return "service-gradient-shopping";
    case "learning": return "service-gradient-learning";
    default: return "";
  }
};

const MemberDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [networkMember, setNetworkMember] = useState<NetworkMember | null>(null);
  const [contractorProfile, setContractorProfile] = useState<ContractorProfile | null>(null);
  const [companyMembership, setCompanyMembership] = useState<CompanyMembership | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>("all");
  const [homeownerUserId, setHomeownerUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch unread messages for non-contractors
  const { totalUnread } = useHomeownerMessages(homeownerUserId);

  useEffect(() => {
    checkSessionAndFetchData();
  }, []);

  const checkSessionAndFetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      navigate("/join");
      return;
    }

    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as UserProfile);
      }

      const { data: memberData } = await supabase
        .from("network_members")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (memberData) {
        setNetworkMember(memberData as NetworkMember);
      }

      const { data: contractorData } = await supabase
        .from("contractor_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (contractorData) {
        setContractorProfile(contractorData as ContractorProfile);
      } else if (memberData) {
        // Set userId for homeowner messages if not a contractor
        setHomeownerUserId(session.user.id);
      }

      const { data: superAdminData } = await supabase
        .from("super_admins")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      setIsSuperAdmin(!!superAdminData);

      // Fetch company membership for company admin access
      const { data: companyMemberData } = await supabase
        .from("company_members")
        .select(`
          company_id,
          role,
          companies:company_id (name)
        `)
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (companyMemberData) {
        const companyName = (companyMemberData.companies as any)?.name || "Your Company";
        setCompanyMembership({
          companyId: companyMemberData.company_id,
          companyName: companyName,
          role: companyMemberData.role
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isContractor = !!contractorProfile;
  const isPendingContractor = isContractor && contractorProfile?.subscription_status === "pending";
  const canSeeContractorServices = isContractor || isSuperAdmin;

  const contractorOnlyServices = [
    "Contractor Social Hub",
    "Training Academy", 
    "Estimating/Supplementing",
    "Permit Expediting",
    "Digital Marketing, Management & Design",
    "Job Marketplace"
  ];

  const services = [
    {
      icon: Search,
      title: "Contractor Directory",
      description: "Browse 500+ verified local contractors",
      link: "/directory",
      color: "bg-primary/10 text-primary",
      category: "business" as ServiceCategory
    },
    {
      icon: HardHat,
      title: "Roofing Services",
      description: "Full roof replacements, repairs & coatings",
      link: "/roofing-services",
      color: "bg-slate-600/10 text-slate-600",
      category: "home" as ServiceCategory
    },
    {
      icon: ClipboardCheck,
      title: "Maintenance Membership",
      description: "Preventative maintenance & property care plans",
      link: "/prep-property",
      color: "bg-teal-500/10 text-teal-600",
      category: "home" as ServiceCategory
    },
    {
      icon: Crown,
      title: "Permit Expediting",
      description: "Fast-track Florida building permits",
      link: "/permit-queens/dashboard",
      color: "bg-amber-500/10 text-amber-600",
      category: "business" as ServiceCategory
    },
    {
      icon: DollarSign,
      title: "Estimating/Supplementing",
      description: "Professional estimates & insurance claim supplements",
      link: "/supplement-kings",
      color: "bg-blue-600/10 text-blue-600",
      category: "business" as ServiceCategory
    },
    {
      icon: DoorOpen,
      title: "Windows & Doors",
      description: "Impact-rated windows & doors installation",
      link: "/green-home-solutions",
      color: "bg-green-600/10 text-green-600",
      category: "home" as ServiceCategory
    },
    {
      icon: AlertTriangle,
      title: "24/7 Emergency Services",
      description: "Water, fire & storm damage response",
      link: "/emergency-mitigation",
      color: "bg-red-600/10 text-red-600",
      category: "emergency" as ServiceCategory
    },
    {
      icon: Trees,
      title: "Tree Removal & Landscaping",
      description: "Professional tree removal, trimming & landscaping",
      link: "/northern-landscaping",
      color: "bg-green-700/10 text-green-700",
      category: "home" as ServiceCategory
    },
    {
      icon: GraduationCap,
      title: "Training Academy",
      description: "Certifications & business courses for pros",
      link: "/learning",
      color: "bg-indigo-500/10 text-indigo-600",
      category: "learning" as ServiceCategory
    },
    {
      icon: Megaphone,
      title: "Digital Marketing, Management & Design",
      description: "Social media, ads, SEO, web design & CRM support",
      link: "/digital-marketing",
      color: "bg-pink-500/10 text-pink-600",
      category: "business" as ServiceCategory
    },
    {
      icon: Users,
      title: "Contractor Social Hub",
      description: "Coming soon - Connect with contractors & network",
      link: "/social",
      color: "bg-indigo-600/10 text-indigo-600",
      category: "business" as ServiceCategory
    },
    {
      icon: Briefcase,
      title: "Job Marketplace",
      description: "Browse and bid on homeowner job requests",
      link: "/job-board",
      color: "bg-green-500/10 text-green-600",
      category: "business" as ServiceCategory
    }
  ];

  const categories: { value: ServiceCategory; label: string; icon: typeof Home }[] = [
    { value: "all", label: "All", icon: Sparkles },
    { value: "home", label: "Home", icon: Home },
    { value: "business", label: "Business", icon: Building2 },
    { value: "emergency", label: "Emergency", icon: AlertTriangle },
    { value: "shopping", label: "Shopping", icon: ShoppingBag },
    { value: "learning", label: "Learning", icon: BookOpen }
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || service.category === activeCategory;
    const isContractorOnly = contractorOnlyServices.includes(service.title);
    const hasAccess = !isContractorOnly || canSeeContractorServices;
    return matchesSearch && matchesCategory && hasAccess;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Floating Background Orbs */}
      <div className="floating-orb floating-orb-1" />
      <div className="floating-orb floating-orb-2" />
      <div className="floating-orb floating-orb-3" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full glass-card border-b">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-[hsl(45,100%,51%)] to-primary opacity-60" />
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img src={gcnLogo} alt="GCN Logo" className="h-10 w-auto rounded-lg transition-transform group-hover:scale-105" />
              <div className="absolute -inset-1 bg-primary/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight">Global Contractor Network</span>
              <span className="text-xs text-muted-foreground">Member Dashboard</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="avatar-ring w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-sm">
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-medium">{profile?.first_name} {profile?.last_name}</span>
                <div className="flex items-center gap-1">
                  {isContractor && (
                    <Badge variant={isPendingContractor ? "secondary" : "default"} className="text-[10px] h-4">
                      {isPendingContractor ? "Pending" : "Pro"}
                    </Badge>
                  )}
                  {networkMember && !isContractor && (
                    <Badge variant="outline" className="text-[10px] h-4">Owner</Badge>
                  )}
                </div>
              </div>
            </div>
            
            {isSuperAdmin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/admin/auth">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Admin Portal</TooltipContent>
              </Tooltip>
            )}
            
            <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container relative z-10 py-8 space-y-10">
        {/* Hero Welcome Section */}
        <div className="space-y-4 stagger-item stagger-delay-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary icon-float" />
            <span className="text-sm font-medium text-primary">{getTimeGreeting()}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Welcome back, <span className="gradient-text">{profile?.first_name || "Member"}</span>!
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {isContractor && !isPendingContractor 
              ? "Your Business Operating System — manage leads, referrals, and grow your network"
              : "Your Property Management Hub — access services, quotes, and trusted contractors"
            }
          </p>
        </div>

        {/* Pending Contractor Notice */}
        {isPendingContractor && (
          <Card className="border-amber-300/50 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 overflow-hidden stagger-item stagger-delay-2">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 animate-pulse" />
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center icon-float">
                  <Shield className="h-6 w-6 text-amber-600" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">Application Under Review</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-200/70">
                    Your contractor application is being reviewed. You'll receive an email once approved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats for Contractors */}
        {isContractor && !isPendingContractor && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card card-3d gradient-border stagger-item stagger-delay-2 stat-card-green">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</p>
                    <p className="text-xl font-bold">{contractorProfile?.company_name}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary icon-float" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card card-3d gradient-border stagger-item stagger-delay-3 stat-card-gold">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</p>
                    <p className="text-xl font-bold">{contractorProfile?.category}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Crown className="h-6 w-6 text-amber-500 icon-float" style={{ animationDelay: '0.5s' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card card-3d gradient-border stagger-item stagger-delay-4 stat-card-blue">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold">
                        {contractorProfile?.is_verified ? "Verified" : "Pending"}
                      </p>
                      {contractorProfile?.is_verified && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-blue-500 icon-float" style={{ animationDelay: '1s' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Admin Card */}
            {companyMembership?.role === "company_admin" && (
              <Card className="glass-card card-3d gradient-border stagger-item stagger-delay-5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company Role</p>
                      <p className="text-xl font-bold">Administrator</p>
                      <p className="text-xs text-muted-foreground">{companyMembership.companyName}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Settings className="h-6 w-6 text-purple-500 icon-float" style={{ animationDelay: '1.5s' }} />
                    </div>
                  </div>
              </CardContent>
            </Card>
            )}
          </div>
        )}

        {/* Referrals Section for Approved Contractors */}
        {isContractor && !isPendingContractor && contractorProfile && (
          <div className="stagger-item stagger-delay-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Referral Network</h2>
                <p className="text-sm text-muted-foreground">Identify opportunities, earn when jobs complete</p>
              </div>
            </div>
            <ReferralsDashboard contractorId={contractorProfile.id} />
          </div>
        )}

        {/* Services Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 stagger-item stagger-delay-3">
            <h2 className="text-2xl font-bold">Available Services</h2>
            <span className="text-sm text-muted-foreground">{filteredServices.length} services</span>
          </div>
          
          {/* Search and Filter */}
          <div className="space-y-4 stagger-item stagger-delay-4">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-11 h-11 rounded-full bg-muted/50 border-muted-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.value}
                    variant={activeCategory === cat.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(cat.value)}
                    className={`rounded-full transition-all ${
                      activeCategory === cat.value 
                        ? "shadow-lg shadow-primary/25 scale-105" 
                        : "hover:scale-105"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 mr-1.5" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <Card className="p-12 text-center glass-card">
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold text-lg">No services found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
                  className="rounded-full"
                >
                  Clear filters
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredServices.map((service, index) => (
                <Link
                  key={service.title}
                  to={service.link}
                  className={`group stagger-item stagger-delay-${Math.min(index + 5, 12)}`}
                >
                  <Card className={`h-full card-3d gradient-border glass-card ${getCategoryGradientClass(service.category)}`}>
                    <CardContent className="pt-6 pb-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${service.color} transition-transform group-hover:scale-110`}>
                          <service.icon className="h-7 w-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
                            {service.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                            {service.description}
                          </p>
                        </div>
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Contractor Tools Section */}
        {isContractor && !isPendingContractor && (
          <div className="stagger-item stagger-delay-8">
            <div className="rounded-2xl p-6 md:p-8 dark-section">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[hsl(45,100%,51%)]/20 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-[hsl(45,100%,51%)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Contractor Tools</h2>
                  <p className="text-sm text-white/60">Pro features for your business</p>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <Link to="/my-profile" className="group">
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[hsl(45,100%,51%)]/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[hsl(45,100%,51%)]/20 flex items-center justify-center">
                        <User className="h-6 w-6 text-[hsl(45,100%,51%)]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white group-hover:text-[hsl(45,100%,51%)] transition-colors">
                          My Profile
                        </h3>
                        <p className="text-sm text-white/60">View all your data & activity</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-white/40 group-hover:text-[hsl(45,100%,51%)] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>

                {/* Company Admin Dashboard Link */}
                {companyMembership?.role === "company_admin" && (
                  <Link to="/company/dashboard" className="group">
                    <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-400/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                          <Settings className="h-6 w-6 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                            Company Admin
                          </h3>
                          <p className="text-sm text-white/60">Manage {companyMembership.companyName}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-white/40 group-hover:text-purple-300 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            </div>
            </div>
          )}

          {/* Property Owner Tools Section - Show for non-contractors */}
          {!isContractor && networkMember && (
            <div className="stagger-item stagger-delay-8">
              <div className="rounded-2xl p-6 md:p-8 dark-section">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[hsl(45,100%,51%)]/20 flex items-center justify-center">
                    <Home className="h-5 w-5 text-[hsl(45,100%,51%)]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Property Owner Tools</h2>
                    <p className="text-sm text-white/60">Manage your projects & profile</p>
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-3 gap-4">
                  <Link 
                    to="/homeowner-profile" 
                    className="group flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[hsl(45,100%,51%)]/30 hover:bg-white/10 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[hsl(45,100%,51%)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <User className="h-6 w-6 text-[hsl(45,100%,51%)]" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">My Profile</p>
                      <p className="text-sm text-white/60">View & edit profile</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/40 ml-auto group-hover:text-[hsl(45,100%,51%)] group-hover:translate-x-1 transition-all" />
                  </Link>

                  <Link 
                    to="/homeowner-messages" 
                    className="group flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[hsl(45,100%,51%)]/30 hover:bg-white/10 transition-all relative"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform relative">
                      <MessageCircle className="h-6 w-6 text-blue-400" />
                      {totalUnread > 0 && (
                        <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                          {totalUnread}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white">My Messages</p>
                      <p className="text-sm text-white/60">Chat with contractors</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/40 ml-auto group-hover:text-[hsl(45,100%,51%)] group-hover:translate-x-1 transition-all" />
                  </Link>

                  <Link 
                    to="/homeowner-dashboard" 
                    className="group flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[hsl(45,100%,51%)]/30 hover:bg-white/10 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ClipboardList className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">My Projects</p>
                      <p className="text-sm text-white/60">Track your requests</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/40 ml-auto group-hover:text-[hsl(45,100%,51%)] group-hover:translate-x-1 transition-all" />
                  </Link>
                </div>
              </div>
            </div>
        )}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t z-40 md:hidden">
        <div className="container flex justify-around py-3">
          <Link to="/member/dashboard" className="flex flex-col items-center gap-1 text-primary">
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Dashboard</span>
          </Link>
          <Link to={isContractor ? "/my-profile" : "/homeowner-profile"} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">My Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default MemberDashboard;
