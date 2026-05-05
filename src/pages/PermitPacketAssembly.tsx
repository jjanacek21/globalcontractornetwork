import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, MapPin, User, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PacketAssemblyChecklist } from '@/components/permit-queens/PacketAssemblyChecklist';
import type { PacketDocument } from '@/components/permit-queens/PacketDocumentRow';
import { useResolvedRequiredForms } from '@/hooks/useResolvedRequiredForms';
import { runAutoFill } from '@/lib/permitAutoFill';
import { toast } from 'sonner';

const DOC_TYPE_NAMES: Record<string, string> = {
  cover_sheet: 'Cover Sheet',
  property_appraiser_summary: 'Property Appraiser Summary',
  permit_application: 'Permit Application',
  noc: 'Notice of Commencement',
  owner_authorization: 'Owner Authorization Letter',
  signed_contract: 'Signed Contract',
  coi: 'Certificate of Insurance',
  contractor_license: 'Contractor License',
  product_approvals: 'Product Approvals (NOAs)',
  roof_layout: 'Roof Layout / Measurement Report',
  site_photos: 'Property Photos',
  hvhz_section_d: 'HVHZ Section D - Steep Slope',
  section_1524: 'Section 1524 Owner Notification',
  roof_to_wall_mitigation: 'RTW Mitigation Letter (15% Threshold)',
  roof_to_wall_affidavit: 'Roof-to-Wall Connection Affidavit',
  hoa_affidavit: 'HOA Awareness Affidavit',
  city_supplement: 'City Supplemental Form',
  underlayment_fpa: 'Underlayment FL Product Approval',
  underlayment_pe_evaluation: 'Underlayment P.E. Evaluation Report',
  compliance_statement: 'Roofing Compliance Statement',
  roofing_material_fpa: 'Roofing Material Product Approval',
  fastening_patterns: 'Fastening Pattern Documentation',
  impact_test_report: 'Impact Test Report (UL 2218)',
};

function mapStatus(s: string): PacketDocument['status'] {
  switch (s) {
    case 'included': return 'ready';
    case 'sourcing': return 'needs_sourcing';
    case 'upload_required':
    case 'missing_pdf': return 'missing';
    default: return 'pending';
  }
}

export default function PermitPacketAssembly() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { items, projectHash, loading: resolving, refresh } = useResolvedRequiredForms(projectId);
  const [filling, setFilling] = useState(false);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data: proj, error } = await supabase
        .from('permit_projects')
        .select('*')
        .eq('id', projectId)
        .single();
      if (error || !proj) throw new Error('Project not found');
      setProject(proj);
    } catch (err: any) {
      console.error('Load error:', err);
      toast.error(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadProject(); }, [loadProject]);

  useEffect(() => {
    if (!projectId || !projectHash || resolving || filling) return;
    const needs = items.some(
      (i) => i.template_id && i.field_mapping && i.source === 'auto_fill' && i.cached_hash !== projectHash,
    );
    if (!needs) return;
    let cancelled = false;
    (async () => {
      setFilling(true);
      await runAutoFill(projectId, items, projectHash);
      if (!cancelled) {
        setFilling(false);
        await refresh();
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projectHash]);

  const documents: PacketDocument[] = useMemo(() => items
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      order: item.order,
      type: item.doc_type,
      name: item.template_name || DOC_TYPE_NAMES[item.doc_type] || item.doc_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      source: item.source as any,
      status: mapStatus(item.status),
      pages: item.meta?.pages ?? 1,
      url: item.file_path ?? undefined,
      condition: item.meta?.condition,
      requiresNotary: item.needs_notary,
      requiresRecording: item.meta?.requires_recording,
      productCategory: item.meta?.product_category,
    })), [items]);

  if (loading || (resolving && !project)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Permit Packet Assembly</h1>
            <p className="text-sm text-muted-foreground">
              Build and assemble the complete permit submission packet
              {filling && <span className="ml-2 text-primary">• AI-filling forms…</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />Property
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{project.property_address}</p>
              <p className="text-muted-foreground">{project.city}, FL {project.zip_code}</p>
              <div className="flex gap-1.5 mt-2">
                <Badge variant="outline" className="text-[10px]">{project.jurisdiction_county || 'N/A'}</Badge>
                {project.is_hvhz && <Badge className="text-[10px] bg-amber-500">HVHZ</Badge>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-primary" />Permit Details
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium capitalize">{(project.permit_type || project.service_type || '').replace(/_/g, ' ')}</p>
              <p className="text-muted-foreground">{project.new_roof_material || project.roof_type || 'Not specified'}</p>
              {project.valuation && (
                <p className="text-muted-foreground mt-1">Value: ${Number(project.valuation).toLocaleString()}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <User className="h-4 w-4 text-primary" />Owner
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{project.owner_name || project.customer_name || 'Not provided'}</p>
              <p className="text-muted-foreground">{project.owner_phone || project.customer_phone || ''}</p>
              <p className="text-muted-foreground truncate">{project.owner_email || project.customer_email || ''}</p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <PacketAssemblyChecklist
          projectId={projectId!}
          documents={documents}
          onDocumentPreview={(doc) => {
            if (doc.url) window.open(doc.url, '_blank');
            else toast.info('Preview not available yet — generate the form first.');
          }}
          onDocumentUpload={(doc) => toast.info(`Upload ${doc.name} from the project wizard upload step.`)}
          onSelectProduct={(doc) => toast.info(`Select a ${doc.productCategory || 'product'} from the Product Approvals library for ${doc.name}.`)}
          onRefresh={refresh}
        />
      </div>
    </div>
  );
}
