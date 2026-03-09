import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const mockMaterials = [
  { id: "1", name: "GAF Timberline HDZ", category: "Shingles", unit: "SQ", cost: 95, price: 145, active: true },
  { id: "2", name: "Synthetic Underlayment", category: "Underlayment", unit: "ROLL", cost: 65, price: 95, active: true },
  { id: "3", name: "Ice & Water Shield", category: "Underlayment", unit: "ROLL", cost: 85, price: 125, active: true },
  { id: "4", name: "Drip Edge 10ft", category: "Metals", unit: "PC", cost: 8, price: 14, active: true },
  { id: "5", name: "Ridge Vent 4ft", category: "Ventilation", unit: "PC", cost: 12, price: 22, active: true },
  { id: "6", name: "Pipe Boot", category: "Accessories", unit: "EA", cost: 15, price: 28, active: false },
];

export function MaterialsSettings() {
  const [search, setSearch] = useState("");
  const filtered = mockMaterials.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Materials Catalog</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage materials, costs, and pricing for estimates</p>
        </div>
        <Button onClick={() => toast.info("Add material dialog coming soon")} className="gap-2"><Plus className="h-4 w-4" />Add Material</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materials..." className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(m => (
                <TableRow key={m.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toast.info("Edit material coming soon")}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell><Badge variant="outline">{m.category}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{m.unit}</TableCell>
                  <TableCell className="text-right">${m.cost.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${m.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-primary font-medium">{((1 - m.cost / m.price) * 100).toFixed(0)}%</TableCell>
                  <TableCell>
                    <Badge variant={m.active ? "default" : "secondary"}>{m.active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
