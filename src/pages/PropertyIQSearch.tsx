import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddressAutocomplete } from "@/components/homeowner/AddressAutocomplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PropertyIQHeader } from "@/components/property-iq/PropertyIQHeader";
import { PropertyIQFooter } from "@/components/property-iq/PropertyIQFooter";
import { PropertyCard } from "@/components/property-iq/PropertyCard";
import { PropertyIQMap } from "@/components/property-iq/PropertyIQMap";
import { usePropertyIQSearch } from "@/hooks/usePropertyIQ";
import { Search, Loader2, Database, Users, CloudRain, Building2, List, MapIcon } from "lucide-react";

const PropertyIQSearch = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [simulating, setSimulating] = useState(false);
  const [showDemoResult, setShowDemoResult] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [flyToCoords, setFlyToCoords] = useState<{ lat: number; lng: number } | null>(null);
  const navigate = useNavigate();

  const { data: results, isLoading } = usePropertyIQSearch(query);
  const filtered = results || [];

  const hasNoMatch = query.trim() !== "" && !isLoading && filtered.length === 0;

  useEffect(() => {
    if (hasNoMatch) {
      setSimulating(true);
      setShowDemoResult(false);
      const timer = setTimeout(() => {
        setSimulating(false);
        setShowDemoResult(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setSimulating(false);
      setShowDemoResult(false);
    }
  }, [hasNoMatch, query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
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

        {isLoading && (
          <div className="text-center py-16">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Searching...</p>
          </div>
        )}

        {!isLoading && !hasNoMatch && viewMode === "map" && (
          <PropertyIQMap properties={filtered} flyTo={flyToCoords} />
        )}

        {!isLoading && !hasNoMatch && viewMode === "list" && (
          <div className="space-y-4">
            {filtered.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}

        {/* Simulated API lookup for non-matching addresses */}
        {simulating && (
          <div className="text-center py-16 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-lg font-medium">Searching property databases...</p>
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Database className="h-3 w-3" /> Property Appraiser</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Skip Tracing</span>
              <span className="flex items-center gap-1"><CloudRain className="h-3 w-3" /> Storm History</span>
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> Sunbiz</span>
            </div>
          </div>
        )}

        {showDemoResult && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">1 property found via API lookup</p>
            <Card className="border-primary/30 shadow-md">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{query}</h3>
                    <p className="text-sm text-muted-foreground">South Florida • Retrieved via Property Appraiser API</p>
                  </div>
                  <Badge className="bg-emerald-600 text-white">Live Result</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Owner</p>
                    <p className="font-medium">J. Smith Holdings LLC</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Property Type</p>
                    <p className="font-medium">Commercial</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Roof Score</p>
                    <p className="font-medium text-amber-600">72 / 100</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Storm Exposure</p>
                    <p className="font-medium">3 events</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>📞 2 phone numbers found</span>
                  <span>📧 1 email found</span>
                  <span>🏢 Sunbiz entity match</span>
                </div>
                <Button onClick={() => navigate('/property-iq/auth')}>
                  Generate Full Report →
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {!isLoading && !hasNoMatch && filtered.length === 0 && viewMode === "list" && (
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
