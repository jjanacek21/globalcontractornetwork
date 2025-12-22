import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEstimate, useEstimateLineItems, ESTIMATE_STATUSES } from "@/hooks/useEstimates";
import { Plus, Trash2, FileText, User, DollarSign } from "lucide-react";
import { format } from "date-fns";
import type { EstimateWithDetails } from "@/hooks/useEstimates";

interface EstimateDetailSheetProps {
  estimate: EstimateWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EstimateDetailSheet({ estimate: initialEstimate, open, onOpenChange }: EstimateDetailSheetProps) {
  const { estimate, refetch } = useEstimate(initialEstimate?.id || null);
  const { addLineItem, deleteLineItem } = useEstimateLineItems(estimate?.id || null);
  const [newItem, setNewItem] = useState({
    item_name: "",
    description: "",
    quantity: "1",
    unit_price: "",
  });
  const [isAddingItem, setIsAddingItem] = useState(false);

  const currentEstimate = estimate || initialEstimate;

  if (!currentEstimate) return null;

  const statusConfig = ESTIMATE_STATUSES.find((s) => s.value === currentEstimate.status);

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleAddLineItem = async () => {
    if (!newItem.item_name || !newItem.unit_price) return;

    setIsAddingItem(true);
    const quantity = parseFloat(newItem.quantity) || 1;
    const unitPrice = parseFloat(newItem.unit_price) || 0;
    const total = quantity * unitPrice;

    await addLineItem({
      estimate_id: currentEstimate.id,
      item_name: newItem.item_name,
      description: newItem.description || null,
      quantity,
      unit_price: unitPrice,
      total,
      sort_order: (currentEstimate.line_items?.length || 0) + 1,
    });

    setNewItem({ item_name: "", description: "", quantity: "1", unit_price: "" });
    setIsAddingItem(false);
    refetch();
  };

  const handleDeleteLineItem = async (id: string) => {
    await deleteLineItem(id);
    refetch();
  };

  const lineItems = estimate?.line_items || [];
  const subtotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const taxAmount = subtotal * ((currentEstimate.tax_rate || 0) / 100);
  const total = subtotal + taxAmount - (currentEstimate.discount_amount || 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {currentEstimate.estimate_number || "Estimate"}
            </SheetTitle>
            <Badge className={statusConfig?.color || "bg-gray-500"}>
              {statusConfig?.label || currentEstimate.status}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{currentEstimate.customer?.name || "Unknown"}</p>
              {currentEstimate.customer?.email && (
                <p className="text-sm text-muted-foreground">{currentEstimate.customer.email}</p>
              )}
              {currentEstimate.customer?.address && (
                <p className="text-sm text-muted-foreground">{currentEstimate.customer.address}</p>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Line Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No line items yet. Add your first item below.
                </p>
              ) : (
                <div className="space-y-3">
                  {lineItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.item_name}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.quantity} × {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(item.total)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteLineItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Add Line Item Form */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Add Line Item</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Item name"
                    value={newItem.item_name}
                    onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                  />
                  <Input
                    placeholder="Description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Quantity"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Unit price"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleAddLineItem}
                  disabled={isAddingItem || !newItem.item_name || !newItem.unit_price}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isAddingItem ? "Adding..." : "Add Item"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Tax ({currentEstimate.tax_rate || 0}%)
                  </span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                {(currentEstimate.discount_amount || 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(currentEstimate.discount_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {currentEstimate.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {currentEstimate.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Meta */}
          <div className="text-xs text-muted-foreground text-center">
            Created {currentEstimate.created_at ? format(new Date(currentEstimate.created_at), "MMM d, yyyy 'at' h:mm a") : "—"}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
