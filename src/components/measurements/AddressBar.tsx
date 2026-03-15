import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AddressBarProps {
  onSelect: (address: string, coords: { lat: number; lng: number }) => void;
}

interface GeocodeResult {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
}

export function AddressBar({ onSelect }: AddressBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 3) { setResults([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("geocode-address", {
        body: { query: q, limit: 5 },
      });
      if (!error && data?.features) {
        setResults(data.features);
        setShowResults(true);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = (r: GeocodeResult) => {
    setQuery(r.place_name);
    setShowResults(false);
    onSelect(r.place_name, { lat: r.center[1], lng: r.center[0] });
  };

  return (
    <div className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            search(e.target.value);
          }}
          placeholder="Enter property address..."
          className="pl-9 pr-10 h-10 bg-background/95 backdrop-blur-sm shadow-lg border-border/50"
          onFocus={() => results.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-xl max-h-60 overflow-auto">
          {results.map((r) => (
            <button
              key={r.id}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent flex items-center gap-2 transition-colors"
              onMouseDown={() => handleSelect(r)}
            >
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{r.place_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
