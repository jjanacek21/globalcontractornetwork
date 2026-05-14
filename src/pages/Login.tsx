import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Home, Wrench, Search, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const defaultTab = searchParams.get("type") || "homeowner";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login form state
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  
  // Guest lookup state
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupResults, setLookupResults] = useState<any[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [showLookup, setShowLookup] = useState(false);

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        redirectToDashboard(session.user.id);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        redirectToDashboard(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const redirectToDashboard = async (userId: string) => {
    // Check if user is a contractor
    const { data: contractor } = await supabase
      .from("contractor_profiles")
      .select("id, verification_status")
      .eq("user_id", userId)
      .single();

    if (contractor) {
      if (contractor.verification_status === "approved") {
        navigate("/contractor/dashboard");
      } else {
        navigate("/contractor/dashboard");
      }
      return;
    }

    // Check if user is a homeowner/network member
    const { data: member } = await supabase
      .from("network_members")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (member) {
      navigate("/homeowner/dashboard");
      return;
    }

    // Default to homeowner dashboard
    navigate("/homeowner/dashboard");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've been logged in successfully.",
      });

      if (data.user) {
        await redirectToDashboard(data.user.id);
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEmail && !lookupPhone) {
      toast({
        title: "Enter email or phone",
        description: "Please enter your email or phone number to find your submissions.",
        variant: "destructive",
      });
      return;
    }

    setIsLookingUp(true);
    setLookupResults([]);

    try {
      const results: any[] = [];

      // Search coating_leads
      if (lookupEmail || lookupPhone) {
        let query = supabase.from("coating_leads").select("*");
        if (lookupEmail) query = query.ilike("email", lookupEmail);
        if (lookupPhone) query = query.ilike("phone", `%${lookupPhone}%`);
        const { data } = await query.order("created_at", { ascending: false }).limit(10);
        if (data) {
          results.push(...data.map(d => ({ ...d, type: "Coating Quote", source: "Coating Kings" })));
        }
      }

      // Search window_leads
      if (lookupEmail || lookupPhone) {
        let query = supabase.from("window_leads").select("*");
        if (lookupEmail) query = query.ilike("email", lookupEmail);
        if (lookupPhone) query = query.ilike("phone", `%${lookupPhone}%`);
        const { data } = await query.order("created_at", { ascending: false }).limit(10);
        if (data) {
          results.push(...data.map(d => ({ ...d, type: "Window Quote", source: "Windows & Doors" })));
        }
      }

      // Search contact_requests
      if (lookupEmail) {
        const { data } = await supabase
          .from("contact_requests")
          .select("*")
          .ilike("email", lookupEmail)
          .order("created_at", { ascending: false })
          .limit(10);
        if (data) {
          results.push(...data.map(d => ({ ...d, type: "Contact Request", source: "General" })));
        }
      }

      // Sort by date
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setLookupResults(results);

      if (results.length === 0) {
        toast({
          title: "No submissions found",
          description: "We couldn't find any submissions with that email or phone number.",
        });
      }
    } catch (error) {
      console.error("Lookup error:", error);
      toast({
        title: "Lookup failed",
        description: "There was an error looking up your submissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Home</span>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">GCN</span>
            </div>
            <span className="font-bold hidden sm:inline">Global Contractor Network</span>
          </Link>
          <Link to="/join" className="text-sm text-primary hover:underline">
            Create Account
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="homeowner" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Homeowner
                  </TabsTrigger>
                  <TabsTrigger value="contractor" className="flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Contractor
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="homeowner">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="homeowner-email">Email</Label>
                      <Input
                        id="homeowner-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="homeowner-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="homeowner-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Sign In
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="contractor">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contractor-email">Email</Label>
                      <Input
                        id="contractor-email"
                        type="email"
                        placeholder="you@company.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contractor-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="contractor-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Sign In
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6 pt-6 border-t">
                <div className="text-center text-sm text-muted-foreground mb-4">
                  <Link to="/reset-password" className="text-primary hover:underline">
                    Forgot your password?
                  </Link>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowLookup(!showLookup)}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Look Up My Submissions (Guest)
                </Button>

                {showLookup && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-3">
                      Don't have an account? Look up your quote requests by email or phone.
                    </p>
                    <form onSubmit={handleGuestLookup} className="space-y-3">
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={lookupEmail}
                        onChange={(e) => setLookupEmail(e.target.value)}
                      />
                      <Input
                        type="tel"
                        placeholder="Phone number"
                        value={lookupPhone}
                        onChange={(e) => setLookupPhone(e.target.value)}
                      />
                      <Button type="submit" variant="secondary" className="w-full" disabled={isLookingUp}>
                        {isLookingUp ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Find My Submissions
                      </Button>
                    </form>

                    {lookupResults.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium">Your Submissions:</p>
                        {lookupResults.map((result, index) => (
                          <div key={index} className="p-3 bg-background rounded-md border">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">{result.type}</p>
                                <p className="text-xs text-muted-foreground">{result.source}</p>
                              </div>
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                {result.status || "Pending"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(result.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/join" className="text-primary hover:underline font-medium">
                  Sign up now
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Login;
