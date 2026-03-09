import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const mockProducts = [
  { id: "1", name: "Standard Roof Replacement", category: "Roofing", priceRange: "$8,500 – $15,000", unit: "per project", active: true },
  { id: "2", name: "Silicone Roof Coating", category: "Coatings", priceRange: "$3.50 – $5.50", unit: "per sq ft", active: true },
  { id: "3", name: "Impact Windows", category: "Windows", priceRange: "$450 – $1,200", unit: "per window", active: true },
  { id: "4", name: "Gutter Installation", category: "Gutters", priceRange: "$8 – $15", unit: "per linear ft", active: true },
  { id: "5", name: "Soffit & Fascia Repair", category: "Exterior", priceRange: "$12 – $20", unit: "per linear ft", active: false },
  { id: "6", name: "Mold Remediation", category: "Remediation", priceRange: "$2,000 – $6,000", unit: "per project", active: true },
];

export function ProductsSettings() {
  const [search, setSearch] = useState("");
  const filtered = mockProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" /> Products & Services</h2>
          <p className="text-sm text-muted-foreground mt-1">Define your service offerings and pricing tiers</p>
        </div>
        <Button onClick={() => toast.info("Add product coming soon")} className="gap-2"><Plus className="h-4 w-4" />Add Product</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product / Service</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price Range</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toast.info("Edit product coming soon")}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{p.priceRange}</TableCell>
                  <TableCell className="text-muted-foreground">{p.unit}</TableCell>
                  <TableCell>
                    <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Active" : "Inactive"}</Badge>
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
