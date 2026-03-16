import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Trash2, Pentagon, Minus, Plus, ChevronDown, ChevronRight, Home } from "lucide-react";
import type { RoofFacet, RoofEdge, RoofSection, EdgeType } from "./types";
import { ALL_PITCHES, PITCH_MULTIPLIERS, WASTE_OPTIONS, EDGE_COLORS, EDGE_LABELS } from "./types";

interface FacetListPanelProps {
  facets: RoofFacet[];
  edges: RoofEdge[];
  roofs: RoofSection[];
  activeRoofId: string;
  selectedFacetId: string | null;
  onSelectFacet: (id: string | null) => void;
  onUpdateFacet: (id: string, updates: Partial<RoofFacet>) => void;
  onDeleteFacet: (id: string) => void;
  onAddRoof: () => void;
  onUpdateRoof: (id: string, name: string) => void;
  onDeleteRoof: (id: string) => void;
  onSetActiveRoof: (id: string) => void;
}

function facetPitchedArea(f: RoofFacet): number {
  return f.areaSqft * (PITCH_MULTIPLIERS[f.pitch] ?? 1);
}

function facetSquares(f: RoofFacet): number {
  const pitched = facetPitchedArea(f);
  return pitched * (1 + f.wastePercent / 100) / 100;
}

const EDGE_TYPE_ORDER: EdgeType[] = ["ridge", "hip", "valley", "eave", "rake", "drip_edge", "flashing", "transition"];

