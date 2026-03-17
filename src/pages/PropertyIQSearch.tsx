import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddressAutocomplete } from "@/components/homeowner/AddressAutocomplete";
import { Button } from "@/components/ui/button";
import { PropertyIQHeader } from "@/components/property-iq/PropertyIQHeader";
import { PropertyIQFooter } from "@/components/property-iq/PropertyIQFooter";
import { PropertyCard } from "@/components/property-iq/PropertyCard";
import { PropertyIQMap } from "@/components/property-iq/PropertyIQMap";
import { usePropertyIQSearch, useAttomLookup } from "@/hooks/usePropertyIQ";
import { Search, Loader2, Database, Users, CloudRain, Building2, List, Map } from "lucide-react";

const PropertyIQSearch = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [flyToCoords, setFlyToCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [attomTriggered, setAttomTriggered] = useState(false);
  const navigate = useNavigate();

  const { data: results, isLoading } = usePropertyIQSearch(query);
  const attomLookup = useAttomLookup();
  const filtered = results || [];

  const hasNoMatch = query.trim() !== "" && !isLoading && filtered.length === 0;

  // Auto-trigger ATTOM lookup when no DB results
  useEffect(() => {
    if (hasNoMatch && !attomTriggered && !attomLookup.isPending) {
      setAttomTriggered(true);
      attomLookup.mutate(query);
    }
  }, [hasNoMatch, attomTriggered, query]);

  // Reset attom trigger when query changes
  useEffect(() => {
    setAttomTriggered(false);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAttomTriggered(false);
    navigate(`/property-iq/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PropertyIQHeader />

      <div className="container mx-auto max-w-5xl px-4 py-8 flex-1">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="flex-1">
            <AddressAutocomplete
              value={query}
              onChange={setQuery}
              onSelect={(address, coords) => {
                setQuery(address);
                setAttomTriggered(false);
                if (coords) {
                  setFlyToCoords({ lat: coords.lat, lng: coords.lng });
                  setViewMode("map");
                }
                navigate(`/property-iq/search?q=${encodeURIComponent(address)}`);
              }}
              placeholder="Search by address, city, county, or owner..."
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {!isLoading && !hasNoMatch && `${filtered.length} ${filtered.length === 1 ? "property" : "properties"} found`}
          </p>
          <div className="flex gap-1 border border-border rounded-lg p-0.5">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 px-3 gap-1.5"
            >
              <List className="h-4 w-4" />
              List
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("map")}
              className="h-8 px-3 gap-1.5"
            >
              <MapIcon className="h-4 w-4" />
              Map
            </Button>
          </div>
        </div>

        {(isLoading || attomLookup.isPending) && (
          <div className="text-center py-16 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-lg font-medium">
              {attomLookup.isPending ? "Fetching live property data from ATTOM..." : "Searching..."}
            </p>
            {attomLookup.isPending && (
              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Database className="h-3 w-3" /> Property Details</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Owner Info</span>
                <span className="flex items-center gap-1"><CloudRain className="h-3 w-3" /> Assessment</span>
                <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> Sale History</span>
              </div>
            )}
          </div>
        )}

        {!isLoading && !attomLookup.isPending && !hasNoMatch && viewMode === "map" && (
          <PropertyIQMap properties={filtered} flyTo={flyToCoords} />
        )}

        {!isLoading && !attomLookup.isPending && !hasNoMatch && viewMode === "list" && (
          <div className="space-y-4">
            {filtered.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}

        {!isLoading && !attomLookup.isPending && hasNoMatch && attomTriggered && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">No property found</p>
            <p className="text-sm">ATTOM returned no results for this address. Try a different search.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setQuery(""); setAttomTriggered(false); }}>
              Show All
            </Button>
          </div>
        )}

        {!isLoading && !attomLookup.isPending && filtered.length === 0 && !hasNoMatch && viewMode === "list" && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">No properties found</p>
            <p className="text-sm">Try a different search term or browse all properties</p>
            <Button variant="outline" className="mt-4" onClick={() => setQuery("")}>
              Show All
            </Button>
          </div>
        )}
      </div>

      <PropertyIQFooter />
    </div>
  );
};

export default PropertyIQSearch;
