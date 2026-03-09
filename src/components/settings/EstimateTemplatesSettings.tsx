import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Copy, Pencil } from "lucide-react";
import { toast } from "sonner";

const mockTemplates = [
  { id: "1", name: "Standard Roof Replacement", trades: ["Roofing"], lineItems: 12, lastUsed: "2 days ago", isDefault: true },
  { id: "2", name: "Roof Coating - Silicone", trades: ["Coatings"], lineItems: 8, lastUsed: "1 week ago", isDefault: false },
  { id: "3", name: "Full Exterior Package", trades: ["Roofing", "Gutters", "Soffit/Fascia"], lineItems: 24, lastUsed: "3 days ago", isDefault: false },
  { id: "4", name: "Emergency Tarp & Repair", trades: ["Emergency"], lineItems: 6, lastUsed: "5 days ago", isDefault: false },
  { id: "5", name: "Window & Door Replacement", trades: ["Windows", "Doors"], lineItems: 10, lastUsed: "2 weeks ago", isDefault: false },
];

export function EstimateTemplatesSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Estimate Templates</h2>
          <p className="text-sm text-muted-foreground mt-1">Pre-built templates for faster estimate creation</p>
        </div>
        <Button onClick={() => toast.info("Template builder coming soon")} className="gap-2"><Plus className="h-4 w-4" />New Template</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mockTemplates.map(t => (
          <Card key={t.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm">{t.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t.lineItems} line items • Last used {t.lastUsed}</p>
                </div>
                {t.isDefault && <Badge className="text-[10px]">Default</Badge>}
              </div>
              <div className="flex flex-wrap gap-1">
                {t.trades.map(trade => (
                  <Badge key={trade} variant="outline" className="text-[10px]">{trade}</Badge>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={e => { e.stopPropagation(); toast.info("Edit template coming soon"); }}>
                  <Pencil className="h-3 w-3" />Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={e => { e.stopPropagation(); toast.success("Template duplicated"); }}>
                  <Copy className="h-3 w-3" />Duplicate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
