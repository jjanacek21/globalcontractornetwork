import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Zap, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Automation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  active: boolean;
  runs: number;
}

const initialAutomations: Automation[] = [
  { id: "1", name: "New Lead → Welcome Email", trigger: "Lead created", action: "Send welcome email", active: true, runs: 247 },
  { id: "2", name: "Estimate Viewed → Notify Rep", trigger: "Estimate opened by customer", action: "Push notification to assigned rep", active: true, runs: 89 },
  { id: "3", name: "No Response 48hr → Follow Up", trigger: "48 hours after estimate sent", action: "Send follow-up email", active: true, runs: 156 },
  { id: "4", name: "Job Complete → Review Request", trigger: "Job status → Complete", action: "Send review request after 7 days", active: false, runs: 34 },
  { id: "5", name: "Appointment Set → Calendar Event", trigger: "Appointment scheduled", action: "Create Google Calendar event", active: true, runs: 312 },
];

export function AutomationsSettings() {
  const [automations, setAutomations] = useState(initialAutomations);

  const toggle = (id: string) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
    toast.success("Automation updated");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Automations</h2>
          <p className="text-sm text-muted-foreground mt-1">Automated workflows triggered by events in your CRM</p>
        </div>
        <Button onClick={() => toast.info("Automation builder coming soon")} className="gap-2"><Plus className="h-4 w-4" />New Automation</Button>
      </div>

      <div className="space-y-3">
        {automations.map(a => (
          <Card key={a.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <Switch checked={a.active} onCheckedChange={() => toggle(a.id)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm">{a.name}</h3>
                  <Badge variant={a.active ? "default" : "secondary"} className="text-[10px]">{a.active ? "Active" : "Paused"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-medium">When:</span> {a.trigger} → <span className="font-medium">Then:</span> {a.action}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium">{a.runs}</p>
                <p className="text-[10px] text-muted-foreground">total runs</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info("Edit automation coming soon")}>Edit</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
