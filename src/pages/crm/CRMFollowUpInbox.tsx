import { Card, CardContent } from "@/components/ui/card";
import { Inbox } from "lucide-react";

export default function CRMFollowUpInbox() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Inbox</h1>
        <p className="text-muted-foreground">View and respond to incoming messages</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Conversations</h3>
            <div className="text-center py-8 text-muted-foreground text-sm">No conversations yet.</div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Inbox className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Select a conversation to view messages.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
