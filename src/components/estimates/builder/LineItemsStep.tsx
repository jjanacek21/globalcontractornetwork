import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowRight, ArrowLeft, Plus, Trash2, ChevronRight,
  Package, Search, DollarSign, Layers,
} from "lucide-react";
import type { BuilderLineItem } from "@/hooks/useEstimateBuilder";
import type { Database } from "@/integrations/supabase/types";

type CatalogItem = Database["public"]["Tables"]["catalog_items"]["Row"];

interface LineItemsStepProps {
  lineItems: BuilderLineItem[];
  catalogByTrade: Record<string, CatalogItem[]>;
  measurement: Database["public"]["Tables"]["roof_measurements"]["Row"] | null;
  onAddCatalogItem: (item: CatalogItem) => void;
  onAddManualItem: (item: Omit<BuilderLineItem, "id" | "sort_order" | "total">) => void;
  onUpdateItem: (id: string, updates: Partial<BuilderLineItem>) => void;
  onRemoveItem: (id: string) => void;
  subtotal: number;
  onNext: () => void;
  onBack: () => void;
}

export function LineItemsStep({
  lineItems,
  catalogByTrade,
  measurement,
  onAddCatalogItem,
  onAddManualItem,
  onUpdateItem,
  onRemoveItem,
  subtotal,
  onNext,
  onBack,
}: LineItemsStepProps) {
  const [catalogSearch, setCatalogSearch] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [manual, setManual] = useState({ item_name: "", description: "", quantity: "1", unit_price: "", unit_of_measure: "EA" });

  const handleAddManual = () => {
    if (!manual.item_name || !manual.unit_price) return;
    onAddManualItem({
      item_name: manual.item_name,
      description: manual.description,
      quantity: parseFloat(manual.quantity) || 1,
      unit_price: parseFloat(manual.unit_price) || 0,
      unit_of_measure: manual.unit_of_measure,
    });
    setManual({ item_name: "", description: "", quantity: "1", unit_price: "", unit_of_measure: "EA" });
    setShowManualForm(false);
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const tradeNames = Object.keys(catalogByTrade);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Catalog Panel */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-primary" />
              Catalog Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search catalog..."
                className="pl-9 h-8 text-sm"
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
              />
            </div>

            <div className="max-h-[50vh] overflow-y-auto space-y-1">
              {tradeNames.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No catalog items found. Add items in Settings → Catalog.
                </p>
              ) : (
                tradeNames.map(trade => {
                  const items = catalogByTrade[trade].filter(i =>
                    i.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                    i.description?.toLowerCase().includes(catalogSearch.toLowerCase())
                  );
                  if (items.length === 0) return null;

                  return (
                    <Collapsible key={trade} defaultOpen={tradeNames.length <= 3}>
                      <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 text-xs font-semibold text-muted-foreground hover:text-foreground uppercase tracking-wider">
                        <ChevronRight className="h-3 w-3 transition-transform data-[state=open]:rotate-90" />
                        {trade} ({items.length})
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="space-y-1 ml-5">
                          {items.map(item => (
                            <button
                              key={item.id}
                              onClick={() => onAddCatalogItem(item)}
                              className="flex items-center justify-between w-full p-2 rounded-md text-left hover:bg-muted/50 transition-colors text-sm group"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-xs truncate">{item.name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {formatCurrency(item.unit_price || 0)}/{item.unit_of_measure}
                                </p>
                              </div>
                              <Plus className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items Panel */}
      <div className="lg:col-span-3 space-y-4">
        {measurement && (
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="outline" className="text-blue-600 border-blue-500/30 bg-blue-500/10">
                  {measurement.source.toUpperCase()}
                </Badge>
                <span className="font-bold">{measurement.total_squares?.toFixed(1)} SQ</span>
                <span className="text-muted-foreground">•</span>
                <span>{measurement.total_area_sqft?.toLocaleString()} sq ft</span>
                <span className="text-muted-foreground">•</span>
                <span>{measurement.pitch}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4 text-primary" />
                Estimate Line Items ({lineItems.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowManualForm(!showManualForm)}
              >
                <Plus className="mr-1 h-3 w-3" /> Manual Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {showManualForm && (
              <div className="p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Item name *"
                    className="h-8 text-sm"
                    value={manual.item_name}
                    onChange={e => setManual({ ...manual, item_name: e.target.value })}
                  />
                  <Input
                    placeholder="Description"
                    className="h-8 text-sm"
                    value={manual.description}
                    onChange={e => setManual({ ...manual, description: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    className="h-8 text-sm"
                    value={manual.quantity}
                    onChange={e => setManual({ ...manual, quantity: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Unit price *"
                    className="h-8 text-sm"
                    value={manual.unit_price}
                    onChange={e => setManual({ ...manual, unit_price: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs" onClick={handleAddManual} disabled={!manual.item_name || !manual.unit_price}>
                    Add Item
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowManualForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {lineItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No items yet. Add from catalog or manually.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                    <span className="text-[10px] text-muted-foreground w-5 shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.item_name}</p>
                      {item.trade_name && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{item.trade_name}</Badge>
                      )}
                    </div>
                    <Input
                      type="number"
                      className="w-16 h-7 text-xs text-center"
                      value={item.quantity}
                      onChange={e => onUpdateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                    />
                    <span className="text-[10px] text-muted-foreground w-6">{item.unit_of_measure}</span>
                    <Input
                      type="number"
                      className="w-20 h-7 text-xs text-right"
                      value={item.unit_price}
                      onChange={e => onUpdateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                    />
                    <span className="text-sm font-semibold w-20 text-right">{formatCurrency(item.total)}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onRemoveItem(item.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {lineItems.length > 0 && (
              <>
                <Separator />
                <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Subtotal</p>
                    <p className="text-lg font-bold">{formatCurrency(subtotal)}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={onNext} disabled={lineItems.length === 0}>
            Review Estimate <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
