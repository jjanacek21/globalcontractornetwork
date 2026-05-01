import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle2, AlertTriangle, Shield, Package, Loader2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PacketContentsPreviewProps {
  jurisdictionCounty: string;
  permitType: string;
  isHVHZ: boolean;
  uploadedDocumentCount: number;
  selectedMaterialCount: number;
  hasOwnerInfo: boolean;
  hasContractorInfo: boolean;
}

interface ExpectedDocument {
  name: string;
  source: 'template' | 'upload' | 'generated' | 'product' | 'firecrawl';
  status: 'ready' | 'pending' | 'missing';
  required: boolean;
  unmapped?: boolean; // template exists but has 0 field mappings → will print blank
}

export function PacketContentsPreview({
  jurisdictionCounty,
  permitType,
  isHVHZ,
  uploadedDocumentCount,
  selectedMaterialCount,
  hasOwnerInfo,
  hasContractorInfo,
}: PacketContentsPreviewProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [firecrawlTemplates, setFirecrawlTemplates] = useState<any[]>([]);
  const [mappingCounts, setMappingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!jurisdictionCounty) {
        setLoading(false);
        return;
      }

      try {
        // Fetch standard templates
        let query = supabase
          .from('permit_form_templates')
          .select('id, form_name, form_type, category, trade_types, hvhz_only, requires_signature, requires_notary, source')
          .or(`county.eq.${jurisdictionCounty},county.is.null`)
          .or('source.is.null,source.eq.manual,source.eq.imported')
          .order('category');

        if (!isHVHZ) {
          query = query.eq('hvhz_only', false);
        }

        const { data, error } = await query;
        if (error) throw error;

        const filtered = (data || []).filter(t => {
          if (t.trade_types && !t.trade_types.includes('*') && !t.trade_types.includes(permitType)) return false;
          return true;
        });
        setTemplates(filtered);

        // Fetch firecrawl-discovered templates for this county
        const { data: fcData, error: fcError } = await supabase
          .from('permit_form_templates')
          .select('id, form_name, document_classification, trade_types, hvhz_only, source')
          .eq('source', 'firecrawl')
          .eq('county', jurisdictionCounty);

        if (!fcError && fcData) {
          const fcFiltered = fcData.filter(t => {
            if (!isHVHZ && t.hvhz_only) return false;
            if (t.trade_types && !t.trade_types.includes('*') && !t.trade_types.includes(permitType)) return false;
            return true;
          });
          setFirecrawlTemplates(fcFiltered);
        }

        // Count field mappings per template so we can flag "Will print blank"
        const allIds = [...filtered.map(t => t.id), ...(fcData || []).map(t => t.id)];
        if (allIds.length > 0) {
          const { data: mappings } = await supabase
            .from('permit_field_mappings')
            .select('template_id')
            .in('template_id', allIds);
          const counts: Record<string, number> = {};
          (mappings || []).forEach((m: any) => {
            counts[m.template_id] = (counts[m.template_id] || 0) + 1;
          });
          setMappingCounts(counts);
        }
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [jurisdictionCounty, permitType, isHVHZ]);

  const expectedDocs: ExpectedDocument[] = [];

  // 1. Cover Sheet
  expectedDocs.push({ name: 'Cover Sheet & Document Index', source: 'generated', status: 'ready', required: true });

  // 2. Templates from DB
  templates.forEach(t => {
    const mapped = mappingCounts[t.id] || 0;
    expectedDocs.push({
      name: t.form_name,
      source: 'template',
      status: 'ready',
      required: true,
      unmapped: mapped === 0,
    });
  });

  // 3. Firecrawl auto-discovered templates
  firecrawlTemplates.forEach(t => {
    const mapped = mappingCounts[t.id] || 0;
    expectedDocs.push({
      name: t.form_name,
      source: 'firecrawl',
      status: 'ready',
      required: false,
      unmapped: mapped === 0,
    });
  });

  // 4. NOC
  if (['roofing', 'general_construction', 'windows_doors'].includes(permitType)) {
    expectedDocs.push({ name: 'Notice of Commencement (NOC)', source: 'generated', status: hasOwnerInfo ? 'ready' : 'pending', required: true });
  }

  // 5. Roofing Compliance
  if (permitType === 'roofing') {
    expectedDocs.push({ name: 'Roofing Compliance Statement', source: 'generated', status: 'ready', required: true });
  }

  // 6. Product NOAs
  if (selectedMaterialCount > 0) {
    expectedDocs.push({ name: `Product NOA Documents (${selectedMaterialCount})`, source: 'product', status: 'ready', required: isHVHZ });
  } else if (isHVHZ) {
    expectedDocs.push({ name: 'Product NOA Documents', source: 'product', status: 'missing', required: true });
  }

  // 7. Uploads
  if (uploadedDocumentCount > 0) {
    expectedDocs.push({ name: `Uploaded Documents (${uploadedDocumentCount})`, source: 'upload', status: 'ready', required: false });
  }

  // 8. Contractor license
  expectedDocs.push({ name: 'Contractor License & Insurance', source: 'upload', status: hasContractorInfo ? 'ready' : 'pending', required: true });

  const readyCount = expectedDocs.filter(d => d.status === 'ready').length;
  const missingCount = expectedDocs.filter(d => d.status === 'missing' && d.required).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Loading packet contents...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          Packet Contents Preview
        </CardTitle>
        <CardDescription>
          {readyCount} of {expectedDocs.length} documents ready
          {missingCount > 0 && ` • ${missingCount} required items missing`}
          {firecrawlTemplates.length > 0 && ` • ${firecrawlTemplates.length} auto-discovered`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {expectedDocs.map((doc, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center justify-between p-2.5 rounded-lg border text-sm",
                doc.status === 'ready' && "bg-muted/30 border-border",
                doc.status === 'pending' && "bg-amber-500/5 border-amber-200",
                doc.status === 'missing' && doc.required && "bg-destructive/5 border-destructive/20",
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {doc.status === 'ready' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : doc.status === 'missing' && doc.required ? (
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                <span className="truncate">{doc.name}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {doc.required && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">Required</Badge>
                )}
                {doc.source === 'generated' && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Auto-generated</Badge>
                )}
                {doc.source === 'template' && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Smart Form</Badge>
                )}
                {doc.source === 'firecrawl' && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-purple-500/10 text-purple-600 border-purple-200">
                    <Search className="h-2.5 w-2.5 mr-0.5" />
                    Auto-Discovered
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {isHVHZ && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-md">
            <Shield className="h-3.5 w-3.5 shrink-0" />
            HVHZ zone — all products must have valid NOA approvals
          </div>
        )}
      </CardContent>
    </Card>
  );
}
