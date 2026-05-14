import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Home, Building2, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import gcnLogo from "@/assets/gcn-logo.jpg";

type UserType = "property_owner" | "contractor" | "company" | null;

const JoinNetwork = () => {
  const [userType, setUserType] = useState<UserType>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Property Owner Form State
  const [ownerForm, setOwnerForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    city: "",
    state: "FL",
    zip: ""
  });

  // Contractor Form State
  const [contractorForm, setContractorForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    companyName: "",
    phone: "",
    category: "",
    description: "",
    contractorType: "subcontractor" as "independent" | "subcontractor" | "handyman",
    selectedCompanyId: "",
    selectedTeamId: "",
    licenseNumber: "",
    licenseState: "FL",
    hasInsurance: false
  });

  // Companies and Teams for selection
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);

  // Fetch companies for sub-contractor selection
  useEffect(() => {
    const fetchCompanies = async () => {
      const { data } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      setCompanies(data || []);
    };
    fetchCompanies();
  }, []);

  // Fetch teams when company is selected
  useEffect(() => {
    const fetchTeams = async () => {
      if (contractorForm.selectedCompanyId) {
        const { data } = await supabase
          .from('teams')
          .select('id, name')
          .eq('company_id', contractorForm.selectedCompanyId)
          .order('name');
        setTeams(data || []);
      } else {
        setTeams([]);
      }
    };
    fetchTeams();
  }, [contractorForm.selectedCompanyId]);

  const handleOwnerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: ownerForm.email,
        password: ownerForm.password,
        options: {
          data: {
            first_name: ownerForm.firstName,
            last_name: ownerForm.lastName
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create network member record
        const { error: memberError } = await supabase.from("network_members").insert({
          user_id: authData.user.id,
          member_type: "property_owner",
          status: "active",
          phone: ownerForm.phone || null,
          address: ownerForm.address || null,
          city: ownerForm.city || null,
          state: ownerForm.state,
          zip: ownerForm.zip || null
        });

        if (memberError) throw memberError;

        // Send welcome email (non-blocking)
        try {
          await supabase.functions.invoke("send-welcome-email", {
            body: {
              email: ownerForm.email,
              name: `${ownerForm.firstName} ${ownerForm.lastName}`,
              userType: "homeowner"
            }
          });
          console.log("Welcome email sent successfully");
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
        }

        toast({
          title: "Welcome to GCN!",
          description: "Your account has been created. Redirecting to your dashboard..."
        });

        setTimeout(() => {
          navigate("/member/dashboard");
        }, 1500);
      }
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "An error occurred during signup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContractorSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractorForm.selectedCompanyId) {
      toast({ title: "Pick a company", description: "Select the company you'll be working with.", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: contractorForm.email,
        password: contractorForm.password,
        options: {
          data: {
            first_name: contractorForm.firstName,
            last_name: contractorForm.lastName
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create contractor profile with pending status
        const { error: profileError } = await supabase.from("contractor_profiles").insert({
          user_id: authData.user.id,
          company_name: contractorForm.companyName,
          category: contractorForm.category || "General Contractor",
          phone: contractorForm.phone || null,
          email: contractorForm.email,
          description: contractorForm.description || null,
          subscription_status: "pending",
          is_verified: false,
          contractor_type: contractorForm.contractorType,
          company_id: contractorForm.selectedCompanyId || null,
          team_id: contractorForm.selectedTeamId || null,
          license_number: contractorForm.licenseNumber || null,
          license_state: contractorForm.licenseState || null,
          first_name: contractorForm.firstName,
          last_name: contractorForm.lastName
        });

        if (profileError) throw profileError;

        // Notify admins via edge function (non-blocking)
        try {
          await supabase.functions.invoke("notify-admin-signup", {
            body: {
              companyName: contractorForm.companyName,
              email: contractorForm.email,
              phone: contractorForm.phone,
              category: contractorForm.category || "General Contractor",
              firstName: contractorForm.firstName,
              lastName: contractorForm.lastName,
              contractorType: contractorForm.contractorType,
            },
          });
        } catch (notifyError) {
          console.error("Failed to send admin notification:", notifyError);
        }

        setSuccess(true);
      }
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "An error occurred during signup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (success && userType === "contractor") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Thank You for Joining!</h2>
              <p className="text-muted-foreground">
                Your contractor application has been submitted successfully.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-left">
              <h3 className="font-semibold mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span>The company admin will review your application from their dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span>Someone will reach out to confirm your account details</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span>Once approved, you'll have full access to contractor features</span>
                </li>
              </ul>
            </div>
            <Button asChild className="w-full">
              <Link to="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Helmet>
        <title>Join the Network — Global Contractor Network</title>
        <meta
          name="description"
          content="Create your free Global Contractor Network account. Homeowners get AI quotes and vetted pros; contractors get verified referrals — no lead bidding."
        />
        <link rel="canonical" href="https://globalcontractor.network/join" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://globalcontractor.network/join" />
        <meta property="og:site_name" content="Global Contractor Network" />
        <meta property="og:title" content="Join the Network — Global Contractor Network" />
        <meta property="og:description" content="Free signup for homeowners and contractors. Verified referrals, AI estimates, no bidding wars." />
        <meta property="og:image" content="https://globalcontractor.network/gcn-logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Join the Network — Global Contractor Network" />
        <meta name="twitter:description" content="Free signup for homeowners and contractors. Verified referrals, AI estimates, no bidding wars." />
        <meta name="twitter:image" content="https://globalcontractor.network/gcn-logo.png" />
      </Helmet>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={gcnLogo} alt="GCN Logo" className="h-10 w-auto" />
            <div className="flex flex-col">
              <span className="text-lg font-bold">Global Contractor Network</span>
              <span className="text-xs text-muted-foreground">Join Our Network</span>
            </div>
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="container py-12">
        {!userType ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold">Join the Global Contractor Network</h1>
              <p className="text-xl text-muted-foreground">
                Choose how you'd like to join our network
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card 
                className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
                onClick={() => setUserType("property_owner")}
              >
                <CardContent className="pt-8 pb-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                    <Home className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">Property Owner</h2>
                  <p className="text-sm text-muted-foreground">Looking for verified contractors</p>
                  <ul className="text-sm text-left space-y-2 pt-2">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />Get instant quotes</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />Track your projects</li>
                  </ul>
                  <Button className="w-full mt-2">Get Started</Button>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer transition-all hover:shadow-lg hover:border-accent/50 group"
                onClick={() => setUserType("contractor")}
              >
                <CardContent className="pt-8 pb-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-accent/20 transition-colors">
                    <Building2 className="h-8 w-8 text-accent-foreground" />
                  </div>
                  <h2 className="text-xl font-bold">Join an Existing Company</h2>
                  <p className="text-sm text-muted-foreground">Sub-contractors & sales reps</p>
                  <ul className="text-sm text-left space-y-2 pt-2">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />Pick your company & team</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />Approved by company admin</li>
                  </ul>
                  <Button variant="secondary" className="w-full mt-2">Apply</Button>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer transition-all hover:shadow-lg hover:border-yellow-500/50 group"
                onClick={() => navigate("/register-company")}
              >
                <CardContent className="pt-8 pb-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-yellow-500/20 transition-colors">
                    <Building2 className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h2 className="text-xl font-bold">Register a Company</h2>
                  <p className="text-sm text-muted-foreground">Owners & company admins</p>
                  <ul className="text-sm text-left space-y-2 pt-2">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />Create teams & offices</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />Invite & approve reps</li>
                  </ul>
                  <Button variant="outline" className="w-full mt-2 border-yellow-500 text-yellow-700 hover:bg-yellow-50">Register Company</Button>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer transition-all hover:shadow-lg hover:border-emerald-500/50 group"
                onClick={() => navigate("/register-individual")}
              >
                <CardContent className="pt-8 pb-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-emerald-500/20 transition-colors">
                    <Building2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-bold">Independent Pro</h2>
                  <p className="text-sm text-muted-foreground">Handyman, consultant, skilled labor</p>
                  <ul className="text-sm text-left space-y-2 pt-2">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />Personal directory profile</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />Free landing page builder</li>
                  </ul>
                  <Button variant="outline" className="w-full mt-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50">Apply</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : userType === "property_owner" ? (
          <div className="max-w-xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => setUserType(null)} 
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to options
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  Property Owner Signup
                </CardTitle>
                <CardDescription>
                  Create your account to access all GCN services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleOwnerSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={ownerForm.firstName}
                        onChange={(e) => setOwnerForm({ ...ownerForm, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={ownerForm.lastName}
                        onChange={(e) => setOwnerForm({ ...ownerForm, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={ownerForm.email}
                      onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={ownerForm.password}
                      onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={ownerForm.phone}
                      onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Property Address</Label>
                    <Input
                      id="address"
                      value={ownerForm.address}
                      onChange={(e) => setOwnerForm({ ...ownerForm, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={ownerForm.city}
                        onChange={(e) => setOwnerForm({ ...ownerForm, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={ownerForm.state}
                        onChange={(e) => setOwnerForm({ ...ownerForm, state: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP</Label>
                      <Input
                        id="zip"
                        value={ownerForm.zip}
                        onChange={(e) => setOwnerForm({ ...ownerForm, zip: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => setUserType(null)} 
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to options
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-accent-foreground" />
                  Contractor Application
                </CardTitle>
                <CardDescription>
                  Apply to join our network of verified contractors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContractorSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cFirstName">First Name *</Label>
                      <Input
                        id="cFirstName"
                        value={contractorForm.firstName}
                        onChange={(e) => setContractorForm({ ...contractorForm, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cLastName">Last Name *</Label>
                      <Input
                        id="cLastName"
                        value={contractorForm.lastName}
                        onChange={(e) => setContractorForm({ ...contractorForm, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={contractorForm.companyName}
                      onChange={(e) => setContractorForm({ ...contractorForm, companyName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cEmail">Email *</Label>
                    <Input
                      id="cEmail"
                      type="email"
                      value={contractorForm.email}
                      onChange={(e) => setContractorForm({ ...contractorForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cPassword">Password *</Label>
                    <Input
                      id="cPassword"
                      type="password"
                      value={contractorForm.password}
                      onChange={(e) => setContractorForm({ ...contractorForm, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cPhone">Phone *</Label>
                    <Input
                      id="cPhone"
                      type="tel"
                      value={contractorForm.phone}
                      onChange={(e) => setContractorForm({ ...contractorForm, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                    You're applying to join an existing company. The company admin will review and approve your application.
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Select Company *</Label>
                    <Select 
                      value={contractorForm.selectedCompanyId} 
                      onValueChange={(value) => setContractorForm({ ...contractorForm, contractorType: 'subcontractor', selectedCompanyId: value, selectedTeamId: "" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose the company you'll work for" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(company => (
                          <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Don't see your company? Ask them to register first, or{" "}
                      <Link to="/register-individual" className="text-primary underline">apply as an independent pro</Link>.
                    </p>
                  </div>

                  {contractorForm.selectedCompanyId && teams.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="team">Team / Office (Optional)</Label>
                      <Select 
                        value={contractorForm.selectedTeamId} 
                        onValueChange={(value) => setContractorForm({ ...contractorForm, selectedTeamId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No specific team</SelectItem>
                          {teams.map(team => (
                            <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="category">Primary Service Category *</Label>
                    <Select 
                      value={contractorForm.category} 
                      onValueChange={(value) => setContractorForm({ ...contractorForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your primary service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Roofing">Roofing</SelectItem>
                        <SelectItem value="HVAC">HVAC</SelectItem>
                        <SelectItem value="Plumbing">Plumbing</SelectItem>
                        <SelectItem value="Electrical">Electrical</SelectItem>
                        <SelectItem value="Painting">Painting</SelectItem>
                        <SelectItem value="Landscaping">Landscaping</SelectItem>
                        <SelectItem value="General Contractor">General Contractor</SelectItem>
                        <SelectItem value="Windows & Doors">Windows & Doors</SelectItem>
                        <SelectItem value="Flooring">Flooring</SelectItem>
                        <SelectItem value="Kitchen & Bath">Kitchen & Bath</SelectItem>
                        <SelectItem value="Handyman">Handyman</SelectItem>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Tell us about your business</Label>
                    <Textarea
                      id="description"
                      value={contractorForm.description}
                      onChange={(e) => setContractorForm({ ...contractorForm, description: e.target.value })}
                      placeholder="Years of experience, specialties, service areas..."
                      rows={4}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting Application...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default JoinNetwork;