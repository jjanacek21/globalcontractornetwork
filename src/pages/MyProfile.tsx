import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User, Mail, Phone, Building2, MapPin, FileText,
  Home, Briefcase, Users, ArrowLeft, CheckCircle2, Pencil, Crown
} from "lucide-react";
import { format } from "date-fns";

export default function MyProfile() {
  const navigate = useNavigate();
  const { 
    profile, 
    contractorProfile, 
    isContractor, 
    isSuperAdmin,
    quotes, 
    projects, 
    referrals, 
    contactRequests,
    loading, 
    error 
  } = useUserProfile();

  // Homeowners get the full-featured profile (messages, photos, post-a-job, etc.)
  useEffect(() => {
    if (!loading && profile && !isContractor && !isSuperAdmin) {
      navigate("/homeowner-profile", { replace: true });
    }
  }, [loading, profile, isContractor, isSuperAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Unable to Load Profile</CardTitle>
            <CardDescription>{error || "Please log in to view your profile"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/network-login")}>Log In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Member";
  const totalEarnings = referrals.reduce((sum, r) => sum + (r.payout_amount || 0), 0);
  const profileRoleLabel = isSuperAdmin ? "Main Admin" : isContractor ? "Contractor" : "Homeowner";
  const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() || "M";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient cinematic background */}
      <div className="floating-orb floating-orb-1" />
      <div className="floating-orb floating-orb-2" />
      <div className="floating-orb floating-orb-3" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />

      {/* Header */}
      <header className="border-b border-border/40 bg-background/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">My Profile & Activity</h1>
            <p className="text-muted-foreground text-sm">
              Everything you've submitted and managed on Global Contractor Network — in one place.
            </p>
          </div>
        </div>
      </header>

      <main className="container py-10 max-w-5xl space-y-8 relative">
        {/* 3D Profile Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24, rotateX: -6 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.7, ease: [0.175, 0.885, 0.32, 1.275] }}
          style={{ transformStyle: "preserve-3d", perspective: 1200 }}
        >
          <Card
            className="relative overflow-hidden glass-card border-border/40"
            style={{
              boxShadow: "0 24px 60px -20px hsl(var(--primary) / 0.35), 0 8px 24px -8px hsl(var(--accent) / 0.2), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
            }}
          >
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-accent/40 to-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-primary/40 to-accent/10 blur-3xl" />

            <CardHeader className="relative">
              <div className="flex items-start gap-5 flex-wrap">
                <motion.div
                  whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                  transition={{ duration: 0.6 }}
                  className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-accent text-primary-foreground flex items-center justify-center text-2xl font-bold ring-2 ring-accent/40"
                  style={{ boxShadow: "0 16px 32px -10px hsl(var(--primary) / 0.6), inset 0 2px 0 hsl(45 100% 80% / 0.5)" }}
                >
                  {isSuperAdmin ? <Crown className="h-9 w-9" /> : initials}
                </motion.div>
                <div className="flex-1 min-w-[200px]">
                  <CardTitle className="text-2xl md:text-3xl">{fullName}</CardTitle>
                  <CardDescription className="mt-1">{profile.email}</CardDescription>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <Badge
                      className="text-xs bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 shadow"
                    >
                      {profileRoleLabel}
                    </Badge>
                    {isContractor && contractorProfile?.is_verified && (
                      <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                  </div>
                </div>
                {isContractor && (
                  <Button onClick={() => navigate('/contractor/dashboard')} variant="outline" size="sm" className="backdrop-blur">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {profile.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-accent" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{profile.phone}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{profile.email}</p>
                    </div>
                  </div>
                </div>
                {isContractor && contractorProfile && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-accent" />
                      <div>
                        <p className="text-xs text-muted-foreground">Company</p>
                        <p className="font-medium">{contractorProfile.company_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-accent" />
                      <div>
                        <p className="text-xs text-muted-foreground">Trade</p>
                        <p className="font-medium">{contractorProfile.category}</p>
                      </div>
                    </div>
                    {contractorProfile.service_area && contractorProfile.service_area.length > 0 && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-accent mt-1" />
                        <div>
                          <p className="text-xs text-muted-foreground">Service Areas</p>
                          <p className="font-medium">{contractorProfile.service_area.join(", ")}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Linked Records Tabs */}
        <Tabs defaultValue="projects" className="space-y-4">
          <TabsList className="grid w-full h-12 p-1 glass-card border border-border/40 rounded-2xl" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <TabsTrigger value="projects" className="gap-2 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
              <Home className="h-4 w-4" />
              My Projects
            </TabsTrigger>
            <TabsTrigger value="quotes" className="gap-2 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
              <FileText className="h-4 w-4" />
              My Quotes
            </TabsTrigger>
            {isContractor ? (
              <TabsTrigger value="referrals" className="gap-2 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
                <Users className="h-4 w-4" />
                Referrals
              </TabsTrigger>
            ) : (
              <TabsTrigger value="requests" className="gap-2 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
                <Users className="h-4 w-4" />
                Requests
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="quotes" className="space-y-4">
            <Card className="glass-card border-border/40">
              <CardHeader>
                <CardTitle>Quote Requests</CardTitle>
                <CardDescription>All quote and estimate requests linked to your account</CardDescription>
              </CardHeader>
              <CardContent>
                {quotes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No quotes found</p>
                ) : (
                  <div className="space-y-3">
                    {quotes.map((quote) => (
                      <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{quote.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {quote.property_address || quote.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {quote.created_at ? format(new Date(quote.created_at), "MMM d, yyyy") : ""}
                          </p>
                        </div>
                        <Badge variant={quote.status === "completed" ? "default" : "secondary"}>
                          {quote.status || "pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <Card className="glass-card border-border/40">
              <CardHeader>
                <CardTitle>My Projects</CardTitle>
                <CardDescription>Projects you've created or been assigned to</CardDescription>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No projects found</p>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{project.service_type}</p>
                          <p className="text-sm text-muted-foreground">{project.property_address}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(project.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Badge>{project.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isContractor ? (
            <TabsContent value="referrals" className="space-y-4">
              <Card className="glass-card border-border/40">
                <CardHeader>
                  <CardTitle>My Referrals</CardTitle>
                  <CardDescription>
                    Referrals you've submitted • Total earnings: ${totalEarnings.toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {referrals.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No referrals found</p>
                  ) : (
                    <div className="space-y-3">
                      {referrals.map((referral) => (
                        <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{referral.referred_customer_name}</p>
                            <p className="text-sm text-muted-foreground">{referral.referred_service_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(referral.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={referral.status === "completed" ? "default" : "secondary"}>
                              {referral.status}
                            </Badge>
                            {referral.payout_amount && (
                              <p className="text-sm font-medium text-primary mt-1">
                                ${referral.payout_amount.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ) : (
            <TabsContent value="requests" className="space-y-4">
              <Card className="glass-card border-border/40">
                <CardHeader>
                  <CardTitle>Contact Requests</CardTitle>
                  <CardDescription>Support requests and inquiries you've submitted</CardDescription>
                </CardHeader>
                <CardContent>
                  {contactRequests.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No requests found</p>
                  ) : (
                    <div className="space-y-3">
                      {contactRequests.map((req) => (
                        <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{req.type}</p>
                            <p className="text-sm text-muted-foreground">{req.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {req.created_at ? format(new Date(req.created_at), "MMM d, yyyy") : ""}
                            </p>
                          </div>
                          <Badge variant={req.status === "resolved" ? "default" : "secondary"}>
                            {req.status || "pending"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
