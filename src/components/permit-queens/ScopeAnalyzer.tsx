import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExtractedData {
  projectSquareFootage?: number;
  materialType?: string;
  projectDetails?: string[];
  estimatedComplexity?: string;
  requiredDocuments?: string[];
  suggestedValuation?: number;
  additionalNotes?: string;
}

interface ScopeAnalyzerProps {
  scopeDescription: string;
  permitType: string;
  jurisdiction: string;
  onScopeChange: (scope: string) => void;
  onExtractedDataChange: (data: ExtractedData) => void;
  extractedData: ExtractedData | null;
}

export function ScopeAnalyzer({
  scopeDescription,
  permitType,
  jurisdiction,
  onScopeChange,
  onExtractedDataChange,
  extractedData,
}: ScopeAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeScope = async () => {
    if (!scopeDescription.trim()) {
      toast.error('Please enter a scope description first');
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('permit-intake-ai', {
        body: {
          scopeDescription,
          permitType,
          jurisdiction,
        },
      });

      if (error) throw error;

      if (data) {
        onExtractedDataChange({
          projectSquareFootage: data.extractedData?.squareFootage,
          materialType: data.extractedData?.materialType,
          projectDetails: data.extractedData?.projectDetails || [],
          estimatedComplexity: data.complexity || 'standard',
          requiredDocuments: data.requiredDocuments || [],
          suggestedValuation: data.estimatedValuation,
          additionalNotes: data.additionalNotes,
        });
        toast.success('AI analysis complete!');
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error('Failed to analyze scope. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Scope of Work</Label>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="w-3 h-3" />
            AI-Powered
          </Badge>
        </div>
        <Textarea
          value={scopeDescription}
          onChange={(e) => onScopeChange(e.target.value)}
          placeholder="Describe the project scope in detail. For example:

Full re-roof, 32 squares, removing existing 3-tab shingles and installing GAF Timberline HDZ architectural shingles. Includes new underlayment, flashing, and drip edge. 2-story home, 4/12 pitch, no skylights."
          className="min-h-[180px] text-base"
        />
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Be as detailed as possible. Our AI will extract key information automatically.
          </p>
          <Button
            onClick={analyzeScope}
            disabled={analyzing || !scopeDescription.trim()}
            className="gap-2"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze with AI
              </>
            )}
          </Button>
        </div>
      </div>

      {extractedData && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              AI Extracted Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {extractedData.projectSquareFootage && (
                <div>
                  <Label className="text-sm text-muted-foreground">Square Footage</Label>
                  <Input
                    value={extractedData.projectSquareFootage}
                    readOnly
                    className="mt-1 bg-background"
                  />
                </div>
              )}
              {extractedData.materialType && (
                <div>
                  <Label className="text-sm text-muted-foreground">Material Type</Label>
                  <Input
                    value={extractedData.materialType}
                    readOnly
                    className="mt-1 bg-background"
                  />
                </div>
              )}
              {extractedData.suggestedValuation && (
                <div>
                  <Label className="text-sm text-muted-foreground">Estimated Valuation</Label>
                  <Input
                    value={`$${extractedData.suggestedValuation.toLocaleString()}`}
                    readOnly
                    className="mt-1 bg-background"
                  />
                </div>
              )}
              {extractedData.estimatedComplexity && (
                <div>
                  <Label className="text-sm text-muted-foreground">Complexity Tier</Label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        extractedData.estimatedComplexity === 'complex' ? 'destructive' :
                        extractedData.estimatedComplexity === 'standard' ? 'default' : 'secondary'
                      }
                      className="text-sm"
                    >
                      {extractedData.estimatedComplexity.charAt(0).toUpperCase() + 
                       extractedData.estimatedComplexity.slice(1)}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {extractedData.projectDetails && extractedData.projectDetails.length > 0 && (
              <div>
                <Label className="text-sm text-muted-foreground">Project Details</Label>
                <ul className="mt-2 space-y-1">
                  {extractedData.projectDetails.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {extractedData.requiredDocuments && extractedData.requiredDocuments.length > 0 && (
              <div>
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Required Documents for This Project
                </Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {extractedData.requiredDocuments.map((doc, idx) => (
                    <Badge key={idx} variant="outline">
                      {doc}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {extractedData.additionalNotes && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{extractedData.additionalNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
