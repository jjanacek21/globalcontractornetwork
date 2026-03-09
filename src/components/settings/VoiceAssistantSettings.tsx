import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Save } from "lucide-react";
import { toast } from "sonner";

export function VoiceAssistantSettings() {
  const [enabled, setEnabled] = useState(false);
  const [greeting, setGreeting] = useState("Thank you for calling! How can I help you today?");
  const [voice, setVoice] = useState("female-1");
  const [afterHours, setAfterHours] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Mic className="h-5 w-5 text-primary" /> Voice Assistant</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure AI-powered phone handling and call routing</p>
        </div>
        <Button onClick={() => toast.success("Voice settings saved")} className="gap-2"><Save className="h-4 w-4" />Save Changes</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Voice Assistant</Label>
                <p className="text-xs text-muted-foreground">Answer incoming calls with AI</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
            <div className="space-y-2">
              <Label>Voice</Label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="female-1">Professional Female</SelectItem>
                  <SelectItem value="male-1">Professional Male</SelectItem>
                  <SelectItem value="female-2">Friendly Female</SelectItem>
                  <SelectItem value="male-2">Friendly Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>After-Hours Only</Label>
                <p className="text-xs text-muted-foreground">Only use AI outside business hours</p>
              </div>
              <Switch checked={afterHours} onCheckedChange={setAfterHours} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Greeting & Script</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Greeting Message</Label>
              <Textarea value={greeting} onChange={e => setGreeting(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Company Phone Number</Label>
              <Input placeholder="(555) 000-0000" />
            </div>
            <div className="space-y-2">
              <Label>Forwarding Number</Label>
              <Input placeholder="(555) 000-0001" />
              <p className="text-xs text-muted-foreground">Calls that need a human will be forwarded here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
