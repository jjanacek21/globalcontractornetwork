import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Save, Send, Plus, Trash2, DollarSign,
  Ruler, Package, SlidersHorizontal, FileText,
} from "lucide-react";
import { useEstimateBuilderV2 } from "@/hooks/useEstimateBuilderV2";

interface EstimateBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactName: string;
  contactAddress?: string;
  customerId: string;
  leadId?: string;
  onEstimateCreated?: () => void;
}

export function EstimateBuilderDialog({
  open, onOpenChange, contactId, contactName, contactAddress,
  customerId, leadId, onEstimateCreated,
}: EstimateBuilderDialogProps) {
  const builder = useEstimateBuilderV2(contactId, leadId);
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const handleSave = async () => {
    const result = await builder.saveEstimate(customerId);
    if (result) {
      onEstimateCreated?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            New Estimate
          </DialogTitle>
        </DialogHeader>

        {/* Header Info */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
          <div>
            <p className="font-semibold text-sm">{contactName}</p>
            {contactAddress && <p className="text-xs text-muted-foreground">{contactAddress}</p>}
          </div>
          {builder.measurement && (
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="outline" className="text-primary border-primary/30">
                <Ruler className="mr-1 h-3 w-3" />
                {builder.measurement.total_squares?.toFixed(1)} SQ
              </Badge>
              <span className="text-muted-foreground">{builder.measurement.total_area_sqft?.toLocaleString()} sq ft</span>
              <span className="text-muted-foreground">{builder.measurement.pitch}</span>
            </div>
          )}
        </div>

        {/* Template Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Roofing Template
          </Label>
          <Select value={builder.selectedTemplateId} onValueChange={builder.applyTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Select a roofing template to auto-populate..." />
            </SelectTrigger>
            <SelectContent>
              {builder.templates.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} — {fmt(t.material_cost_per_sq)}/sq materials, {fmt(t.labor_cost_per_sq)}/sq labor
                  {t.is_default && " ⭐"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Line Items */}
        {builder.lineItems.length > 0 && (
          <div className="space-y-4">
            {/* Materials */}
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" /> Materials
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">{fmt(builder.materialsCost)}</span>
                    <Button variant="ghost" size="sm" className="h-7" onClick={() => builder.addLineItem("material")}>
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Description</TableHead>
                      <TableHead className="w-[15%]">Qty</TableHead>
                      <TableHead className="w-[10%]">Unit</TableHead>
                      <TableHead className="w-[15%]">Unit Cost</TableHead>
                      <TableHead className="w-[15%]">Total</TableHead>
                      <TableHead className="w-[5%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {builder.lineItems.filter(i => i.category === "material").map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input
                            className="h-7 text-xs"
                            value={item.description}
                            onChange={e => builder.updateLineItem(item.id, { description: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-7 text-xs w-20"
                            value={item.quantity}
                            onChange={e => builder.updateLineItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          />
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{item.unit}</span>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            className="h-7 text-xs w-24"
                            value={item.unit_cost}
                            onChange={e => builder.updateLineItem(item.id, { unit_cost: parseFloat(e.target.value) || 0 })}
                          />
                        </TableCell>
                        <TableCell className="font-semibold text-xs">{fmt(item.total)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => builder.removeLineItem(item.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Labor */}
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Labor
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">{fmt(builder.laborCost)}</span>
                    <Button variant="ghost" size="sm" className="h-7" onClick={() => builder.addLineItem("labor")}>
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Description</TableHead>
                      <TableHead className="w-[15%]">Qty</TableHead>
                      <TableHead className="w-[10%]">Unit</TableHead>
                      <TableHead className="w-[15%]">Unit Cost</TableHead>
                      <TableHead className="w-[15%]">Total</TableHead>
                      <TableHead className="w-[5%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {builder.lineItems.filter(i => i.category === "labor").map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input
                            className="h-7 text-xs"
                            value={item.description}
                            onChange={e => builder.updateLineItem(item.id, { description: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-7 text-xs w-20"
                            value={item.quantity}
                            onChange={e => builder.updateLineItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          />
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{item.unit}</span>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            className="h-7 text-xs w-24"
                            value={item.unit_cost}
                            onChange={e => builder.updateLineItem(item.id, { unit_cost: parseFloat(e.target.value) || 0 })}
                          />
                        </TableCell>
                        <TableCell className="font-semibold text-xs">{fmt(item.total)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => builder.removeLineItem(item.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pricing Calculator */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Pricing Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Materials</p>
                <p className="font-bold">{fmt(builder.materialsCost)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Labor</p>
                <p className="font-bold">{fmt(builder.laborCost)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Direct Cost</p>
                <p className="font-bold">{fmt(builder.directCost)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Margin</p>
                <p className="font-bold text-primary">{builder.marginPercent}%</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Overhead ({builder.overheadPercent}%)</Label>
                <Slider
                  value={[builder.overheadPercent]}
                  onValueChange={([v]) => builder.setOverheadPercent(v)}
                  min={0} max={25} step={1}
                />
                <p className="text-xs text-muted-foreground text-right">{fmt(builder.overheadCost)}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Profit ({builder.profitPercent}%)</Label>
                <Slider
                  value={[builder.profitPercent]}
                  onValueChange={([v]) => builder.setProfitPercent(v)}
                  min={0} max={50} step={1}
                />
                <p className="text-xs text-muted-foreground text-right">{fmt(builder.profitAmount)}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs flex items-center justify-between">
                <span>Quick Price Adjust</span>
                <span className={`font-bold ${builder.quickAdjust > 0 ? "text-green-600" : builder.quickAdjust < 0 ? "text-destructive" : ""}`}>
                  {builder.quickAdjust > 0 ? "+" : ""}{builder.quickAdjust}% ({fmt(builder.adjustmentAmount)})
                </span>
              </Label>
              <Slider
                value={[builder.quickAdjust]}
                onValueChange={([v]) => builder.setQuickAdjust(v)}
                min={-20} max={20} step={1}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold">Grand Total</span>
              <span className="text-2xl font-bold text-primary">{fmt(builder.grandTotal)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <div className="space-y-2">
          <Label className="text-xs">Notes</Label>
          <Textarea
            rows={2}
            placeholder="Additional notes..."
            value={builder.notes}
            onChange={e => builder.setNotes(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={builder.isSaving || builder.lineItems.length === 0}
          >
            <Save className="mr-2 h-4 w-4" />
            {builder.isSaving ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            variant="secondary"
            disabled={builder.isSaving || builder.lineItems.length === 0}
            onClick={async () => {
              // TODO: send to customer logic
              handleSave();
            }}
          >
            <Send className="mr-2 h-4 w-4" /> Send to Customer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
