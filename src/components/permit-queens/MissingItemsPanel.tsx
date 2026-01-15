import { AlertCircle, CheckCircle2, AlertTriangle, FileText, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface MissingField {
  field: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface MissingDocument {
  docType: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface ComplianceIssue {
  issue: string;
  regulation: string;
  severity: 'critical' | 'warning' | 'info';
}

interface MissingItemsPanelProps {
  completionPercentage: number;
  missingFields: MissingField[];
  missingDocuments: MissingDocument[];
  complianceIssues: ComplianceIssue[];
  onUploadClick?: (docType: string) => void;
  onFieldClick?: (field: string) => void;
  className?: string;
}

const priorityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
};

const severityColors = {
  critical: 'bg-red-50 border-red-300 text-red-900',
  warning: 'bg-amber-50 border-amber-300 text-amber-900',
  info: 'bg-blue-50 border-blue-300 text-blue-900',
};

const formatDocType = (type: string): string => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatFieldName = (field: string): string => {
  return field
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function MissingItemsPanel({
  completionPercentage,
  missingFields,
  missingDocuments,
  complianceIssues,
  onUploadClick,
  onFieldClick,
  className,
}: MissingItemsPanelProps) {
  const isComplete = completionPercentage >= 100 && 
    missingFields.length === 0 && 
    missingDocuments.length === 0 && 
    complianceIssues.filter(i => i.severity === 'critical').length === 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Packet Status</CardTitle>
          <Badge variant={isComplete ? "default" : "secondary"} className={isComplete ? "bg-green-500" : ""}>
            {isComplete ? "Ready" : "In Progress"}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completion</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Compliance Issues */}
        {complianceIssues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Compliance Issues
            </h4>
            <div className="space-y-2">
              {complianceIssues.map((issue, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border text-sm",
                    severityColors[issue.severity]
                  )}
                >
                  <div className="font-medium">{issue.issue}</div>
                  <div className="text-xs mt-1 opacity-75">{issue.regulation}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Fields */}
        {missingFields.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-500" />
              Missing Information
            </h4>
            <div className="space-y-1.5">
              {missingFields.map((field, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-between p-2 rounded border text-sm cursor-pointer hover:bg-muted/50 transition-colors",
                    priorityColors[field.priority]
                  )}
                  onClick={() => onFieldClick?.(field.field)}
                >
                  <div>
                    <span className="font-medium">{formatFieldName(field.field)}</span>
                    <p className="text-xs mt-0.5 opacity-75">{field.reason}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {field.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Documents */}
        {missingDocuments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Upload className="h-4 w-4 text-blue-500" />
              Required Documents
            </h4>
            <div className="space-y-1.5">
              {missingDocuments.map((doc, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-between p-2 rounded border text-sm",
                    priorityColors[doc.priority]
                  )}
                >
                  <div className="flex-1">
                    <span className="font-medium">{formatDocType(doc.docType)}</span>
                    <p className="text-xs mt-0.5 opacity-75">{doc.reason}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2"
                    onClick={() => onUploadClick?.(doc.docType)}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Upload
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Complete */}
        {isComplete && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <div className="font-medium text-green-900">Packet Complete!</div>
              <div className="text-sm text-green-700">
                Ready for payment and submission
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
