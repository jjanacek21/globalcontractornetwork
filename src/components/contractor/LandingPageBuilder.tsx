import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Globe, ExternalLink, Loader2, Sparkles } from "lucide-react";

interface Props {
  profileId: string;
  userId: string;
  initialCompanyName?: string;
  existingWebsite?: string | null;
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);

export const LandingPageBuilder = ({ profileId, userId, initialCompanyName, existingWebsite }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    landing_enabled: false,
    landing_slug: "",
    landing_headline: "",
    landing_subheadline: "",
    landing_about: "",
    landing_cta_label: "Request a Quote",
    landing_theme: "forest",
    landing_hero_image_url: "",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("contractor_profiles")
        .select("landing_enabled, landing_slug, landing_headline, landing_subheadline, landing_about, landing_cta_label, landing_theme, landing_hero_image_url")
        .eq("id", profileId)
        .single();
      if (data) {
        setForm({
          landing_enabled: !!data.landing_enabled,
          landing_slug: data.landing_slug || slugify(initialCompanyName || ""),
          landing_headline: data.landing_headline || "",
          landing_subheadline: data.landing_subheadline || "",
          landing_about: data.landing_about || "",
          landing_cta_label: data.landing_cta_label || "Request a Quote",
          landing_theme: data.landing_theme || "forest",
          landing_hero_image_url: data.landing_hero_image_url || "",
        });
      }
      setLoading(false);
    })();
  }, [profileId, initialCompanyName]);

  const save = async (publish?: boolean) => {
    setSaving(true);
    try {
      const slug = slugify(form.landing_slug || initialCompanyName || "contractor");
      if (!slug) throw new Error("Pick a URL slug.");

      // Uniqueness check (allow current row)
      const { data: clash } = await supabase
        .from("contractor_profiles")
        .select("id")
        .eq("landing_slug", slug)
        .neq("id", profileId)
        .maybeSingle();
      if (clash) throw new Error("That URL is taken — try another slug.");

      const payload: any = { ...form, landing_slug: slug };
      if (publish !== undefined) {
        payload.landing_enabled = publish;
        if (publish) payload.landing_published_at = new Date().toISOString();
      }
      const { error } = await supabase.from("contractor_profiles").update(payload).eq("id", profileId);
      if (error) throw error;
      toast.success(publish === true ? "Landing page published!" : publish === false ? "Landing page unpublished" : "Saved");
      setForm(f => ({ ...f, landing_slug: slug, ...(publish !== undefined ? { landing_enabled: publish } : {}) }));
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const publicUrl = `${window.location.origin}/c/${form.landing_slug || "your-slug"}`;

  if (loading) return <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Your GCN Landing Page
          </CardTitle>
          <CardDescription>
            {existingWebsite
              ? <>You already have a website ({existingWebsite}). You can still publish a GCN landing page if you'd like a referral-friendly companion site.</>
              : <>You don't have a website yet — publish a free landing page tied to your directory listing in seconds.</>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <div className="font-medium flex items-center gap-2"><Globe className="h-4 w-4" /> Status</div>
              <div className="text-sm text-muted-foreground">
                {form.landing_enabled
                  ? <>Live at <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">{publicUrl}</a></>
                  : "Draft — not visible publicly yet"}
              </div>
            </div>
            <Badge variant={form.landing_enabled ? "default" : "outline"}>{form.landing_enabled ? "Published" : "Draft"}</Badge>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>URL slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">/c/</span>
                <Input value={form.landing_slug} onChange={e => setForm(f => ({ ...f, landing_slug: e.target.value }))} placeholder="your-business" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={form.landing_theme} onValueChange={v => setForm(f => ({ ...f, landing_theme: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="forest">Forest Green</SelectItem>
                  <SelectItem value="navy">Navy Trust</SelectItem>
                  <SelectItem value="charcoal">Charcoal Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Headline</Label>
            <Input value={form.landing_headline} onChange={e => setForm(f => ({ ...f, landing_headline: e.target.value }))} placeholder="Trusted local roofing — built to last" />
          </div>

          <div className="space-y-2">
            <Label>Sub-headline</Label>
            <Input value={form.landing_subheadline} onChange={e => setForm(f => ({ ...f, landing_subheadline: e.target.value }))} placeholder="Family-owned, fully insured, serving South Florida since 2008." />
          </div>

          <div className="space-y-2">
            <Label>About</Label>
            <Textarea rows={5} value={form.landing_about} onChange={e => setForm(f => ({ ...f, landing_about: e.target.value }))} placeholder="Tell visitors who you are, what you specialize in, and why they should call you." />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CTA button label</Label>
              <Input value={form.landing_cta_label} onChange={e => setForm(f => ({ ...f, landing_cta_label: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Hero image URL (optional)</Label>
              <Input value={form.landing_hero_image_url} onChange={e => setForm(f => ({ ...f, landing_hero_image_url: e.target.value }))} placeholder="https://..." />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={() => save()} variant="outline" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save draft
            </Button>
            {!form.landing_enabled ? (
              <Button onClick={() => save(true)} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Publish
              </Button>
            ) : (
              <>
                <Button onClick={() => save(false)} variant="ghost" disabled={saving}>Unpublish</Button>
                <Button asChild variant="secondary">
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" /> View live page
                  </a>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
