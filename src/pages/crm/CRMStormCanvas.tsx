import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Map, Target, Zap, Camera, BarChart3, Settings, Upload, MapPin } from "lucide-react";

export default function CRMStormCanvas() {
  const stats = [
    { label: "Active Canvassers", value: 0, subtitle: "Ready to deploy", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Territories", value: 0, subtitle: "Waiting for setup", icon: Map, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Doors Knocked", value: 0, subtitle: "Today", icon: Target, color: "text-green-500", bg: "bg-green-50" },
    { label: "Leads Generated", value: 0, subtitle: "This week", icon: Zap, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  const features = [
    { title: "Field Canvassing", desc: "Territory mapping with real-time GPS tracking and mobile-optimized lead capture", btn: "Start Canvassing", icon: MapPin, primary: true },
    { title: "Photo Documentation", desc: "Capture and tag storm damage photos on-site", btn: "View Gallery", icon: Camera, primary: false },
    { title: "Analytics and Reporting", desc: "Track conversion rates and canvasser performance", btn: "View Reports", icon: BarChart3, primary: false },
    { title: "Configuration", desc: "Set up forms, scripts, and canvassing workflows", btn: "Configure", icon: Settings, primary: false },
    { title: "Import Contacts", desc: "Bulk import canvass contacts from Excel spreadsheets with rep assignment", btn: "Import from Excel", icon: Upload, primary: true },
    { title: "Territory Manager", desc: "Draw territories, assign reps, auto-split areas, and track ROI", btn: "Manage Territories", icon: Map, primary: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">iCanvas</h1>
        <Badge className="bg-green-100 text-green-700 border-green-200">Integration Ready</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <f.icon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">{f.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{f.desc}</p>
              <Button size="sm" className={f.primary ? "bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,30%)] text-white" : ""} variant={f.primary ? "default" : "outline"}>
                {f.btn}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
