import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Save, Pencil, Eye } from "lucide-react";
import { toast } from "sonner";

const mockTemplates = [
  { id: "1", name: "New Lead Welcome", subject: "Thanks for your interest!", trigger: "New lead created", active: true },
  { id: "2", name: "Estimate Follow-Up", subject: "Your estimate is ready", trigger: "Estimate sent", active: true },
  { id: "3", name: "Appointment Reminder", subject: "Reminder: Your appointment tomorrow", trigger: "24hr before appointment", active: true },
  { id: "4", name: "Job Complete", subject: "Your project is complete!", trigger: "Job marked complete", active: false },
  { id: "5", name: "Review Request", subject: "How did we do?", trigger: "7 days after completion", active: true },
];

export function EmailSettings() {
  const [fromName, setFromName] = useState("Global Contractor Network");
  const [replyTo, setReplyTo] = useState("");
  const [signature, setSignature] = useState("");
  const [autoSend, setAutoSend] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Email Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure email sending, templates, and automation</p>
        </div>
        <Button onClick={() => toast.success("Email settings saved")} className="gap-2"><Save className="h-4 w-4" />Save Changes</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Sending Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>From Name</Label>
              <Input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="Company Name" />
            </div>
            <div className="space-y-2">
              <Label>Reply-To Email</Label>
              <Input value={replyTo} onChange={e => setReplyTo(e.target.value)} placeholder="replies@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Email Signature</Label>
              <Textarea value={signature} onChange={e => setSignature(e.target.value)} placeholder="Your default email signature..." rows={3} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Send Emails</Label>
                <p className="text-xs text-muted-foreground">Automatically send trigger-based emails</p>
              </div>
              <Switch checked={autoSend} onCheckedChange={setAutoSend} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Email Templates</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {mockTemplates.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{t.name}</p>
                    <Badge variant={t.active ? "default" : "secondary"} className="text-[10px] shrink-0">{t.active ? "Active" : "Off"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{t.trigger}</p>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <Button variant="ghost" size="sm" onClick={() => toast.info("Preview coming soon")}><Eye className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => toast.info("Edit template coming soon")}><Pencil className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
