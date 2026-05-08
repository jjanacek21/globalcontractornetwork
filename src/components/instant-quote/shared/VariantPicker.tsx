import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Check } from "lucide-react";
import { Card3D } from "@/components/crm-ui/Card3D";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { VariantGroup, Variant } from "../tradeVariants";

export type SelectedVariant = {
  variantId: string;
  label: string;
  qty: number;
  size?: string;
};

interface Props {
  group: VariantGroup;
  selections: SelectedVariant[];
  onChange: (next: SelectedVariant[]) => void;
  // For "area" mode: a single number (sqft / LF / rooms)
  areaValue?: number;
  onAreaChange?: (n: number) => void;
}

export function VariantPicker({ group, selections, onChange, areaValue, onAreaChange }: Props) {
  const isItems = group.mode === "items";
  const selectedIds = new Set(selections.map((s) => s.variantId));

  const toggle = (v: Variant) => {
    if (isItems) {
      // multi-select with quantity
      if (selectedIds.has(v.id)) {
        onChange(selections.filter((s) => s.variantId !== v.id));
      } else {
        onChange([...selections, { variantId: v.id, label: v.label, qty: 1, size: v.sizes?.[0] }]);
      }
    } else {
      // single-select (material/scope)
      onChange([{ variantId: v.id, label: v.label, qty: 1, size: v.sizes?.[0] }]);
    }
  };

  const setQty = (id: string, qty: number) => {
    onChange(selections.map((s) => (s.variantId === id ? { ...s, qty: Math.max(0, qty) } : s)));
  };

  const setSize = (id: string, size: string) => {
    onChange(selections.map((s) => (s.variantId === id ? { ...s, size } : s)));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{group.title}</h3>
        {group.intro && <p className="text-sm text-muted-foreground">{group.intro}</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {group.variants.map((v, i) => {
          const selected = selectedIds.has(v.id);
          return (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 200, damping: 18 }}
            >
              <Card3D
                tiltIntensity={selected ? 6 : 12}
                className={cn(
                  "relative cursor-pointer h-full p-4 text-center transition-all",
                  selected
                    ? "ring-2 ring-primary border-primary bg-gradient-to-br from-primary/10 via-emerald-500/5 to-amber-200/10"
                    : "hover:border-primary/40"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(v)}
                  className="w-full h-full flex flex-col items-center gap-2"
                  aria-pressed={selected}
                >
                  <motion.div
                    className="text-4xl select-none"
                    animate={selected ? { scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] } : { scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {v.icon}
                  </motion.div>
                  <div className="font-semibold text-sm leading-tight">{v.label}</div>
                  {v.hint && <div className="text-[11px] text-muted-foreground">{v.hint}</div>}
                </button>

                <AnimatePresence>
                  {selected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card3D>
            </motion.div>
          );
        })}
      </div>

      {/* Quantity + size editors for items mode */}
      {isItems && selections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2 pt-2 border-t"
        >
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Quantities ({group.unitLabel})
          </Label>
          {selections.map((s) => {
            const v = group.variants.find((x) => x.id === s.variantId);
            return (
              <motion.div
                key={s.variantId}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/40"
              >
                <span className="text-2xl">{v?.icon}</span>
                <span className="font-medium text-sm flex-1 min-w-[120px]">{s.label}</span>

                {v?.sizes && v.sizes.length > 0 && (
                  <select
                    value={s.size || v.sizes[0]}
                    onChange={(e) => setSize(s.variantId, e.target.value)}
                    className="text-xs px-2 py-1 rounded border bg-background"
                  >
                    {v.sizes.map((sz) => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                )}

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setQty(s.variantId, s.qty - 1)}
                    className="h-8 w-8 rounded-full border bg-background hover:bg-muted flex items-center justify-center"
                    aria-label="Decrease"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <motion.div
                    key={s.qty}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    className="w-10 text-center font-bold tabular-nums"
                  >
                    {s.qty}
                  </motion.div>
                  <button
                    type="button"
                    onClick={() => setQty(s.variantId, s.qty + 1)}
                    className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
                    aria-label="Increase"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Single number entry for area mode */}
      {!isItems && selections.length > 0 && onAreaChange && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2 border-t"
        >
          <Label className="text-sm font-semibold">{group.areaPrompt || "Amount"}</Label>
          <Input
            type="number"
            min={0}
            value={areaValue ?? ""}
            placeholder={group.areaPlaceholder}
            onChange={(e) => onAreaChange(Number(e.target.value))}
            className="mt-2 text-lg h-12"
          />
        </motion.div>
      )}
    </div>
  );
}
