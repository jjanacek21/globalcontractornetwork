import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";

export default function CRMFollowUpUnmatched() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Unmatched</h1>
        <p className="text-muted-foreground">Leads and messages needing assignment</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Eye className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No unmatched items. All leads have been assigned.</p>
        </CardContent>
      </Card>
    </div>
  );
}
