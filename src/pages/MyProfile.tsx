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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
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

      <main className="container py-8 max-w-4xl space-y-8">
        {/* Profile Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Overview
            </CardTitle>
            {isContractor && (
              <Button onClick={() => navigate('/contractor/dashboard')} variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{fullName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{profile.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Badge variant={isSuperAdmin || isContractor ? "default" : "secondary"}>
                    {profileRoleLabel}
                  </Badge>
                </div>
              </div>

              {isContractor && contractorProfile && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="font-medium">{contractorProfile.company_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Trade</p>
                      <p className="font-medium">{contractorProfile.category}</p>
                    </div>
                  </div>
                  {contractorProfile.service_area && contractorProfile.service_area.length > 0 && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">Service Areas</p>
                        <p className="font-medium">{contractorProfile.service_area.join(", ")}</p>
                      </div>
                    </div>
                  )}
                  {contractorProfile.is_verified && (
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Verified Contractor</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Linked Records Tabs */}
        <Tabs defaultValue={isContractor ? "referrals" : "quotes"} className="space-y-4">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: isContractor ? "repeat(3, 1fr)" : "repeat(3, 1fr)" }}>
            <TabsTrigger value="quotes" className="gap-2">
              <FileText className="h-4 w-4" />
              My Quotes
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <Home className="h-4 w-4" />
              My Projects
            </TabsTrigger>
            {isContractor ? (
              <TabsTrigger value="referrals" className="gap-2">
                <Users className="h-4 w-4" />
                Referrals
              </TabsTrigger>
            ) : (
              <TabsTrigger value="requests" className="gap-2">
                <Users className="h-4 w-4" />
                Requests
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="quotes" className="space-y-4">
            <Card>
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
            <Card>
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
              <Card>
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
              <Card>
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
