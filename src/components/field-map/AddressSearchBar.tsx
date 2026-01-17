import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import mapboxgl from "mapbox-gl";

interface AddressSearchBarProps {
  map: mapboxgl.Map | null;
  onSelectLocation: (coordinates: [number, number], address: string) => void;
}

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
}

export function AddressSearchBar({ map, onSelectLocation }: AddressSearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('geocode-address', {
          body: {
            query,
            limit: 5,
            types: 'address',
            country: 'us',
          },
        });

        if (error) {
          console.error('Geocoding error:', error);
        } else if (data?.features) {
          setResults(data.features);
          setShowResults(true);
        }
      } catch (error) {
        console.error("Error searching address:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  const handleSelectResult = (result: SearchResult) => {
    setQuery(result.place_name);
    setShowResults(false);
    setResults([]);
    
    if (map) {
      map.flyTo({
        center: result.center,
        zoom: 18,
        essential: true,
      });
    }
    
    onSelectLocation(result.center, result.place_name);
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-10">
      <div className="relative max-w-md">
        <div className="relative">
          {loading ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
          <Input
            type="text"
            placeholder="Search address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className="pl-10 bg-background shadow-lg"
          />
        </div>
        
        {showResults && results.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelectResult(result)}
                className="w-full px-4 py-2 text-left hover:bg-accent text-sm transition-colors"
              >
                {result.place_name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
