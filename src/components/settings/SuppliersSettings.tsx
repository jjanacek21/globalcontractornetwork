import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Truck, Plus } from "lucide-react";
import { toast } from "sonner";

const mockSuppliers = [
  { id: "1", name: "ABC Supply Co.", contact: "Mike Thompson", phone: "(555) 111-2222", materials: ["Shingles", "Underlayment", "Metals"], preferred: true },
  { id: "2", name: "Beacon Roofing Supply", contact: "Linda Park", phone: "(555) 333-4444", materials: ["Shingles", "Ventilation"], preferred: true },
  { id: "3", name: "Home Depot Pro", contact: "James Wilson", phone: "(555) 555-6666", materials: ["Lumber", "Accessories"], preferred: false },
  { id: "4", name: "SRS Distribution", contact: "Carol Davis", phone: "(555) 777-8888", materials: ["Coatings", "Sealants"], preferred: false },
];

export function SuppliersSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> Suppliers</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage supplier contacts and material sources</p>
        </div>
        <Button onClick={() => toast.info("Add supplier coming soon")} className="gap-2"><Plus className="h-4 w-4" />Add Supplier</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Materials</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSuppliers.map(s => (
                <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toast.info("Edit supplier coming soon")}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.contact}</TableCell>
                  <TableCell className="text-muted-foreground">{s.phone}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {s.materials.slice(0, 2).map(m => <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>)}
                      {s.materials.length > 2 && <Badge variant="outline" className="text-[10px]">+{s.materials.length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.preferred && <Badge className="text-[10px]">Preferred</Badge>}
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
