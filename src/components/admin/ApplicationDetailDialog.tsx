import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, Mail, Phone, Globe, MapPin, FileText, ShieldCheck,
  CheckCircle2, XCircle, Image as ImageIcon, Users, Link as LinkIcon, ExternalLink
} from "lucide-react";

interface ApplicationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractorId: string | null;
  companyId: string | null;
  footer?: React.ReactNode;
}

export function ApplicationDetailDialog({
  open, onOpenChange, contractorId, companyId, footer,
}: ApplicationDetailDialogProps) {
  const [loading, setLoading] = useState(true);
  const [contractor, setContractor] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);

  useEffect(() => {
    if (!open || !contractorId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: cp }, { data: co }, { data: dList }] = await Promise.all([
        supabase.from("contractor_profiles").select("*").eq("id", contractorId).maybeSingle(),
        companyId
          ? supabase.from("companies").select("*").eq("id", companyId).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("contractor_documents")
          .select("*")
          .or(`contractor_id.eq.${contractorId}${companyId ? `,company_id.eq.${companyId}` : ""}`)
          .order("uploaded_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setContractor(cp);
      setCompany(co);
      setDocs(dList || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, contractorId, companyId]);

  const c = company || {};
  const cp = contractor || {};

  const checklist = [
    { ok: !!(c.license_number || (c.licenses && c.licenses.length)) || !!cp.license_number, label: "License on file" },
    { ok: !!(c.insurance_provider || c.insurance_document_url) || !!cp.insurance_info, label: "General liability insurance" },
    { ok: !c.has_crew || !!c.workers_comp_provider, label: c.has_crew ? "Workers comp (crew)" : "Workers comp not required" },
    { ok: ((c.client_references || cp.client_references || [])).length >= 3, label: "3+ client references" },
    { ok: ((c.job_photos || cp.profile_gallery || [])).length >= 5, label: "5+ job photos" },
    { ok: !!(c.address || c.city), label: "Business address" },
  ];
  const passing = checklist.every(i => i.ok);

  const socials: Record<string, string> = c.social_links || cp.social_links || {};
  const refs: any[] = c.client_references || cp.client_references || [];
  const photos: any[] = c.job_photos || cp.profile_gallery || [];
  const licenses: any[] = c.licenses || (cp.license_number ? [{ number: cp.license_number, state: cp.license_state, expiration: cp.license_expiration }] : []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {(c.logo_url || cp.logo_url) ? (
              <img src={c.logo_url || cp.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover border" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <span>{c.name || cp.company_name || "Application"}</span>
            {passing ? (
              <Badge className="bg-green-500/15 text-green-600 border-green-500/30">
                <ShieldCheck className="h-3 w-3 mr-1" />Eligible for Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-500/40 bg-amber-500/10">
                Missing items
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Full application review · Category: {cp.category || c.primary_category || "—"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="mt-2">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
              <TabsTrigger value="documents">Docs ({docs.length})</TabsTrigger>
              <TabsTrigger value="photos">Photos ({photos.length})</TabsTrigger>
              <TabsTrigger value="references">Refs ({refs.length})</TabsTrigger>
              <TabsTrigger value="social">Links</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Verification Checklist</CardTitle></CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-2 text-sm">
                  {checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {item.ok ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                      <span className={item.ok ? "" : "text-muted-foreground"}>{item.label}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Company Info</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Row icon={<MapPin className="h-4 w-4" />} label="Address">
                    {[c.address, c.city, c.state, c.zip_code].filter(Boolean).join(", ") || "—"}
                  </Row>
                  <Row icon={<Phone className="h-4 w-4" />} label="Phone">{c.phone || cp.phone || "—"}</Row>
                  <Row icon={<Mail className="h-4 w-4" />} label="Email">{c.email || cp.email || "—"}</Row>
                  <Row icon={<Globe className="h-4 w-4" />} label="Website">
                    {c.website || cp.website ? (
                      <a href={c.website || cp.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        {c.website || cp.website}
                      </a>
                    ) : "—"}
                  </Row>
                  <Row label="Years in business">{c.years_in_business ?? "—"}</Row>
                  <Row label="Yearly revenue">{c.yearly_revenue_range || "—"}</Row>
                  <Row label="Has crew">{c.has_crew ? "Yes" : "No"}</Row>
                  {(c.description || cp.description) && (
                    <div className="pt-2">
                      <p className="text-xs uppercase text-muted-foreground mb-1">Description</p>
                      <p className="leading-relaxed">{c.description || cp.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Credentials */}
            <TabsContent value="credentials" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Licenses</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {licenses.length === 0 && <p className="text-sm text-muted-foreground">No licenses provided.</p>}
                  {licenses.map((l: any, i: number) => (
                    <div key={i} className="border rounded-lg p-3 text-sm space-y-1">
                      <div className="flex justify-between"><span className="font-medium">License #{l.number || "—"}</span><Badge variant="outline">{l.state || "—"}</Badge></div>
                      {l.expiration && <p className="text-muted-foreground">Expires: {l.expiration}</p>}
                      {l.file_url && (
                        <a href={l.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <FileText className="h-3 w-3" /> View document
                        </a>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Insurance</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Row label="Provider">{c.insurance_provider || "—"}</Row>
                  <Row label="Policy #">{c.insurance_policy_number || "—"}</Row>
                  <Row label="Expires">{c.insurance_expiration || "—"}</Row>
                  {c.insurance_document_url && (
                    <a href={c.insurance_document_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      <FileText className="h-3 w-3" /> View insurance document
                    </a>
                  )}
                </CardContent>
              </Card>
              {c.has_crew && (
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base">Workers Compensation</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <Row label="Provider">{c.workers_comp_provider || "—"}</Row>
                    <Row label="Expires">{c.workers_comp_expiration || "—"}</Row>
                    {c.workers_comp_document_url && (
                      <a href={c.workers_comp_document_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <FileText className="h-3 w-3" /> View WC document
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="mt-4 space-y-3">
              {docs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No additional documents uploaded.</p>
              ) : docs.map((d: any) => (
                <Card key={d.id}>
                  <CardContent className="pt-4 text-sm flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{d.file_name || d.doc_type}</p>
                        <p className="text-xs text-muted-foreground capitalize">{d.doc_type.replace('_', ' ')} · {new Date(d.uploaded_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <a href={d.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline shrink-0">
                      <ExternalLink className="h-3 w-3" /> Open
                    </a>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Photos */}
            <TabsContent value="photos" className="mt-4">
              {photos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No job photos uploaded.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((p: any, i: number) => {
                    const url = typeof p === "string" ? p : (p.url || p.image_url);
                    const caption = typeof p === "object" ? (p.caption || p.projectType) : "";
                    return (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="block group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
                          {url ? <img src={url} alt={caption} className="w-full h-full object-cover group-hover:scale-105 transition" />
                            : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-6 w-6 text-muted-foreground" /></div>}
                        </div>
                        {caption && <p className="text-xs text-muted-foreground mt-1 truncate">{caption}</p>}
                      </a>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* References */}
            <TabsContent value="references" className="mt-4 space-y-3">
              {refs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No references provided.</p>
              ) : refs.map((r: any, i: number) => (
                <Card key={i}>
                  <CardContent className="pt-4 text-sm space-y-1">
                    <div className="flex items-center gap-2 font-medium"><Users className="h-4 w-4" />{r.name || `Reference ${i + 1}`}</div>
                    {r.phone && <p className="text-muted-foreground"><Phone className="h-3 w-3 inline mr-1" />{r.phone}</p>}
                    {r.email && <p className="text-muted-foreground"><Mail className="h-3 w-3 inline mr-1" />{r.email}</p>}
                    {(r.projectDescription || r.project_description) && (
                      <p className="pt-1">{r.projectDescription || r.project_description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Social */}
            <TabsContent value="social" className="mt-4">
              <Card>
                <CardContent className="pt-4 space-y-2 text-sm">
                  {Object.keys(socials).length === 0 ? (
                    <p className="text-muted-foreground">No social links provided.</p>
                  ) : Object.entries(socials).filter(([_, v]) => v).map(([k, v]) => (
                    <a key={k} href={v as string} target="_blank" rel="noreferrer"
                       className="flex items-center gap-2 text-primary hover:underline">
                      <LinkIcon className="h-4 w-4" /><span className="capitalize">{k}</span>
                      <ExternalLink className="h-3 w-3" />
                      <span className="text-muted-foreground truncate">{v as string}</span>
                    </a>
                  ))}
                  {c.google_business_url && (
                    <a href={c.google_business_url} target="_blank" rel="noreferrer"
                       className="flex items-center gap-2 text-primary hover:underline">
                      <Globe className="h-4 w-4" />Google Business
                    </a>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {footer && <div className="pt-4 border-t mt-4">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
}

function Row({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="text-muted-foreground mt-0.5">{icon}</span>}
      <span className="text-muted-foreground min-w-[110px]">{label}:</span>
      <span className="flex-1">{children}</span>
    </div>
  );
}
