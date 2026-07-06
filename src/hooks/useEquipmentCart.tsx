import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from "react";

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  bto: boolean;
  unit_price_cents: number;
  qty: number;
}

export type PayMode = "deposit" | "full";

interface CartCtx {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  itemCount: number;
  subtotalCents: number;
  btoSubtotalCents: number;
  partsSubtotalCents: number;
  depositDueCents: number;
  fullDueCents: number;
  balanceCents: (mode: PayMode) => number;
  dueTodayCents: (mode: PayMode) => number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "gcn-equipment-cart-v1";

export const EquipmentCartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const add: CartCtx["add"] = useCallback((item, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const remove: CartCtx["remove"] = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const setQty: CartCtx["setQty"] = useCallback((id, qty) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i))
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartCtx>(() => {
    const subtotalCents = items.reduce((s, i) => s + i.unit_price_cents * i.qty, 0);
    const btoSubtotalCents = items
      .filter((i) => i.bto)
      .reduce((s, i) => s + i.unit_price_cents * i.qty, 0);
    const partsSubtotalCents = subtotalCents - btoSubtotalCents;
    const depositDueCents = Math.round(btoSubtotalCents * 0.5) + partsSubtotalCents;
    const fullDueCents = Math.round(subtotalCents * 0.97);

    return {
      items,
      add,
      remove,
      setQty,
      clear,
      itemCount: items.reduce((s, i) => s + i.qty, 0),
      subtotalCents,
      btoSubtotalCents,
      partsSubtotalCents,
      depositDueCents,
      fullDueCents,
      balanceCents: (mode) => (mode === "deposit" ? subtotalCents - depositDueCents : 0),
      dueTodayCents: (mode) => (mode === "deposit" ? depositDueCents : fullDueCents),
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    };
  }, [items, add, remove, setQty, clear, isOpen]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useEquipmentCart = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEquipmentCart must be used within EquipmentCartProvider");
  return ctx;
};
