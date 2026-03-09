import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plug, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const integrations = [
  { id: "quickbooks", name: "QuickBooks Online", desc: "Sync invoices, payments, and customer data", status: "disconnected", icon: "📊" },
  { id: "google-cal", name: "Google Calendar", desc: "Sync appointments and inspection schedules", status: "connected", icon: "📅" },
  { id: "stripe", name: "Stripe Payments", desc: "Accept credit card payments on invoices", status: "disconnected", icon: "💳" },
  { id: "twilio", name: "Twilio SMS", desc: "Send text message reminders and updates", status: "disconnected", icon: "📱" },
  { id: "zapier", name: "Zapier", desc: "Connect with 5,000+ apps via automation workflows", status: "disconnected", icon: "⚡" },
  { id: "google-reviews", name: "Google Reviews", desc: "Monitor and respond to customer reviews", status: "connected", icon: "⭐" },
  { id: "mapbox", name: "Mapbox", desc: "Satellite imagery and geocoding for measurements", status: "connected", icon: "🗺️" },
  { id: "resend", name: "Resend Email", desc: "Transactional email delivery service", status: "connected", icon: "✉️" },
];

export function IntegrationsSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Plug className="h-5 w-5 text-primary" /> Integrations</h2>
        <p className="text-sm text-muted-foreground mt-1">Connect third-party services to extend your CRM</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map(integ => (
          <Card key={integ.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-start gap-4">
              <span className="text-2xl">{integ.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm">{integ.name}</h3>
                  <Badge variant={integ.status === "connected" ? "default" : "secondary"} className="text-[10px]">
                    {integ.status === "connected" ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{integ.desc}</p>
                <Button
                  variant={integ.status === "connected" ? "outline" : "default"}
                  size="sm"
                  className="mt-3 gap-1"
                  onClick={() => toast.info(integ.status === "connected" ? "Manage integration coming soon" : "Connect integration coming soon")}
                >
                  {integ.status === "connected" ? "Manage" : "Connect"}
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
