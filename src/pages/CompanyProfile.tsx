import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, MapPin, Phone, Mail, Globe, ShieldCheck,
  Star, ExternalLink, Users
} from "lucide-react";

export default function CompanyProfile() {
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      setLoading(true);
      const [{ data: co }, { data: members }] = await Promise.all([
        supabase.from("companies").select("*").eq("id", companyId).maybeSingle(),
        supabase.from("contractor_profiles")
          .select("id, first_name, last_name, company_name, title, category, logo_url, average_rating, review_count, is_verified, verification_status")
          .eq("company_id", companyId),
      ]);
      setCompany(co);
      setTeam(members || []);
      setLoading(false);
    })();
  }, [companyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="container py-10 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">Company not found</h1>
          <Link to="/directory" className="text-primary hover:underline">Back to directory</Link>
        </div>
      </div>
    );
  }

  const verified = company.verification_status === "verified";
  const photos: any[] = company.job_photos || [];
  const refs: any[] = company.client_references || [];
  const socials: Record<string, string> = company.social_links || {};

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Banner */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-r from-primary/30 to-primary/10 overflow-hidden">
        {company.banner_image_url && (
          <img src={company.banner_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>

      <div className="container -mt-16 relative z-10 pb-16">
        {/* Header card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                <AvatarImage src={company.logo_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Building2 className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold">{company.name}</h1>
                  {verified && (
                    <Badge className="bg-green-500/15 text-green-700 border-green-500/30">
                      <ShieldCheck className="h-3 w-3 mr-1" />Verified
                    </Badge>
                  )}
                  {company.primary_category && (
                    <Badge variant="outline" className="capitalize">{company.primary_category}</Badge>
                  )}
                </div>
                {company.bio_short && <p className="text-muted-foreground mt-2">{company.bio_short}</p>}
                <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                  {(company.city || company.state) && (
                    <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{[company.city, company.state].filter(Boolean).join(", ")}</span>
                  )}
                  {company.phone && <a href={`tel:${company.phone}`} className="inline-flex items-center gap-1 hover:text-foreground"><Phone className="h-4 w-4" />{company.phone}</a>}
                  {company.email && <a href={`mailto:${company.email}`} className="inline-flex items-center gap-1 hover:text-foreground"><Mail className="h-4 w-4" />{company.email}</a>}
                  {company.website && <a href={company.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><Globe className="h-4 w-4" />Website</a>}
                </div>
              </div>
              <Button onClick={() => window.location.href = `mailto:${company.email}`}>Contact</Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="team">Team ({team.length})</TabsTrigger>
            <TabsTrigger value="photos">Photos ({photos.length})</TabsTrigger>
            <TabsTrigger value="references">References ({refs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {company.bio_long && (
              <Card><CardContent className="pt-6"><p className="leading-relaxed whitespace-pre-line">{company.bio_long}</p></CardContent></Card>
            )}
            {company.services_offered?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Services</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {company.services_offered.map((s: string, i: number) => (
                    <Badge key={i} variant="secondary" className="capitalize">{s}</Badge>
                  ))}
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader><CardTitle className="text-lg">Credentials</CardTitle></CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Years in business:</span> {company.years_in_business ?? "—"}</div>
                <div><span className="text-muted-foreground">License:</span> {company.license_number ? `${company.license_number} (${company.license_state || ""})` : "—"}</div>
                <div><span className="text-muted-foreground">Insured:</span> {company.insurance_provider ? "Yes" : "—"}</div>
                <div><span className="text-muted-foreground">Workers comp:</span> {company.workers_comp_provider ? "Yes" : "Not required"}</div>
              </CardContent>
            </Card>
            {Object.keys(socials).length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Social</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  {Object.entries(socials).filter(([_, v]) => v).map(([k, v]) => (
                    <a key={k} href={v as string} target="_blank" rel="noreferrer"
                       className="inline-flex items-center gap-1 text-primary hover:underline capitalize">
                      {k} <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="team" className="mt-4">
            {team.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No team members listed yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {team.map(m => {
                  const name = [m.first_name, m.last_name].filter(Boolean).join(" ") || m.company_name || "Team Member";
                  const isVerified = m.is_verified || m.verification_status === "verified";
                  return (
                    <Link key={m.id} to={`/contractor/${m.id}`}>
                      <Card className="hover:shadow-md transition cursor-pointer h-full">
                        <CardContent className="pt-4 flex gap-3 items-start">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={m.logo_url || ""} />
                            <AvatarFallback><Users className="h-5 w-5" /></AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 font-medium truncate">
                              {name}
                              {isVerified && <ShieldCheck className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />}
                            </div>
                            {m.title && <p className="text-xs text-muted-foreground truncate">{m.title}</p>}
                            {m.category && <Badge variant="outline" className="mt-1 capitalize text-[10px]">{m.category}</Badge>}
                            {(m.average_rating > 0) && (
                              <div className="flex items-center gap-1 mt-1 text-xs">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {m.average_rating.toFixed(1)} ({m.review_count})
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="photos" className="mt-4">
            {photos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No photos yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((p: any, i: number) => {
                  const url = typeof p === "string" ? p : (p.url || p.image_url);
                  const caption = typeof p === "object" ? (p.caption || p.projectType) : "";
                  return (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        {url && <img src={url} alt={caption} className="w-full h-full object-cover hover:scale-105 transition" />}
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="references" className="mt-4 space-y-3">
            {refs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No references listed.</p>
            ) : refs.map((r: any, i: number) => (
              <Card key={i}>
                <CardContent className="pt-4 text-sm">
                  <p className="font-medium">{r.name || `Reference ${i + 1}`}</p>
                  {(r.projectDescription || r.project_description) && (
                    <p className="text-muted-foreground mt-1">{r.projectDescription || r.project_description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
