import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Settings, Zap, DollarSign, Building2, Users, Calculator, ClipboardList,
  Package, FileText, Truck, ShoppingCart, Mic, Bot, Mail, Plug,
} from "lucide-react";

const sidebarCategories = [
  { group: "GENERAL", items: [
    { key: "general", label: "General", icon: Settings },
    { key: "automations", label: "Automations", icon: Zap },
  ]},
  { group: "BUSINESS", items: [
    { key: "commissions", label: "Commissions", icon: DollarSign },
    { key: "company", label: "Company", icon: Building2 },
    { key: "users", label: "Users", icon: Users },
    { key: "quickbooks", label: "QuickBooks", icon: Calculator },
    { key: "inspections", label: "Inspections", icon: ClipboardList },
  ]},
  { group: "PRODUCTS AND PRICING", items: [
    { key: "materials", label: "Materials", icon: Package },
    { key: "estimate-templates", label: "Estimate Templates", icon: FileText },
    { key: "suppliers", label: "Suppliers", icon: Truck },
    { key: "products", label: "Products", icon: ShoppingCart },
  ]},
  { group: "COMMUNICATIONS", items: [
    { key: "voice-assistant", label: "Voice Assistant", icon: Mic },
    { key: "ai-agent", label: "AI Agent", icon: Bot },
    { key: "email", label: "Email", icon: Mail },
    { key: "integrations", label: "Integrations", icon: Plug },
  ]},
];

export default function CRMSettings() {
  const [activeSection, setActiveSection] = useState("general");
  const [tab, setTab] = useState("general-settings");
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure your system preferences and templates</p>
      </div>

      <div className="flex gap-6">
        {/* Settings Sidebar */}
        <div className="w-56 shrink-0 space-y-4">
          {sidebarCategories.map(cat => (
            <div key={cat.group}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{cat.group}</p>
              <div className="space-y-0.5">
                {cat.items.map(item => (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                      activeSection === item.key ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeSection === "general" && (
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="general-settings">General Settings</TabsTrigger>
                <TabsTrigger value="pipeline-stages">Pipeline Stages</TabsTrigger>
                <TabsTrigger value="contact-statuses">Contact Statuses</TabsTrigger>
                <TabsTrigger value="lead-sources">Lead Sources</TabsTrigger>
                <TabsTrigger value="approval-requirements">Approval Requirements</TabsTrigger>
                <TabsTrigger value="estimate-pdf">Estimate PDF</TabsTrigger>
              </TabsList>

              <TabsContent value="general-settings">
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <h3 className="font-semibold">Appearance</h3>
                      <div className="flex items-center justify-between">
                        <Label>Dark Mode</Label>
                        <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Theme Color</Label>
                        <Select defaultValue="blue">
                          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blue">Professional Blue</SelectItem>
                            <SelectItem value="green">Forest Green</SelectItem>
                            <SelectItem value="slate">Slate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <h3 className="font-semibold">Notifications</h3>
                      <div className="flex items-center justify-between">
                        <Label>Enable Notifications</Label>
                        <Switch checked={enableNotifications} onCheckedChange={setEnableNotifications} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Email Notifications</Label>
                        <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Push Notifications</Label>
                        <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <h3 className="font-semibold">Calendar and Integrations</h3>
                      <div className="flex items-center justify-between">
                        <Label>Google Calendar Sync</Label>
                        <Button variant="outline" size="sm">Connect</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Timezone</Label>
                        <Select defaultValue="est">
                          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="est">Eastern (EST)</SelectItem>
                            <SelectItem value="cst">Central (CST)</SelectItem>
                            <SelectItem value="mst">Mountain (MST)</SelectItem>
                            <SelectItem value="pst">Pacific (PST)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {["pipeline-stages", "contact-statuses", "lead-sources", "approval-requirements", "estimate-pdf"].map(t => (
                <TabsContent key={t} value={t}>
                  <Card><CardContent className="p-6 text-center py-12 text-muted-foreground">
                    {t.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())} configuration coming soon.
                  </CardContent></Card>
                </TabsContent>
              ))}
            </Tabs>
          )}

          {activeSection !== "general" && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-2 capitalize">
                  {sidebarCategories.flatMap(c => c.items).find(i => i.key === activeSection)?.label ?? activeSection}
                </h2>
                <p className="text-muted-foreground">
                  {activeSection === "automations" && "Configure automated workflows, triggers, and scheduled tasks."}
                  {activeSection === "commissions" && "Set up commission structures, splits, and payout rules for your team."}
                  {activeSection === "company" && "Manage company profile, branding, and business information."}
                  {activeSection === "users" && "Manage team members, roles, and permissions."}
                  {activeSection === "quickbooks" && "Connect and configure QuickBooks integration for accounting sync."}
                  {activeSection === "inspections" && "Set up inspection templates, checklists, and workflows."}
                  {activeSection === "materials" && "Manage your materials catalog, pricing, and inventory."}
                  {activeSection === "estimate-templates" && "Create and manage estimate templates for quick proposal generation."}
                  {activeSection === "suppliers" && "Manage supplier contacts, pricing agreements, and order preferences."}
                  {activeSection === "products" && "Configure product catalog, categories, and pricing tiers."}
                  {activeSection === "voice-assistant" && "Configure voice assistant settings, scripts, and call handling rules."}
                  {activeSection === "ai-agent" && "Set up AI agent behavior, responses, and automation rules."}
                  {activeSection === "email" && "Configure email templates, sending rules, and SMTP settings."}
                  {activeSection === "integrations" && "Manage third-party integrations and API connections."}
                </p>
                <div className="mt-8 text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  {sidebarCategories.flatMap(c => c.items).find(i => i.key === activeSection)?.label ?? activeSection} configuration coming soon.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
