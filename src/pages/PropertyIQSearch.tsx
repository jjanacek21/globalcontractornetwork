import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PropertyIQHeader } from "@/components/property-iq/PropertyIQHeader";
import { PropertyIQFooter } from "@/components/property-iq/PropertyIQFooter";
import { PropertyCard } from "@/components/property-iq/PropertyCard";
import { seedProperties } from "@/lib/propertyIQSeedData";
import { Search } from "lucide-react";

const PropertyIQSearch = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();

  // Simple filter on address/city/owner name
  const filtered = query.trim()
    ? seedProperties.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.address.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.county.toLowerCase().includes(q) ||
          p.owners.some((o) => o.name.toLowerCase().includes(q))
        );
      })
    : seedProperties;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/property-iq/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PropertyIQHeader />

      <div className="container mx-auto max-w-4xl px-4 py-8 flex-1">
        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by address, city, county, or owner..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <p className="text-sm text-muted-foreground mb-4">
          {filtered.length} {filtered.length === 1 ? 'property' : 'properties'} found
        </p>

        <div className="space-y-4">
          {filtered.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-medium">No properties found</p>
              <p className="text-sm">Try a different search term or browse all properties</p>
              <Button variant="outline" className="mt-4" onClick={() => setQuery("")}>
                Show All
              </Button>
            </div>
          )}
        </div>
      </div>

      <PropertyIQFooter />
    </div>
  );
};

export default PropertyIQSearch;
