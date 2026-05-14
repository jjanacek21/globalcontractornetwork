import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Phone, Mail, MapPin, CheckCircle2, Star, ExternalLink } from "lucide-react";

interface LandingProfile {
  id: string;
  company_name: string;
  category: string;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  banner_image_url: string | null;
  service_area: string[] | null;
  profile_gallery: any;
  client_references: any;
  average_rating: number | null;
  review_count: number | null;
  landing_slug: string;
  landing_headline: string | null;
  landing_subheadline: string | null;
  landing_about: string | null;
  landing_cta_label: string | null;
  landing_theme: string | null;
  landing_hero_image_url: string | null;
}

const themes: Record<string, { bg: string; accent: string; heroText: string }> = {
  forest:   { bg: "from-emerald-950 via-emerald-900 to-emerald-800", accent: "bg-emerald-500 hover:bg-emerald-600", heroText: "text-white" },
  navy:     { bg: "from-slate-950 via-blue-950 to-blue-900",         accent: "bg-blue-500 hover:bg-blue-600",       heroText: "text-white" },
  charcoal: { bg: "from-zinc-950 via-zinc-900 to-zinc-800",          accent: "bg-amber-500 hover:bg-amber-600",     heroText: "text-white" },
};

export default function ContractorLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<LandingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  useEffect(() => {
    (async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("contractor_profiles")
        .select("id, company_name, category, phone, email, logo_url, banner_image_url, service_area, profile_gallery, client_references, average_rating, review_count, landing_slug, landing_headline, landing_subheadline, landing_about, landing_cta_label, landing_theme, landing_hero_image_url")
        .eq("landing_slug", slug)
        .eq("landing_enabled", true)
        .maybeSingle();
      setProfile(data as LandingProfile | null);
      setLoading(false);
    })();
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_requests").insert({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        message: form.message || null,
        referral_contractor_id: profile.id,
        source: `landing:${profile.landing_slug}`,
      });
      if (error) throw error;
      toast.success("Thanks! The contractor will reach out shortly.");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (e: any) {
      toast.error(e.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Page not found</h1>
          <p className="text-muted-foreground mb-4">This landing page is not active.</p>
          <Button asChild><Link to="/directory">Browse contractors</Link></Button>
        </div>
      </div>
    );
  }

  const theme = themes[profile.landing_theme || "forest"] || themes.forest;
  const gallery: string[] = Array.isArray(profile.profile_gallery)
    ? profile.profile_gallery.map((g: any) => (typeof g === "string" ? g : g?.url)).filter(Boolean)
    : [];
  const refs: any[] = Array.isArray(profile.client_references) ? profile.client_references : [];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{profile.company_name} — {profile.category}</title>
        <meta name="description" content={profile.landing_subheadline || `${profile.company_name} — verified ${profile.category} on Global Contractor Network.`} />
        <link rel="canonical" href={`${window.location.origin}/c/${profile.landing_slug}`} />
      </Helmet>

      {/* Hero */}
      <section className={`relative bg-gradient-to-br ${theme.bg} ${theme.heroText}`}>
        {profile.landing_hero_image_url && (
          <div className="absolute inset-0 opacity-30">
            <img src={profile.landing_hero_image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative container py-20 md:py-28 max-w-5xl">
          <div className="flex items-center gap-4 mb-8">
            {profile.logo_url && <img src={profile.logo_url} alt="" className="h-14 w-14 rounded bg-white p-1" />}
            <div>
              <div className="text-sm opacity-80">{profile.category}</div>
              <div className="text-2xl font-bold">{profile.company_name}</div>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            {profile.landing_headline || `Quality ${profile.category} you can trust`}
          </h1>
          {profile.landing_subheadline && (
            <p className="mt-4 text-lg md:text-xl opacity-90 max-w-2xl">{profile.landing_subheadline}</p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#contact">
              <Button size="lg" className={theme.accent}>{profile.landing_cta_label || "Request a Quote"}</Button>
            </a>
            {profile.phone && (
              <Button size="lg" variant="outline" asChild className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <a href={`tel:${profile.phone}`}><Phone className="h-4 w-4 mr-2" />{profile.phone}</a>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* About */}
      {profile.landing_about && (
        <section className="container max-w-3xl py-16">
          <h2 className="text-3xl font-bold mb-4">About</h2>
          <p className="text-lg text-muted-foreground whitespace-pre-line">{profile.landing_about}</p>
        </section>
      )}

      {/* Service area */}
      {profile.service_area && profile.service_area.length > 0 && (
        <section className="container max-w-5xl pb-12">
          <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2"><MapPin className="h-5 w-5" /> Service area</h2>
          <div className="flex flex-wrap gap-2">
            {profile.service_area.map((a, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-muted text-sm">{a}</span>
            ))}
          </div>
        </section>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="container max-w-6xl pb-16">
          <h2 className="text-3xl font-bold mb-6">Recent work</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {gallery.slice(0, 9).map((url, i) => (
              <img key={i} src={url} alt={`Project ${i + 1}`} className="rounded-lg aspect-square object-cover" />
            ))}
          </div>
        </section>
      )}

      {/* References */}
      {refs.length > 0 && (
        <section className="container max-w-5xl pb-16">
          <h2 className="text-3xl font-bold mb-6">What clients say</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {refs.slice(0, 4).map((r, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, s) => <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="italic">"{r.testimonial || r.quote || r.notes || "Great work, would recommend."}"</p>
                  <p className="mt-2 text-sm text-muted-foreground">— {r.name || r.client_name || "Verified client"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Contact form */}
      <section id="contact" className="bg-muted/40 py-20">
        <div className="container max-w-2xl">
          <Card>
            <CardContent className="pt-8">
              <h2 className="text-3xl font-bold mb-2">{profile.landing_cta_label || "Request a Quote"}</h2>
              <p className="text-muted-foreground mb-6">Send a quick message — we'll get back to you within one business day.</p>
              <form onSubmit={submit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Name *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
                <div><Label>Email *</Label><Input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>How can we help?</Label><Textarea rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></div>
                <Button type="submit" className={`w-full ${theme.accent}`} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {profile.landing_cta_label || "Send message"}
                </Button>
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                  <CheckCircle2 className="h-3 w-3" /> Verified contractor on Global Contractor Network
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Powered by{" "}
        <Link to="/" className="text-primary hover:underline inline-flex items-center gap-1">
          Global Contractor Network <ExternalLink className="h-3 w-3" />
        </Link>
      </footer>
    </div>
  );
}
