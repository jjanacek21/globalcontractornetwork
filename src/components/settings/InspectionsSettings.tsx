import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Plus, Copy } from "lucide-react";
import { toast } from "sonner";

const mockChecklists = [
  { id: "1", name: "Standard Roof Inspection", items: 18, category: "Roofing", lastUsed: "1 day ago" },
  { id: "2", name: "Pre-Install Roof Check", items: 12, category: "Roofing", lastUsed: "3 days ago" },
  { id: "3", name: "Final Walk-Through", items: 15, category: "General", lastUsed: "5 days ago" },
  { id: "4", name: "Mold Assessment", items: 22, category: "Remediation", lastUsed: "1 week ago" },
  { id: "5", name: "Window/Door Inspection", items: 10, category: "Windows", lastUsed: "2 weeks ago" },
];

export function InspectionsSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Inspection Templates</h2>
          <p className="text-sm text-muted-foreground mt-1">Checklists and templates for field inspections</p>
        </div>
        <Button onClick={() => toast.info("Checklist builder coming soon")} className="gap-2"><Plus className="h-4 w-4" />New Template</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mockChecklists.map(c => (
          <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => toast.info("Edit checklist coming soon")}>
            <CardContent className="p-5 space-y-3">
              <div>
                <h3 className="font-semibold text-sm">{c.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{c.items} items • Last used {c.lastUsed}</p>
              </div>
              <Badge variant="outline" className="text-[10px]">{c.category}</Badge>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={e => { e.stopPropagation(); toast.info("Edit coming soon"); }}>Edit</Button>
                <Button variant="outline" size="sm" className="gap-1" onClick={e => { e.stopPropagation(); toast.success("Template duplicated"); }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
