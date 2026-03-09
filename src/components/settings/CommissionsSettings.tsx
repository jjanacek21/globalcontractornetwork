import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Plus, Save } from "lucide-react";
import { toast } from "sonner";

const mockTiers = [
  { id: "1", name: "Standard", percent: "8", minRevenue: "0", maxRevenue: "50000" },
  { id: "2", name: "Senior", percent: "10", minRevenue: "50001", maxRevenue: "150000" },
  { id: "3", name: "Top Performer", percent: "12", minRevenue: "150001", maxRevenue: "" },
];

export function CommissionsSettings() {
  const [payoutFrequency, setPayoutFrequency] = useState("bi-weekly");
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [deductMaterials, setDeductMaterials] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Commission Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure how commissions are calculated and paid out</p>
        </div>
        <Button onClick={() => toast.success("Commission settings saved")} className="gap-2"><Save className="h-4 w-4" />Save Changes</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Payout Rules</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Payout Frequency</Label>
              <Select value={payoutFrequency} onValueChange={setPayoutFrequency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="per-job">Per Job Completion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Calculate Commissions</Label>
                <p className="text-xs text-muted-foreground">Automatically calculate when jobs are marked complete</p>
              </div>
              <Switch checked={autoCalculate} onCheckedChange={setAutoCalculate} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Deduct Material Costs</Label>
                <p className="text-xs text-muted-foreground">Subtract material costs before calculating commission</p>
              </div>
              <Switch checked={deductMaterials} onCheckedChange={setDeductMaterials} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Commission Tiers</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Revenue Range</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTiers.map(tier => (
                  <TableRow key={tier.id}>
                    <TableCell className="font-medium">{tier.name}</TableCell>
                    <TableCell>{tier.percent}%</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      ${Number(tier.minRevenue).toLocaleString()} – {tier.maxRevenue ? `$${Number(tier.maxRevenue).toLocaleString()}` : "Unlimited"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => toast.info("Add tier coming soon")}><Plus className="h-3 w-3" />Add Tier</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
