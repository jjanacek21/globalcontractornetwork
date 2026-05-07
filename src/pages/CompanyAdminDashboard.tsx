import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, Users, MapPin, BarChart3, FileText, 
  Settings, LogOut, Loader2, AlertCircle, CheckCircle2,
  Clock, DollarSign, TrendingUp, UserPlus, Briefcase
} from "lucide-react";
import gcnLogo from "@/assets/gcn-logo.jpg";
import { CompanyOverviewTab } from "@/components/company-admin/CompanyOverviewTab";
import { CompanyTeamsTab } from "@/components/company-admin/CompanyTeamsTab";
import { CompanyUsersTab } from "@/components/company-admin/CompanyUsersTab";
import { CompanyLeadsTab } from "@/components/company-admin/CompanyLeadsTab";
import { CompanyReferralsTab } from "@/components/company-admin/CompanyReferralsTab";
import { CompanyAnalyticsTab } from "@/components/company-admin/CompanyAnalyticsTab";
import { CompanyProfileTab } from "@/components/company-admin/CompanyProfileTab";
import { CompanyResourcesTab } from "@/components/company-admin/CompanyResourcesTab";

interface Company {
  id: string;
  name: string;
  verification_status: string;
  verification_score: number;
  primary_category: string;
  services_offered: string[];
  logo_url: string | null;
}

const CompanyAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUserId(user.id);

      // Check if user is a company admin
      const { data: memberData, error: memberError } = await supabase
        .from("company_members")
        .select("company_id, role")
        .eq("user_id", user.id)
        .eq("role", "company_admin")
        .single();

      if (memberError || !memberData) {
        // Also check company_admins table
        const { data: adminData, error: adminError } = await supabase
          .from("company_admins")
          .select("company_id")
          .eq("user_id", user.id)
          .single();

        if (adminError || !adminData) {
          toast({
            title: "Access Denied",
            description: "You don't have access to the Company Admin Portal",
            variant: "destructive"
          });
          navigate("/");
          return;
        }

        // Fetch company data
        const { data: companyData } = await supabase
          .from("companies")
          .select("id, name, verification_status, verification_score, primary_category, services_offered, logo_url")
          .eq("id", adminData.company_id)
          .single();

        if (companyData) {
          setCompany(companyData);
        }
      } else {
        // Fetch company data
        const { data: companyData } = await supabase
          .from("companies")
          .select("id, name, verification_status, verification_score, primary_category, services_offered, logo_url")
          .eq("id", memberData.company_id)
          .single();

        if (companyData) {
          setCompany(companyData);
        }
      }

      setLoading(false);
    };

    checkAccess();
  }, [navigate, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">No Company Found</h2>
            <p className="text-muted-foreground">
              You don't appear to be associated with any company.
            </p>
            <Button asChild>
              <Link to="/register-company">Register a Company</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getVerificationBadge = () => {
    switch (company.verification_status) {
      case "verified":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>;
      case "under_review":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Under Review</Badge>;
      case "pending":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending Verification</Badge>;
      default:
        return <Badge variant="destructive">{company.verification_status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={gcnLogo} alt="GCN Logo" className="h-10 w-auto" />
            <div className="flex flex-col">
              <span className="text-lg font-bold">{company.name}</span>
              <span className="text-xs text-muted-foreground">Company Admin Portal</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {getVerificationBadge()}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Verification Banner */}
      {company.verification_status !== "verified" && (
        <div className="bg-amber-50 border-b border-amber-200 py-3">
          <div className="container flex items-center gap-3 text-amber-800">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">
              Your company is pending verification. Complete your profile and provide more documentation to speed up the process.
              <span className="font-medium ml-2">Verification Score: {company.verification_score}/100</span>
            </span>
          </div>
        </div>
      )}

      <main className="container py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Leads</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Teams</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Referrals</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Resources</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <CompanyOverviewTab companyId={company.id} />
          </TabsContent>

          <TabsContent value="leads">
            <CompanyLeadsTab companyId={company.id} />
          </TabsContent>

          <TabsContent value="teams">
            <CompanyTeamsTab companyId={company.id} />
          </TabsContent>

          <TabsContent value="users">
            <CompanyUsersTab companyId={company.id} />
          </TabsContent>

          <TabsContent value="referrals">
            <CompanyReferralsTab companyId={company.id} />
          </TabsContent>

          <TabsContent value="analytics">
            <CompanyAnalyticsTab companyId={company.id} />
          </TabsContent>

          <TabsContent value="profile">
            <CompanyProfileTab companyId={company.id} />
          </TabsContent>

          <TabsContent value="resources">
            <CompanyResourcesTab companyId={company.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CompanyAdminDashboard;
