import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Key, Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface ApiConfig {
  id: string;
  api_name: string;
  api_description: string | null;
  api_key: string;
  is_active: boolean;
  created_at: string;
}

const PRESETS = [
  { name: "Property Appraiser API", desc: "County property appraiser data access" },
  { name: "Skip Tracing API", desc: "Owner contact lookup (BatchSkipTracing, REISkip, etc.)" },
  { name: "Sunbiz / Corp Search API", desc: "Florida corporate entity search" },
  { name: "Zillow / Property Data API", desc: "Property valuation and market data" },
];

const maskKey = (key: string) => {
  if (key.length <= 6) return "••••••";
  return "••••••••••" + key.slice(-6);
};

const PropertyIQApiConfig = () => {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formKey, setFormKey] = useState("");
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const fetchConfigs = async () => {
    const { data, error } = await supabase
      .from("piq_api_configs")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) setConfigs(data as ApiConfig[]);
    setLoading(false);
  };

  useEffect(() => { fetchConfigs(); }, []);

  const openAdd = (preset?: { name: string; desc: string }) => {
    setEditingId(null);
    setFormName(preset?.name || "");
    setFormDesc(preset?.desc || "");
    setFormKey("");
    setDialogOpen(true);
  };

  const openEdit = (c: ApiConfig) => {
    setEditingId(c.id);
    setFormName(c.api_name);
    setFormDesc(c.api_description || "");
    setFormKey(c.api_key);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formKey.trim()) {
      toast({ title: "Missing fields", description: "Name and API Key are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    if (editingId) {
      const { error } = await supabase
        .from("piq_api_configs")
        .update({ api_name: formName.trim(), api_description: formDesc.trim() || null, api_key: formKey.trim() })
        .eq("id", editingId);
      if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
      else toast({ title: "API Key Updated" });
    } else {
      const { error } = await supabase
        .from("piq_api_configs")
        .insert({ user_id: session.user.id, api_name: formName.trim(), api_description: formDesc.trim() || null, api_key: formKey.trim() });
      if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
      else toast({ title: "API Key Saved" });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchConfigs();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("piq_api_configs").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else { toast({ title: "API Key Deleted" }); fetchConfigs(); }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase.from("piq_api_configs").update({ is_active: !current }).eq("id", id);
    fetchConfigs();
  };

  const toggleReveal = (id: string) => {
    setRevealedKeys(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Manage API Keys</h4>
          <p className="text-xs text-muted-foreground">Add and manage API keys for PropertyIQ data sources.</p>
        </div>
        <Button size="sm" onClick={() => openAdd()} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add API Key
        </Button>
      </div>

      {/* Quick-add presets */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground self-center">Quick Add:</span>
        {PRESETS.map((p) => (
          <Button key={p.name} variant="outline" size="sm" className="text-xs" onClick={() => openAdd(p)}>
            {p.name.replace(" API", "")}
          </Button>
        ))}
      </div>

      {/* Saved keys */}
      {configs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            No API keys configured yet. Click "Add API Key" or use a preset above.
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {configs.map((c) => (
            <Card key={c.id} className={!c.is_active ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Key className="h-4 w-4" /> {c.api_name}
                  </CardTitle>
                  <Switch checked={c.is_active} onCheckedChange={() => handleToggleActive(c.id, c.is_active)} />
                </div>
                {c.api_description && <CardDescription className="text-xs">{c.api_description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 font-mono">
                    {revealedKeys.has(c.id) ? c.api_key : maskKey(c.api_key)}
                  </code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleReveal(c.id)}>
                    {revealedKeys.has(c.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={c.is_active ? "default" : "secondary"} className="text-[10px]">
                    {c.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <div className="flex-1" />
                  <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => openEdit(c)}>
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit API Key" : "Add API Key"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="api-name" className="text-xs">API Name</Label>
              <Input id="api-name" placeholder="e.g. Skip Tracing API" value={formName} onChange={(e) => setFormName(e.target.value)} maxLength={100} />
            </div>
            <div>
              <Label htmlFor="api-desc" className="text-xs">Description (optional)</Label>
              <Input id="api-desc" placeholder="What this API is used for..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} maxLength={255} />
            </div>
            <div>
              <Label htmlFor="api-key" className="text-xs">API Key</Label>
              <Input id="api-key" type="password" placeholder="Enter API key..." value={formKey} onChange={(e) => setFormKey(e.target.value)} maxLength={500} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyIQApiConfig;
