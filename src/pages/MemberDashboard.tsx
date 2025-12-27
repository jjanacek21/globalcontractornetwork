import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Home, Building2, ShoppingBag, BookOpen, LogOut, User, 
  ArrowRight, CheckCircle2, Loader2, Crown, DollarSign, 
  AlertTriangle, Trees, Shield, Search, ClipboardCheck, 
  Paintbrush, HardHat, DoorOpen, GraduationCap, X
} from "lucide-react";
import gcnLogo from "@/assets/gcn-logo.jpg";

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
}

type ServiceCategory = "all" | "home" | "business" | "emergency" | "shopping" | "learning";

const MemberDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [networkMember, setNetworkMember] = useState<NetworkMember | null>(null);
  const [contractorProfile, setContractorProfile] = useState<ContractorProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>("all");
  const navigate = useNavigate();
  const { toast } = useToast();

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
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as UserProfile);
      }

      // Fetch network member record
      const { data: memberData } = await supabase
        .from("network_members")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (memberData) {
        setNetworkMember(memberData as NetworkMember);
      }

      // Fetch contractor profile if exists
      const { data: contractorData } = await supabase
        .from("contractor_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (contractorData) {
        setContractorProfile(contractorData as ContractorProfile);
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
      icon: Paintbrush,
      title: "Roof Coatings",
      description: "Silicone & acrylic roof coating services",
      link: "/coating-kings",
      color: "bg-orange-500/10 text-orange-600",
      category: "home" as ServiceCategory
    },
    {
      icon: HardHat,
      title: "Roofing Services",
      description: "Full roof replacements & repairs",
      link: "/roofing",
      color: "bg-slate-600/10 text-slate-600",
      category: "home" as ServiceCategory
    },
    {
      icon: ClipboardCheck,
      title: "Property Inspections",
      description: "Pre-sale & maintenance inspections",
      link: "/prep-property",
      color: "bg-teal-500/10 text-teal-600",
      category: "home" as ServiceCategory
    },
    {
      icon: Crown,
      title: "Permit Expediting",
      description: "Fast-track Florida building permits",
      link: "/permit-queens",
      color: "bg-amber-500/10 text-amber-600",
      category: "business" as ServiceCategory
    },
    {
      icon: DollarSign,
      title: "Insurance Supplements",
      description: "Maximize your insurance claim payouts",
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
      icon: ShoppingBag,
      title: "GCN Merch Store",
      description: "Apparel, gear & tools for contractors",
      link: "/store",
      color: "bg-purple-500/10 text-purple-600",
      category: "shopping" as ServiceCategory
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
      icon: Building2,
      title: "CRM Portal",
      description: "Manage leads, contacts, and customer relationships",
      link: "/crm/auth",
      color: "bg-cyan-500/10 text-cyan-600",
      category: "business" as ServiceCategory
    }
  ];

  const categories: { value: ServiceCategory; label: string }[] = [
    { value: "all", label: "All" },
    { value: "home", label: "Home" },
    { value: "business", label: "Business" },
    { value: "emergency", label: "Emergency" },
    { value: "shopping", label: "Shopping" },
    { value: "learning", label: "Learning" }
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || service.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={gcnLogo} alt="GCN Logo" className="h-10 w-auto" />
            <div className="flex flex-col">
              <span className="text-lg font-bold">Global Contractor Network</span>
              <span className="text-xs text-muted-foreground">Member Dashboard</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span>{profile?.first_name} {profile?.last_name}</span>
              {isContractor && (
                <Badge variant={isPendingContractor ? "secondary" : "default"}>
                  {isPendingContractor ? "Pending" : "Contractor"}
                </Badge>
              )}
              {networkMember && !isContractor && (
                <Badge variant="outline">Property Owner</Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            Welcome back, {profile?.first_name || "Member"}!
          </h1>
          <p className="text-muted-foreground">
            Access all GCN services from your dashboard
          </p>
        </div>

        {/* Pending Contractor Notice */}
        {isPendingContractor && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-amber-900">Application Under Review</h3>
                  <p className="text-sm text-amber-700">
                    Your contractor application is being reviewed by our team. You'll receive an email once 
                    your account is approved. In the meantime, feel free to explore our services.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats for Contractors */}
        {isContractor && !isPendingContractor && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="text-xl font-semibold">{contractorProfile?.company_name}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-primary/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="text-xl font-semibold">{contractorProfile?.category}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Verification</p>
                    <p className="text-xl font-semibold">
                      {contractorProfile?.is_verified ? "Verified" : "Pending"}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-primary/30" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Services Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Available Services</h2>
          
          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat.value}
                  variant={activeCategory === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat.value)}
                  className="rounded-full"
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Services Grid or Empty State */}
          {filteredServices.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="space-y-2">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="font-semibold">No services found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
                >
                  Clear filters
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <Link
                  key={service.title}
                  to={service.link}
                  className="group"
                >
                  <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${service.color}`}>
                          <service.icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {service.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {service.description}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Contractor-Only Section */}
        {isContractor && !isPendingContractor && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Contractor Tools</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link to="/crm/auth" className="group">
                <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          CRM Portal
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Manage your leads and customers
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/contractor/dashboard" className="group">
                <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                        <User className="h-6 w-6 text-accent-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          My Profile
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Manage your contractor profile
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MemberDashboard;
