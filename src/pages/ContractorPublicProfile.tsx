import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User, MapPin, Phone, Mail, Globe, ShieldCheck, Star,
  ExternalLink, Building2
} from "lucide-react";

const PROFILE_TYPE_LABEL: Record<string, string> = {
  company: "Company Representative",
  building_consultant: "Building Consultant",
  handyman: "Handyman",
  skilled_labor: "Skilled Labor",
};

export default function ContractorPublicProfile() {
  const { contractorId } = useParams<{ contractorId: string }>();
  const [contractor, setContractor] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contractorId) return;
    (async () => {
      setLoading(true);
      const { data: cp } = await supabase
        .from("contractor_profiles")
        .select("*")
        .eq("id", contractorId)
        .maybeSingle();
      setContractor(cp);
      if (cp?.company_id) {
        const { data: co } = await supabase
          .from("companies")
          .select("id, name, logo_url, verification_status")
          .eq("id", cp.company_id)
          .maybeSingle();
        setCompany(co);
      }
      setLoading(false);
    })();
  }, [contractorId]);

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

  if (!contractor) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">Profile not found</h1>
          <Link to="/directory" className="text-primary hover:underline">Back to directory</Link>
        </div>
      </div>
    );
  }

  const c = contractor;
  const verified = c.is_verified || c.verification_status === "verified";
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.company_name;
  const socials: Record<string, string> = c.social_links || {};
  const gallery: any[] = c.profile_gallery || [];
  const services: string[] = c.services_offered || [];
  const trades: string[] = c.secondary_trades || [];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <div className="relative h-40 sm:h-56 bg-gradient-to-r from-primary/30 to-primary/10 overflow-hidden">
        {c.banner_image_url && (
          <img src={c.banner_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>

      <div className="container -mt-16 relative z-10 pb-16">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                <AvatarImage src={c.logo_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold">{name}</h1>
                  {verified && (
                    <Badge className="bg-green-500/15 text-green-700 border-green-500/30">
                      <ShieldCheck className="h-3 w-3 mr-1" />Verified
                    </Badge>
                  )}
                </div>
                {c.title && <p className="text-muted-foreground">{c.title}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {c.profile_type && (
                    <Badge variant="outline">{PROFILE_TYPE_LABEL[c.profile_type] || c.profile_type}</Badge>
                  )}
                  {c.category && <Badge variant="secondary" className="capitalize">{c.category}</Badge>}
                  {trades.map((t, i) => (
                    <Badge key={i} variant="outline" className="capitalize">{t}</Badge>
                  ))}
                </div>
                {company && (
                  <Link to={`/company/${company.id}`} className="inline-flex items-center gap-2 mt-3 text-sm text-primary hover:underline">
                    <Building2 className="h-4 w-4" />Part of {company.name}
                  </Link>
                )}
                <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                  {c.phone && <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 hover:text-foreground"><Phone className="h-4 w-4" />{c.phone}</a>}
                  {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 hover:text-foreground"><Mail className="h-4 w-4" />{c.email}</a>}
                  {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><Globe className="h-4 w-4" />Website</a>}
                </div>
                {c.average_rating > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-sm">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{c.average_rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({c.review_count} reviews)</span>
                  </div>
                )}
              </div>
              {c.email && <Button onClick={() => window.location.href = `mailto:${c.email}`}>Contact</Button>}
            </div>
          </CardContent>
        </Card>

        {(c.bio_long || c.bio_short || c.description) && (
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-lg">About</CardTitle></CardHeader>
            <CardContent>
              <p className="leading-relaxed whitespace-pre-line">{c.bio_long || c.bio_short || c.description}</p>
            </CardContent>
          </Card>
        )}

        {services.length > 0 && (
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-lg">Services</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {services.map((s, i) => <Badge key={i} variant="secondary" className="capitalize">{s}</Badge>)}
            </CardContent>
          </Card>
        )}

        {gallery.length > 0 && (
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-lg">Gallery</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {gallery.map((p: any, i: number) => {
                  const url = typeof p === "string" ? p : (p.url || p.image_url);
                  return (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        {url && <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition" />}
                      </div>
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {Object.keys(socials).length > 0 && (
          <Card className="mt-4">
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
      </div>
    </div>
  );
}
