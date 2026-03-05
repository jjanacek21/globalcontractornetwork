import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle2, AlertTriangle, Shield, Package, Loader2 } from 'lucide-react';
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
  source: 'template' | 'upload' | 'generated' | 'product';
  status: 'ready' | 'pending' | 'missing';
  required: boolean;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!jurisdictionCounty) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('permit_form_templates')
          .select('id, form_name, form_type, category, trade_types, hvhz_only, requires_signature, requires_notary')
          .or(`jurisdiction_name.ilike.%${jurisdictionCounty}%,jurisdiction_name.eq.Statewide`)
          .order('category');

        if (error) throw error;

        // Filter by trade type
        const filtered = (data || []).filter(t => {
          if (t.hvhz_only && !isHVHZ) return false;
          if (t.trade_types && !t.trade_types.includes('*') && !t.trade_types.includes(permitType)) return false;
          return true;
        });

        setTemplates(filtered);
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [jurisdictionCounty, permitType, isHVHZ]);

  // Build the expected document list
  const expectedDocs: ExpectedDocument[] = [];

  // 1. Cover Sheet (always generated)
  expectedDocs.push({
    name: 'Cover Sheet & Document Index',
    source: 'generated',
    status: 'ready',
    required: true,
  });

  // 2. Templates from DB
  templates.forEach(t => {
    expectedDocs.push({
      name: t.form_name,
      source: 'template',
      status: 'ready',
      required: true,
    });
  });

  // 3. NOC (generated for most permit types)
  if (['roofing', 'general_construction', 'windows_doors'].includes(permitType)) {
    expectedDocs.push({
      name: 'Notice of Commencement (NOC)',
      source: 'generated',
      status: hasOwnerInfo ? 'ready' : 'pending',
      required: true,
    });
  }

  // 4. Roofing Compliance Statement
  if (permitType === 'roofing') {
    expectedDocs.push({
      name: 'Roofing Compliance Statement',
      source: 'generated',
      status: 'ready',
      required: true,
    });
  }

  // 5. Product NOA documents
  if (selectedMaterialCount > 0) {
    expectedDocs.push({
      name: `Product NOA Documents (${selectedMaterialCount})`,
      source: 'product',
      status: 'ready',
      required: isHVHZ,
    });
  } else if (isHVHZ) {
    expectedDocs.push({
      name: 'Product NOA Documents',
      source: 'product',
      status: 'missing',
      required: true,
    });
  }

  // 6. Contractor uploads
  if (uploadedDocumentCount > 0) {
    expectedDocs.push({
      name: `Uploaded Documents (${uploadedDocumentCount})`,
      source: 'upload',
      status: 'ready',
      required: false,
    });
  }

  // 7. Contractor license & insurance
  expectedDocs.push({
    name: 'Contractor License & Insurance',
    source: 'upload',
    status: hasContractorInfo ? 'ready' : 'pending',
    required: true,
  });

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
