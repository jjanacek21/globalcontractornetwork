import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Hammer, Building2, User, Wrench } from "lucide-react";

type ContractorKind = "independent" | "handyman";

export default function ContractorAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    companyName: "",
    contractorType: "independent" as ContractorKind,
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("contractor_profiles")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        
        if (profile) {
          navigate("/contractor/dashboard");
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword(loginData);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      navigate("/contractor/dashboard");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/contractor`,
        data: {
          first_name: signupData.firstName,
          last_name: signupData.lastName,
        }
      }
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data.user) {
      await supabase.from("contractor_profiles").insert({
        user_id: data.user.id,
        company_name: signupData.companyName || `${signupData.firstName} ${signupData.lastName}`.trim(),
        first_name: signupData.firstName,
        last_name: signupData.lastName,
        email: signupData.email,
        category: signupData.contractorType === "handyman" ? "Handyman" : "General Contractor",
        contractor_type: signupData.contractorType,
        verification_status: "pending",
        subscription_status: "pending",
        is_verified: false,
        is_directory_eligible: false,
      });

      toast({
        title: "Welcome aboard!",
        description: "Your account is created. You can browse the job marketplace and build your profile while we review your credentials.",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Hammer className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Contractor Portal</h1>
          <p className="text-muted-foreground">Join our network of professionals</p>
        </div>

        <Card>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>Login to your contractor account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup}>
                <CardHeader>
                  <CardTitle>Join Our Network</CardTitle>
                  <CardDescription>Create your contractor profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="mb-2 block">I am a…</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { v: "independent" as const, icon: Wrench, label: "Independent contractor", desc: "Solo or with a crew" },
                        { v: "handyman" as const, icon: User, label: "Handyman", desc: "Repairs & small jobs" },
                      ].map(opt => (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() => setSignupData({ ...signupData, contractorType: opt.v })}
                          className={`text-left p-3 rounded-lg border transition ${
                            signupData.contractorType === opt.v
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <opt.icon className="h-4 w-4 mb-1 text-primary" />
                          <p className="text-sm font-medium">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground flex items-start gap-1">
                      <Building2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      Part of a company? Use the invitation link your admin emailed you, or <a className="underline ml-1" href="/register-company">register your company</a>.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="companyName">Business / Crew Name</Label>
                    <Input
                      id="companyName"
                      value={signupData.companyName}
                      onChange={(e) => setSignupData({ ...signupData, companyName: e.target.value })}
                      placeholder="e.g. Smith Handyman Services"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={signupData.firstName}
                        onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={signupData.lastName}
                        onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Sign Up"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
