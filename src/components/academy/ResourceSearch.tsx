import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const states = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];

const categories = [
  { value: "licensing", label: "Licensing & Business" },
  { value: "insurance", label: "Insurance Guide" },
  { value: "permits", label: "Permits & Codes" },
  { value: "products", label: "Product Knowledge" },
  { value: "homeowner", label: "Homeowner Resources" },
  { value: "videos", label: "Video Library" },
  { value: "checklists", label: "Checklists & Tools" },
  { value: "states", label: "State Requirements" }
];

const resourceTypes = [
  { value: "article", label: "Article" },
  { value: "video", label: "Video" },
  { value: "guide", label: "Guide" },
  { value: "checklist", label: "Checklist" },
  { value: "tool", label: "Tool" }
];

const audiences = [
  { value: "contractor", label: "Contractors" },
  { value: "homeowner", label: "Homeowners" },
  { value: "both", label: "Both" }
];

interface ResourceSearchProps {
  onSearch?: (query: string, filters: Record<string, string>) => void;
  compact?: boolean;
}

export const ResourceSearch = ({ onSearch, compact = false }: ResourceSearchProps) => {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [audience, setAudience] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (state) params.set("state", state);
    if (category) params.set("category", category);
    if (type) params.set("type", type);
    if (audience) params.set("audience", audience);
    
    navigate(`/academy/resources?${params.toString()}`);
    
    if (onSearch) {
      onSearch(query, { state, category, type, audience });
    }
  };

  const clearFilters = () => {
    setQuery("");
    setState("");
    setCategory("");
    setType("");
    setAudience("");
  };

  const hasFilters = query || state || category || type || audience;

  if (compact) {
    return (
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
      </div>
    );
  }

  return (
    <section className="py-12 bg-background">
      <div className="container">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Search Resources</h2>
            <p className="text-muted-foreground">Find exactly what you need</p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for licensing, insurance, permits, products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-12 h-14 text-lg"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Select value={state} onValueChange={setState}>
              <SelectTrigger>
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s} value={s.toLowerCase().replace(/\s+/g, '-')}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {resourceTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger>
                <SelectValue placeholder="Audience" />
              </SelectTrigger>
              <SelectContent>
                {audiences.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={handleSearch} className="px-8">
              <Search className="w-4 h-4 mr-2" />
              Search Resources
            </Button>
            {hasFilters && (
              <Button size="lg" variant="outline" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
