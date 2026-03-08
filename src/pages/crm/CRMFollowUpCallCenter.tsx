import { Card, CardContent } from "@/components/ui/card";
import { Phone } from "lucide-react";

export default function CRMFollowUpCallCenter() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Call Center</h1>
        <p className="text-muted-foreground">Call log and dialer interface</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Recent Calls</h3>
            <div className="text-center py-8 text-muted-foreground text-sm">No recent calls.</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Phone className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Select a contact to dial.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
