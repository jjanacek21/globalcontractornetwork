import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Mail, Globe, CheckCircle } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";

interface ContractorProfile {
  id: string;
  company_name: string;
  category: string;
  description: string;
  service_area: string[];
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  is_verified: boolean;
}

export default function ContractorDirectory() {
  const [contractors, setContractors] = useState<ContractorProfile[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const categories = ["all", "roofing", "plumbing", "electrical", "hvac", "general", "landscaping"];

  useEffect(() => {
    loadContractors();
  }, [selectedCategory]);

  const loadContractors = async () => {
    setLoading(true);
    let query = supabase.from("contractor_profiles").select("*").eq("subscription_status", "active");
    
    if (selectedCategory !== "all") {
      query = query.eq("category", selectedCategory);
    }

    const { data } = await query;
    setContractors(data || []);
    setLoading(false);
  };

  const filteredContractors = contractors.filter(c =>
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    c.service_area.some(area => area.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Find a Contractor</h1>
          <p className="text-muted-foreground mb-8">Connect with verified professionals in your area</p>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat)}
                  className="capitalize"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading contractors...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContractors.map((contractor) => (
                <Card key={contractor.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {contractor.logo_url && (
                          <img src={contractor.logo_url} alt={contractor.company_name} className="w-12 h-12 rounded-full object-cover" />
                        )}
                        <div>
                          <CardTitle className="text-lg">{contractor.company_name}</CardTitle>
                          <Badge variant="secondary" className="mt-1 capitalize">{contractor.category}</Badge>
                        </div>
                      </div>
                      {contractor.is_verified && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{contractor.description}</p>
                    
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{contractor.service_area.join(", ")}</span>
                      </div>
                      {contractor.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{contractor.phone}</span>
                        </div>
                      )}
                      {contractor.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{contractor.email}</span>
                        </div>
                      )}
                      {contractor.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a href={contractor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>

                    <Button className="w-full" onClick={() => window.location.href = `mailto:${contractor.email}`}>
                      Contact Contractor
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
