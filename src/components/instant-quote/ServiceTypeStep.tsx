import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HardHat, DoorOpen, AlertTriangle, Trees, Sparkles, ArrowLeft,
  Home, Minus, Square, LayoutGrid, SquareDashed, RectangleHorizontal,
  Paintbrush, Grip, SprayCan, AppWindow, Hammer, Archive, SquareStack,
  Paintbrush2, Frame, Zap, Droplet, ChefHat, Bath, TreePine, Wrench,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { PropertyType, ServiceType } from "./InstantQuoteWizard";

interface ServiceTypeStepProps {
  propertyType: PropertyType;
  onSelect: (type: ServiceType) => void;
  onBack: () => void;
}

interface TradeRow {
  slug: string;
  name: string;
  description: string;
  category: string;
  icon_name: string;
  sort_order: number;
}

const ICONS: Record<string, LucideIcon> = {
  "hard-hat": HardHat, "door-open": DoorOpen, "alert-triangle": AlertTriangle,
  "tree-pine": TreePine, sparkles: Sparkles, home: Home, minus: Minus,
  square: Square, "layout-grid": LayoutGrid, "square-dashed": SquareDashed,
  "rectangle-horizontal": RectangleHorizontal, paintbrush: Paintbrush,
  grip: Grip, "spray-can": SprayCan, "app-window": AppWindow, hammer: Hammer,
  archive: Archive, "square-stack": SquareStack, "paintbrush-2": Paintbrush2,
  "wave-sine": SquareDashed, frame: Frame, zap: Zap, droplet: Droplet,
  "chef-hat": ChefHat, bath: Bath,
};

// Slugs that have hand-built custom wizards inside InstantQuoteWizard
const NATIVE_SLUGS: Record<string, ServiceType> = {
  roofing: "roofing",
  windows: "windows",
  "emergency-services": "emergency",
  "tree-landscaping": "landscaping",
  "pressure-washing": "cleaning", // routes to existing cleaning wizard
};

const CATEGORY_META: Record<string, { label: string; accent: string; chip: string }> = {
  exterior:     { label: "Exterior",      accent: "from-sky-500 to-blue-600",       chip: "text-sky-700 bg-sky-100" },
  interior:     { label: "Interior",      accent: "from-amber-500 to-orange-600",   chip: "text-amber-700 bg-amber-100" },
  kitchen_bath: { label: "Kitchen & Bath", accent: "from-rose-500 to-pink-600",      chip: "text-rose-700 bg-rose-100" },
  specialty:    { label: "Specialty",     accent: "from-teal-500 to-emerald-600",   chip: "text-teal-700 bg-teal-100" },
  emergency:    { label: "Emergency",     accent: "from-red-500 to-orange-600",     chip: "text-red-700 bg-red-100" },
};

const CATEGORY_ORDER = ["exterior", "interior", "kitchen_bath", "specialty", "emergency"];

export function ServiceTypeStep({ propertyType, onSelect, onBack }: ServiceTypeStepProps) {
  const navigate = useNavigate();
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("iq_trades")
        .select("slug,name,description,category,icon_name,sort_order")
        .eq("active", true)
        .order("category")
        .order("sort_order");
      setTrades((data as TradeRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const handleClick = (slug: string) => {
    const native = NATIVE_SLUGS[slug];
    if (native) {
      onSelect(native);
    } else {
      navigate(`/instant-quote/${slug}`);
    }
  };

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: trades.filter((t) => t.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col items-center pt-4 animate-fade-in">
      <button onClick={onBack} className="self-start flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to property type
      </button>

      <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center">What service do you need?</h1>
      <p className="text-muted-foreground mb-10 text-center">
        For your <span className="font-medium text-foreground capitalize">{propertyType}</span> property — pick any of our {trades.length || 25} services
      </p>

      {loading && <div className="text-sm text-muted-foreground">Loading services…</div>}

      <div className="w-full max-w-6xl space-y-10">
        {grouped.map(({ cat, items }) => {
          const meta = CATEGORY_META[cat] ?? CATEGORY_META.exterior;
          return (
            <section key={cat}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-1 w-10 rounded-full bg-gradient-to-r ${meta.accent}`} />
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{meta.label}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${meta.chip}`}>{items.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((t) => {
                  const Icon = ICONS[t.icon_name] ?? Wrench;
                  const isNative = !!NATIVE_SLUGS[t.slug];
                  return (
                    <button
                      key={t.slug}
                      onClick={() => handleClick(t.slug)}
                      className="group relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left overflow-hidden"
                    >
                      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${meta.accent} opacity-60 group-hover:opacity-100 transition-opacity`} />
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${meta.accent} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="text-sm font-semibold text-center leading-tight">{t.name}</h3>
                      <p className="text-xs text-muted-foreground text-center leading-snug line-clamp-2">{t.description}</p>
                      {isNative && (
                        <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">PRO</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
