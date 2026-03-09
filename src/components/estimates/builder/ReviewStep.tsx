import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Save, FileText, User, Ruler, Layers,
} from "lucide-react";
import type { EstimateBuilderState, BuilderLineItem } from "@/hooks/useEstimateBuilder";

interface ReviewStepProps {
  state: EstimateBuilderState;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  isSaving: boolean;
  onUpdateState: (updates: Partial<EstimateBuilderState>) => void;
  onBack: () => void;
  onSave: () => void;
}

export function ReviewStep({
  state,
  subtotal,
  taxAmount,
  grandTotal,
  isSaving,
  onUpdateState,
  onBack,
  onSave,
}: ReviewStepProps) {
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Customer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-primary" /> Customer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold">{state.contact ? `${state.contact.first_name} ${state.contact.last_name}` : "—"}</p>
          <p className="text-sm text-muted-foreground">{state.contact?.email || state.contact?.primary_phone || ""}</p>
        </CardContent>
      </Card>

      {/* Measurement */}
      {state.measurement && (
        <Card className="border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Ruler className="h-4 w-4 text-blue-500" /> Linked Measurement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="outline" className="text-blue-600">{state.measurement.source.toUpperCase()}</Badge>
              <span className="font-bold">{state.measurement.total_squares?.toFixed(1)} SQ</span>
              <span className="text-muted-foreground">{state.measurement.address}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Line Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Layers className="h-4 w-4 text-primary" /> Line Items ({state.lineItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {state.lineItems.map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                  <div>
                    <p className="text-sm font-medium">{item.item_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.unit_of_measure} × {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-sm">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-primary" /> Pricing & Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Tax Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                className="h-8"
                value={state.tax_rate}
                onChange={e => onUpdateState({ tax_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Discount ($)</Label>
              <Input
                type="number"
                step="0.01"
                className="h-8"
                value={state.discount_amount}
                onChange={e => onUpdateState({ discount_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea
              rows={3}
              placeholder="Additional notes for this estimate..."
              value={state.notes}
              onChange={e => onUpdateState({ notes: e.target.value })}
            />
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({state.tax_rate}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            {state.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(state.discount_amount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90"
          size="lg"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Create Estimate"}
        </Button>
      </div>
    </div>
  );
}
