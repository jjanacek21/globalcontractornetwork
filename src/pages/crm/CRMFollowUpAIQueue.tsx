import { Card, CardContent } from "@/components/ui/card";
import { Brain } from "lucide-react";

export default function CRMFollowUpAIQueue() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Queue</h1>
        <p className="text-muted-foreground">AI-processed items queue with status indicators</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Brain className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No items in the AI queue. Items will appear here as they are processed.</p>
        </CardContent>
      </Card>
    </div>
  );
}
