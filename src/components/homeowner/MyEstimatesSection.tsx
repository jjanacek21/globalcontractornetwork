import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, Eye, Home, Paintbrush, Square, TreePine, AlertTriangle } from "lucide-react";
import { HomeownerEstimate } from "@/hooks/useHomeownerEstimates";
import { formatDistanceToNow } from "date-fns";

interface MyEstimatesSectionProps {
  estimates: HomeownerEstimate[];
  loading: boolean;
  onDownload: (estimate: HomeownerEstimate) => void;
  onView?: (estimate: HomeownerEstimate) => void;
}

const serviceIcons: Record<string, React.ReactNode> = {
  roofing: <Home className="h-4 w-4" />,
  coating: <Paintbrush className="h-4 w-4" />,
  windows: <Square className="h-4 w-4" />,
  landscaping: <TreePine className="h-4 w-4" />,
  emergency: <AlertTriangle className="h-4 w-4" />
};

const serviceColors: Record<string, string> = {
  roofing: "bg-primary/10 text-primary border-primary/20",
  coating: "bg-orange-100 text-orange-700 border-orange-200",
  windows: "bg-blue-100 text-blue-700 border-blue-200",
  landscaping: "bg-green-100 text-green-700 border-green-200",
  emergency: "bg-red-100 text-red-700 border-red-200"
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-green-100 text-green-700",
  signed: "bg-primary/10 text-primary",
  expired: "bg-red-100 text-red-700"
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const MyEstimatesSection = ({
  estimates,
  loading,
  onDownload,
  onView
}: MyEstimatesSectionProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            My Estimates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          My Estimates
        </CardTitle>
        <CardDescription>
          View and download your past estimates
        </CardDescription>
      </CardHeader>
      <CardContent>
        {estimates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No estimates yet</p>
            <p className="text-sm mt-1">Your estimate history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {estimates.map((estimate) => (
              <div
                key={estimate.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant="outline" 
                        className={`${serviceColors[estimate.service_type] || serviceColors.roofing} gap-1`}
                      >
                        {serviceIcons[estimate.service_type] || serviceIcons.roofing}
                        {estimate.service_type.charAt(0).toUpperCase() + estimate.service_type.slice(1)}
                      </Badge>
                      <Badge 
                        variant="secondary"
                        className={statusColors[estimate.status] || statusColors.draft}
                      >
                        {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                      </Badge>
                      {estimate.signed_at && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          ✓ Signed
                        </Badge>
                      )}
                    </div>
                    
                    <h4 className="font-medium truncate">{estimate.estimate_name}</h4>
                    
                    {estimate.property_address && (
                      <p className="text-sm text-muted-foreground truncate">
                        {estimate.property_address}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      {estimate.estimate_low && estimate.estimate_high && (
                        <span className="font-semibold text-primary">
                          {formatCurrency(estimate.estimate_low)} - {formatCurrency(estimate.estimate_high)}
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(estimate.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-shrink-0">
                    {onView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(estimate)}
                        className="gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(estimate)}
                      className="gap-1"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
