import { Lock, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface AccessPendingCardProps {
  featureName: string;
  featureDescription?: string;
}

export function AccessPendingCard({ featureName, featureDescription }: AccessPendingCardProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Access Pending</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              You don't currently have access to <span className="font-semibold text-foreground">{featureName}</span>.
            </p>
            {featureDescription && (
              <p className="text-sm text-muted-foreground">{featureDescription}</p>
            )}
          </div>

          <div className="border-t pt-6">
            <p className="text-sm font-medium mb-4">To request access:</p>
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>support@gcn.com</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>(305) 555-0100</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/contractor">Back to Dashboard</Link>
            </Button>
            <Button className="flex-1" asChild>
              <a href="mailto:support@gcn.com?subject=Feature Access Request">Contact Support</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