function FacetCard({
  facet, isSelected, onSelect, onUpdate, onDelete,
}: {
  facet: RoofFacet;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<RoofFacet>) => void;
  onDelete: () => void;
}) {
  const pitched = facetPitchedArea(facet);
  const squares = facetSquares(facet);

  return (
    <div
      className={`rounded-md border p-2 space-y-1.5 cursor-pointer transition-colors ${
        isSelected ? "border-primary/60 bg-primary/5" : "border-border/40 hover:border-border"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: facet.color.replace("0.30", "0.8").replace("0.35", "0.8") }}
        />
        <Input
          value={facet.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="h-6 text-xs px-1.5 flex-1 min-w-0"
        />
        <Button
          variant="ghost" size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex gap-1.5">
        <Select
          value={facet.pitch}
          onValueChange={(v) => onUpdate({ pitch: v, type: v === "Flat" ? "flat" : "pitched" })}
        >
          <SelectTrigger className="h-6 text-[10px] flex-1" onClick={(e) => e.stopPropagation()}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_PITCHES.map((p) => (
              <SelectItem key={p} value={p} className="text-xs">
                {p} ({(PITCH_MULTIPLIERS[p] ?? 1).toFixed(3)}×)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(facet.wastePercent)}
          onValueChange={(v) => onUpdate({ wastePercent: parseInt(v) })}
        >
          <SelectTrigger className="h-6 text-[10px] w-[72px]" onClick={(e) => e.stopPropagation()}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WASTE_OPTIONS.map((w) => (
              <SelectItem key={w} value={String(w)} className="text-xs">
                {w}% waste
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-1 text-[10px]">
        <div className="text-center">
          <div className="text-muted-foreground">Flat</div>
          <div className="font-semibold">{Math.round(facet.areaSqft)}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">Pitched</div>
          <div className="font-semibold">{Math.round(pitched)}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">Squares</div>
          <div className="font-bold text-primary">{squares.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

function RoofSectionGroup({
  roof, facets, isActive, selectedFacetId,
  onSelectFacet, onUpdateFacet, onDeleteFacet,
  onUpdateRoof, onDeleteRoof, onSetActive, canDelete,
}: {
  roof: RoofSection;
  facets: RoofFacet[];
  isActive: boolean;
  selectedFacetId: string | null;
  onSelectFacet: (id: string | null) => void;
  onUpdateFacet: (id: string, updates: Partial<RoofFacet>) => void;
  onDeleteFacet: (id: string) => void;
  onUpdateRoof: (name: string) => void;
  onDeleteRoof: () => void;
  onSetActive: () => void;
  canDelete: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);

  const sectionFlat = facets.reduce((s, f) => s + f.areaSqft, 0);
  const sectionPitched = facets.reduce((s, f) => s + facetPitchedArea(f), 0);
  const sectionSquares = facets.reduce((s, f) => s + facetSquares(f), 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={`rounded-md border transition-colors ${
          isActive ? "border-primary/40 bg-primary/5" : "border-border/30"
        }`}
      >
        <CollapsibleTrigger asChild>
          <div
            className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer hover:bg-muted/50 rounded-t-md"
            onClick={() => onSetActive()}
          >
            {isOpen ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            <Home className="h-3 w-3 text-muted-foreground" />
            <Input
              value={roof.name}
              onChange={(e) => onUpdateRoof(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="h-5 text-[11px] font-semibold px-1 flex-1 min-w-0 border-none bg-transparent shadow-none focus-visible:ring-0"
            />
            <span className="text-[10px] text-muted-foreground shrink-0">
              {facets.length} facet{facets.length !== 1 ? "s" : ""}
            </span>
            {canDelete && (
              <Button
                variant="ghost" size="icon"
                className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDeleteRoof(); }}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-2 pb-2 space-y-1.5">
            {facets.length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-2">
                Draw facets on the map to add to this roof.
              </p>
            )}
            {facets.map((facet) => (
              <FacetCard
                key={facet.id}
                facet={facet}
                isSelected={facet.id === selectedFacetId}
                onSelect={() => onSelectFacet(facet.id === selectedFacetId ? null : facet.id)}
                onUpdate={(updates) => onUpdateFacet(facet.id, updates)}
                onDelete={() => onDeleteFacet(facet.id)}
              />
            ))}

            {/* Per-roof subtotals */}
            {facets.length > 0 && (
              <div className="pt-1 border-t border-border/30 grid grid-cols-3 gap-1 text-[10px]">
                <div className="text-center">
                  <div className="text-muted-foreground">Flat</div>
                  <div className="font-medium">{Math.round(sectionFlat).toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Pitched</div>
                  <div className="font-medium">{Math.round(sectionPitched).toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Subtotal</div>
                  <div className="font-bold text-primary">{sectionSquares.toFixed(2)} sq</div>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function FacetListPanel({
  facets, edges, roofs, activeRoofId, selectedFacetId,
  onSelectFacet, onUpdateFacet, onDeleteFacet,
  onAddRoof, onUpdateRoof, onDeleteRoof, onSetActiveRoof,
}: FacetListPanelProps) {
  // Edge totals
  const edgeTotals: Partial<Record<EdgeType, number>> = {};
  edges.forEach(e => {
    edgeTotals[e.edgeType] = (edgeTotals[e.edgeType] || 0) + e.lengthFt;
  });

  // Grand totals
  const totalFlatArea = facets.reduce((s, f) => s + f.areaSqft, 0);
  const totalPitchedArea = facets.reduce((s, f) => s + facetPitchedArea(f), 0);
  const totalSquares = facets.reduce((s, f) => s + facetSquares(f), 0);
  const totalEdgeFt = edges.reduce((s, e) => s + e.lengthFt, 0);

  return (
    <Card className="w-[320px] bg-background/95 backdrop-blur-sm shadow-xl border-border/50 max-h-[calc(100%-5rem)] flex flex-col">
      <CardHeader className="py-2 px-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
            <Pentagon className="h-3.5 w-3.5 text-primary" />
            Roof Sections ({roofs.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] gap-1 px-2"
            onClick={onAddRoof}
          >
            <Plus className="h-3 w-3" />
            Add Roof
          </Button>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 min-h-0">
        <CardContent className="p-2 space-y-2">
          {roofs.map((roof) => {
            const roofFacets = facets.filter(f => f.roofId === roof.id);
            return (
              <RoofSectionGroup
                key={roof.id}
                roof={roof}
                facets={roofFacets}
                isActive={roof.id === activeRoofId}
                selectedFacetId={selectedFacetId}
                onSelectFacet={onSelectFacet}
                onUpdateFacet={onUpdateFacet}
                onDeleteFacet={onDeleteFacet}
                onUpdateRoof={(name) => onUpdateRoof(roof.id, name)}
                onDeleteRoof={() => onDeleteRoof(roof.id)}
                onSetActive={() => onSetActiveRoof(roof.id)}
                canDelete={roofs.length > 1}
              />
            );
          })}

          {/* Edge Summary */}
          {edges.length > 0 && (
            <div className="pt-2 border-t border-border/50 space-y-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Minus className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Edge Summary
                </span>
              </div>
              {EDGE_TYPE_ORDER.filter(et => edgeTotals[et]).map(et => (
                <div key={et} className="flex items-center justify-between text-xs px-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-1 rounded-full"
                      style={{ backgroundColor: EDGE_COLORS[et] }}
                    />
                    <span className="text-muted-foreground">{EDGE_LABELS[et]}</span>
                  </div>
                  <span className="font-medium">{Math.round(edgeTotals[et]!)} ft</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-xs px-1 pt-1 border-t border-border/30">
                <span className="text-muted-foreground font-medium">Total Edges</span>
                <span className="font-bold">{Math.round(totalEdgeFt)} ft</span>
              </div>
            </div>
          )}
        </CardContent>
      </ScrollArea>

      {/* Grand Totals Footer */}
      {facets.length > 0 && (
        <div className="border-t border-border/50 p-2.5 space-y-1 bg-muted/30">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Flat Area</span>
            <span className="font-medium">{Math.round(totalFlatArea).toLocaleString()} sqft</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Pitched Area</span>
            <span className="font-medium">{Math.round(totalPitchedArea).toLocaleString()} sqft</span>
          </div>
          <div className="flex justify-between text-sm font-bold pt-1 border-t border-border/30">
            <span>Total Squares</span>
            <span className="text-primary">{totalSquares.toFixed(2)} sq</span>
          </div>
        </div>
      )}
    </Card>
  );
}
