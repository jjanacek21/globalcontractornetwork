import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bot, Save } from "lucide-react";
import { toast } from "sonner";

export function AIAgentSettings() {
  const [enabled, setEnabled] = useState(true);
  const [model, setModel] = useState("gemini-flash");
  const [autoRespond, setAutoRespond] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful contractor assistant specializing in roofing, windows, and home exterior services in Florida. Always be professional and accurate.");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> AI Agent</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure AI behavior for lead qualification, estimates, and customer communication</p>
        </div>
        <Button onClick={() => toast.success("AI Agent settings saved")} className="gap-2"><Save className="h-4 w-4" />Save Changes</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable AI Agent</Label>
                <p className="text-xs text-muted-foreground">Use AI for automated tasks</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
            <div className="space-y-2">
              <Label>AI Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-flash">Gemini Flash (Fast)</SelectItem>
                  <SelectItem value="gemini-pro">Gemini Pro (Accurate)</SelectItem>
                  <SelectItem value="gpt5-mini">GPT-5 Mini (Balanced)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Respond to Leads</Label>
                <p className="text-xs text-muted-foreground">Automatically reply to new inquiries</p>
              </div>
              <Switch checked={autoRespond} onCheckedChange={setAutoRespond} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">System Prompt</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>AI Personality & Rules</Label>
              <Textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={6} />
              <p className="text-xs text-muted-foreground">This defines how the AI communicates with your customers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">AI Capabilities</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { name: "Lead Qualification", desc: "Score and classify incoming leads", active: true },
              { name: "Estimate Generation", desc: "Create draft estimates from measurements", active: true },
              { name: "Follow-Up Drafts", desc: "Draft follow-up emails for review", active: true },
              { name: "Appointment Scheduling", desc: "Suggest available slots to customers", active: false },
              { name: "Permit Assistance", desc: "Help fill permit applications", active: true },
              { name: "Customer Chat", desc: "Handle basic customer questions", active: false },
            ].map(cap => (
              <div key={cap.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{cap.name}</p>
                    <Badge variant={cap.active ? "default" : "secondary"} className="text-[10px]">{cap.active ? "On" : "Off"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{cap.desc}</p>
                </div>
                <Switch defaultChecked={cap.active} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
