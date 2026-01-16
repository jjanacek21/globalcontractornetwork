import { AlertTriangle, FileWarning, Info, CheckCircle, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useJurisdictionRulesEngine, JurisdictionRule } from '@/hooks/useJurisdictionRulesEngine';
import { cn } from '@/lib/utils';

interface JurisdictionRulesPanelProps {
  county: string;
  city?: string | null;
  permitType?: string;
  isHVHZ?: boolean;
  showGotchas?: boolean;
  showRequirements?: boolean;
  showDocuments?: boolean;
  compact?: boolean;
  className?: string;
}

export function JurisdictionRulesPanel({
  county,
  city,
  permitType,
  isHVHZ = false,
  showGotchas = true,
  showRequirements = true,
  showDocuments = true,
  compact = false,
  className,
}: JurisdictionRulesPanelProps) {
  const { 
    loading, 
    getGotchas, 
    getRequirements, 
    getDocumentRequirements 
  } = useJurisdictionRulesEngine();

  if (!county) return null;

  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const gotchas = showGotchas ? getGotchas(county, permitType, city) : [];
  const requirements = showRequirements ? getRequirements(county, permitType, city) : [];
  const documentRules = showDocuments ? getDocumentRequirements(county, permitType, city) : [];

  const hasRules = gotchas.length > 0 || requirements.length > 0 || documentRules.length > 0;

  if (!hasRules) {
    return (
      <Alert className={cn("border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950", className)}>
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-800 dark:text-green-200">No Special Requirements</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          {county} does not have any special requirements for {permitType || 'this permit type'}.
        </AlertDescription>
      </Alert>
    );
  }

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {gotchas.map((rule) => (
          <RuleAlert key={rule.id} rule={rule} type="gotcha" />
        ))}
        {requirements.map((rule) => (
          <RuleAlert key={rule.id} rule={rule} type="requirement" />
        ))}
        {documentRules.map((rule) => (
          <RuleAlert key={rule.id} rule={rule} type="document" />
        ))}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Jurisdiction Requirements
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">{county}</Badge>
            {city && <Badge variant="secondary">{city}</Badge>}
            {isHVHZ && <Badge variant="destructive">HVHZ Zone</Badge>}
          </div>
        </div>
        <CardDescription>
          Important rules and requirements for {permitType || 'permits'} in this jurisdiction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gotchas Section */}
        {gotchas.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <FileWarning className="h-4 w-4" />
              Watch Out For ({gotchas.length})
            </h4>
            <div className="space-y-2 pl-6">
              {gotchas.map((rule) => (
                <RuleItem key={rule.id} rule={rule} />
              ))}
            </div>
          </div>
        )}

        {/* Requirements Section */}
        {requirements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Requirements ({requirements.length})
            </h4>
            <div className="space-y-2 pl-6">
              {requirements.map((rule) => (
                <RuleItem key={rule.id} rule={rule} />
              ))}
            </div>
          </div>
        )}

        {/* Document Requirements Section */}
        {documentRules.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Required Documents ({documentRules.length})
            </h4>
            <div className="space-y-2 pl-6">
              {documentRules.map((rule) => (
                <div key={rule.id} className="flex items-start gap-2 text-sm">
                  <span className="text-destructive font-medium">•</span>
                  <div>
                    <span className="font-medium">{rule.document_required}</span>
                    {rule.rule_description && (
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {rule.rule_description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RuleItem({ rule }: { rule: JurisdictionRule }) {
  return (
    <div className="text-sm">
      <p className="text-foreground">{rule.rule_description}</p>
      {rule.permit_types && rule.permit_types.length > 0 && (
        <div className="flex gap-1 mt-1">
          {rule.permit_types.map((type) => (
            <Badge key={type} variant="outline" className="text-xs capitalize">
              {type.replace('_', ' ')}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function RuleAlert({ 
  rule, 
  type 
}: { 
  rule: JurisdictionRule; 
  type: 'gotcha' | 'requirement' | 'document';
}) {
  const variants = {
    gotcha: {
      className: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950',
      icon: <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
      titleClass: 'text-amber-800 dark:text-amber-200',
      descClass: 'text-amber-700 dark:text-amber-300',
    },
    requirement: {
      className: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950',
      icon: <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
      titleClass: 'text-blue-800 dark:text-blue-200',
      descClass: 'text-blue-700 dark:text-blue-300',
    },
    document: {
      className: 'border-destructive/50 bg-destructive/5',
      icon: <FileText className="h-4 w-4 text-destructive" />,
      titleClass: 'text-destructive',
      descClass: 'text-destructive/80',
    },
  };

  const v = variants[type];

  return (
    <Alert className={v.className}>
      {v.icon}
      {type === 'document' && rule.document_required ? (
        <>
          <AlertTitle className={v.titleClass}>Required: {rule.document_required}</AlertTitle>
          <AlertDescription className={v.descClass}>{rule.rule_description}</AlertDescription>
        </>
      ) : (
        <>
          <AlertTitle className={v.titleClass}>{rule.county} {type === 'gotcha' ? 'Notice' : 'Requirement'}</AlertTitle>
          <AlertDescription className={v.descClass}>{rule.rule_description}</AlertDescription>
        </>
      )}
    </Alert>
  );
}
