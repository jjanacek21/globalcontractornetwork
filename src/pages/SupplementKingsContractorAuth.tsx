import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Crown, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function SupplementKingsContractorAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && !showProfileForm) {
        checkContractorProfile(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !showProfileForm) {
        checkContractorProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, showProfileForm]);

  const checkContractorProfile = async (userId: string) => {
    const { data } = await supabase
      .from('supplement_contractors')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (data) {
      navigate("/supplement-kings/contractor/dashboard");
    }
  };

  const createContractorProfile = async (userId: string) => {
    const { error: profileError } = await supabase
      .from('supplement_contractors')
      .insert({
        user_id: userId,
        company_name: companyName,
        contact_name: contactName,
        phone: phone,
        email: email,
      });

    if (profileError) {
      throw profileError;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check for contractor profile
      if (data.user) {
        const { data: contractor } = await supabase
          .from('supplement_contractors')
          .select('id')
          .eq('user_id', data.user.id)
          .single();

        if (!contractor) {
          // User exists but no contractor profile - show profile completion form
          setPendingUserId(data.user.id);
          setShowProfileForm(true);
          toast({
            title: "Complete your profile",
            description: "Please enter your company details to continue.",
          });
          return;
        }

        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/supplement-kings/contractor/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      // Handle "user already exists" - try signing them in instead
      if (error?.message?.toLowerCase().includes('already registered') || 
          error?.message?.toLowerCase().includes('already exists')) {
        // Try to sign in the existing user
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
          });
          return;
        }

        // User signed in successfully - check if they have a contractor profile
        if (signInData.user) {
          const { data: existingContractor } = await supabase
            .from('supplement_contractors')
            .select('id')
            .eq('user_id', signInData.user.id)
            .single();

          if (existingContractor) {
            // Already has profile, redirect to dashboard
            toast({
              title: "Welcome back!",
              description: "You already have a contractor account.",
            });
            navigate("/supplement-kings/contractor/dashboard");
            return;
          }

          // Create contractor profile for existing user
          await createContractorProfile(signInData.user.id);
          
          toast({
            title: "Profile created!",
            description: "Your contractor profile has been set up.",
          });
          navigate("/supplement-kings/contractor/dashboard");
          return;
        }
      }

      if (error) throw error;

      // Create contractor profile for new user
      if (data.user) {
        await createContractorProfile(data.user.id);
      }

      toast({
        title: "Account created!",
        description: "Welcome to Supplement Kings. You can now submit leads.",
      });
    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUserId) return;
    
    setLoading(true);
    try {
      await createContractorProfile(pendingUserId);
      
      toast({
        title: "Profile created!",
        description: "Welcome to Supplement Kings. You can now submit leads.",
      });
      
      setShowProfileForm(false);
      setPendingUserId(null);
      navigate("/supplement-kings/contractor/dashboard");
    } catch (error: any) {
      toast({
        title: "Error creating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Profile completion form for existing users without contractor profile
  if (showProfileForm) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
        <header className="border-b border-blue-500/20 bg-slate-950/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <Link to="/supplement-kings" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors w-fit">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Supplement Kings</span>
            </Link>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md bg-slate-900/50 border-blue-500/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-blue-600/20 to-yellow-500/20 flex items-center justify-center">
                <Crown className="h-8 w-8 text-blue-400" />
              </div>
              <CardTitle className="text-2xl text-white">Complete Your Profile</CardTitle>
              <CardDescription className="text-slate-400">
                Enter your company details to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompleteProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-slate-300">Company Name *</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="ABC Roofing Co."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName" className="text-slate-300">Contact Name</Label>
                  <Input
                    id="contactName"
                    type="text"
                    placeholder="John Doe"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-300">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  disabled={loading || !companyName}
                >
                  {loading ? "Creating profile..." : "Complete Setup"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-blue-500/20 bg-slate-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link to="/supplement-kings" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors w-fit">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Supplement Kings</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md bg-slate-900/50 border-blue-500/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-blue-600/20 to-yellow-500/20 flex items-center justify-center">
              <Crown className="h-8 w-8 text-blue-400" />
            </div>
            <CardTitle className="text-2xl text-white">Contractor Portal</CardTitle>
            <CardDescription className="text-slate-400">
              Submit and track your insurance claim supplements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
                <TabsTrigger value="signin" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-slate-300">Company Name *</Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="ABC Roofing Co."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactName" className="text-slate-300">Contact Name</Label>
                    <Input
                      id="contactName"
                      type="text"
                      placeholder="John Doe"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signupEmail" className="text-slate-300">Email *</Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signupPassword" className="text-slate-300">Password *</Label>
                    <Input
                      id="signupPassword"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
