import { Card, CardContent } from "@/components/ui/card";
import { Bot } from "lucide-react";

export default function CRMFollowUpAIAgent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Agent</h1>
        <p className="text-muted-foreground">AI assistant configuration and conversation history</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Configuration</h3>
            <p className="text-sm text-muted-foreground">Configure your AI agent's behavior, responses, and integration settings.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Conversation History</h3>
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-muted-foreground/40 mb-3 mx-auto" />
              <p className="text-sm text-muted-foreground">No conversations yet.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
