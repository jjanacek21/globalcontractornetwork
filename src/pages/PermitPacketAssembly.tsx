import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, MapPin, User, Building2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PacketAssemblyChecklist } from '@/components/permit-queens/PacketAssemblyChecklist';
import type { PacketDocument } from '@/components/permit-queens/PacketDocumentRow';
import { toast } from 'sonner';

// Document type name mapping (matches edge function)
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
  form_100_shingle: 'Form 100 - Reroofing Summary (Shingle)',
  form_300_metal: 'Form 300 - Reroofing Summary (Metal)',
  underlayment_options: 'Underlayment Options Selection',
  skylight_noa: 'Skylight NOA',
  change_of_plan: 'Change of Plan Submittal',
};

export default function PermitPacketAssembly() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [documents, setDocuments] = useState<PacketDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjectAndStructure = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);

    try {
      // Fetch project
      const { data: proj, error: projErr } = await supabase
        .from('permit_projects')
        .select('*')
        .eq('id', projectId)
        .single();
      if (projErr || !proj) throw new Error('Project not found');
      setProject(proj);

      const county = proj.jurisdiction_county || '';
      const city = proj.city || '';
      const tradeType = proj.permit_type || proj.service_type || 'roofing';
      const materialType = proj.new_roof_material || '';

      // Look up packet structure: city-specific first, then county default
      let structure: any = null;
      
      if (city) {
        const { data } = await supabase
          .from('permit_packet_structures')
          .select('document_structure, conditional_documents')
          .eq('county', county)
          .eq('city', city)
          .eq('trade_type', tradeType)
          .eq('is_active', true)
          .single();
        structure = data;
      }

      if (!structure) {
        // Try with material_type match
        if (materialType) {
          const { data } = await supabase
            .from('permit_packet_structures')
            .select('document_structure, conditional_documents')
            .eq('county', county)
            .is('city', null)
            .eq('trade_type', tradeType)
            .eq('material_type', materialType.toLowerCase().includes('metal') ? 'metal' : 'shingle')
            .eq('is_active', true)
            .single();
          structure = data;
        }
        
        // Fallback to generic county structure
        if (!structure) {
          const { data } = await supabase
            .from('permit_packet_structures')
            .select('document_structure, conditional_documents')
            .eq('county', county)
            .is('city', null)
            .eq('trade_type', tradeType)
            .is('material_type', null)
            .eq('is_active', true)
            .single();
          structure = data;
        }
      }

      // Fetch uploaded documents for this project
      const { data: uploadedDocs } = await supabase
        .from('permit_project_documents')
        .select('document_type, file_path')
        .eq('project_id', projectId);

      // Fetch selected products from project
      let productMatches = (proj.selected_products as any[]) || [];

      // Fallback: auto-match from product_approvals table when no products selected
      if (productMatches.length === 0) {
        const { data: approvals } = await supabase
          .from('product_approvals')
          .select('id, manufacturer, product_name, noa_number, file_url, product_category')
          .eq('is_active', true)
          .not('file_url', 'is', null)
          .limit(500);

        productMatches = (approvals || []).map(a => ({
          id: a.id,
          manufacturer: a.manufacturer,
          product_name: a.product_name,
          noa_number: a.noa_number,
          file_url: a.file_url,
          category: a.product_category,
        }));
      }

      // Fetch firecrawl-discovered templates for this county
      const { data: firecrawlTemplates } = await supabase
        .from('permit_form_templates')
        .select('id, form_name, document_classification, file_path, source')
        .eq('source', 'firecrawl')
        .eq('county', county);

      // Build document list from structure
      const docs: PacketDocument[] = [];
      const structureDocs = (structure?.document_structure || []) as any[];
      const conditionalDocs = (structure?.conditional_documents || []) as any[];

      for (const item of structureDocs) {
        const docName = DOC_TYPE_NAMES[item.type] || item.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        
        let status: PacketDocument['status'] = 'pending';
        let url: string | undefined;
        let noaNumber: string | undefined;

        if (item.source === 'generated') {
          status = 'ready';
        } else if (item.source === 'auto_fill') {
          status = item.needs_signature ? 'needs_signature' : 'ready';
        } else if (item.source === 'user_upload') {
          const uploaded = uploadedDocs?.find(d => d.document_type === item.type);
          if (uploaded) {
            status = 'ready';
            url = uploaded.file_path;
          } else {
            status = 'missing';
          }
        } else if (item.source === 'auto_source') {
          const matchingProduct = productMatches.find((p: any) => {
            if (item.product_category) {
              return (p.category || p.product_category || '').toLowerCase().includes(item.product_category);
            }
            return true;
          });

          if (matchingProduct?.file_url) {
            status = 'ready';
            url = matchingProduct.file_url;
            noaNumber = matchingProduct.noa_number;
          } else if (matchingProduct?.noa_number) {
            status = 'needs_sourcing';
            noaNumber = matchingProduct.noa_number;
          } else {
            status = 'needs_sourcing';
          }
        } else if (item.source === 'city_specific') {
          status = 'pending';
        }

        docs.push({
          order: item.order,
          type: item.type,
          name: docName,
          source: item.source,
          status,
          pages: item.pages,
          url,
          noaNumber,
          condition: item.condition,
          requiresNotary: item.needs_notary,
          requiresRecording: item.requires_recording,
          productCategory: item.product_category,
        });
      }

      // Add conditional documents
      for (const item of conditionalDocs) {
        const docName = DOC_TYPE_NAMES[item.type] || item.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        const conditionMet = evaluateCondition(item.condition, proj);
        
        const uploaded = uploadedDocs?.find(d => d.document_type === item.type);

        docs.push({
          order: docs.length + 1,
          type: item.type,
          name: docName,
          source: 'conditional',
          status: uploaded ? 'ready' : conditionMet ? 'missing' : 'not_required',
          pages: item.pages || 1,
          url: uploaded?.file_path,
          condition: item.condition,
          requiresNotary: item.needs_notary,
        });
      }

      // Add firecrawl auto-discovered documents
      for (const fcTemplate of (firecrawlTemplates || [])) {
        docs.push({
          order: docs.length + 1,
          type: fcTemplate.document_classification || 'permit_application',
          name: `${fcTemplate.form_name}`,
          source: 'auto_fill',
          status: fcTemplate.file_path ? 'ready' : 'pending',
          pages: 1,
          url: fcTemplate.file_path,
          isFirecrawlDiscovered: true,
        });
      }

      setDocuments(docs);
    } catch (err: any) {
      console.error('Load error:', err);
      toast.error(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProjectAndStructure();
  }, [loadProjectAndStructure]);

  if (loading) {
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
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Permit Packet Assembly</h1>
            <p className="text-sm text-muted-foreground">
              Build and assemble the complete permit submission packet
            </p>
          </div>
        </div>

        {/* Project Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                Property
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
                <Building2 className="h-4 w-4 text-primary" />
                Permit Details
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
                <User className="h-4 w-4 text-primary" />
                Owner
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

        {/* Assembly Checklist */}
        <PacketAssemblyChecklist
          projectId={projectId!}
          documents={documents}
          onDocumentPreview={(doc) => {
            if (doc.url) {
              window.open(doc.url, '_blank');
            } else {
              toast.info('Preview not available yet — generate the form first.');
            }
          }}
          onDocumentUpload={(doc) => {
            toast.info(`Upload ${doc.name} from the project wizard upload step.`);
          }}
          onSelectProduct={(doc) => {
            toast.info(`Select a ${doc.productCategory || 'product'} from the Product Approvals library for ${doc.name}.`);
          }}
          onRefresh={loadProjectAndStructure}
        />
      </div>
    </div>
  );
}

function evaluateCondition(condition: string | undefined, project: any): boolean {
  if (!condition) return true;
  switch (condition) {
    case 'if_hoa': return project.hoa_approval === true;
    case 'if_skylights': return (project.obstacles || '').toLowerCase().includes('skylight');
    case 'if_pre_1988': return (project.year_built || 9999) < 1988;
    case 'if_pre_1994': return (project.year_built || 9999) < 1994;
    case 'if_change_of_plan': return false; // Manual toggle
    default: return true;
  }
}
