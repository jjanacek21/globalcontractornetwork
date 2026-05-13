import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Phone, Mail, Globe, CheckCircle, Star, Home, Zap, Droplets, Wind, Hammer, TreePine, Award, MessageSquare, DoorOpen, Wrench, Sun, Paintbrush, Fence, Grid3X3, Ruler, AlertTriangle } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { ReviewSubmissionDialog } from "@/components/contractor-directory/ReviewSubmissionDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ContractorProfile {
  id: string;
  company_id?: string | null;
  company_name: string;
  category: string;
  description: string;
  service_area: string[];
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  is_verified: boolean;
  average_rating: number;
  review_count: number;
  contractor_type?: string;
  verification_status?: string;
  is_directory_eligible?: boolean;
  profile_type?: string;
}

const categoryIcons: Record<string, any> = {
  roofing: Home,
  electrical: Zap,
  plumbing: Droplets,
  hvac: Wind,
  general: Hammer,
  landscaping: TreePine,
  windows: DoorOpen,
  handyman: Wrench,
  solar: Sun,
  painting: Paintbrush,
  fencing: Fence,
  flooring: Grid3X3,
  engineering: Ruler
};

const categoryColors: Record<string, string> = {
  roofing: "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20",
  electrical: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20",
  plumbing: "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20",
  hvac: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20",
  general: "bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20",
  landscaping: "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20",
  windows: "bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20",
  handyman: "bg-slate-500/10 text-slate-400 border-slate-500/30 hover:bg-slate-500/20",
  solar: "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
  painting: "bg-pink-500/10 text-pink-400 border-pink-500/30 hover:bg-pink-500/20",
  fencing: "bg-stone-500/10 text-stone-400 border-stone-500/30 hover:bg-stone-500/20",
  flooring: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20",
  engineering: "bg-violet-500/10 text-violet-400 border-violet-500/30 hover:bg-violet-500/20"
};

export default function ContractorDirectory() {
  const [contractors, setContractors] = useState<ContractorProfile[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("rating");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [profileTypeFilter, setProfileTypeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<ContractorProfile | null>(null);

  const locations = [
    { id: "all", name: "All Locations" },
    { id: "Miami-Dade", name: "Miami-Dade County" },
    { id: "Miami", name: "Miami" },
    { id: "Miami Beach", name: "Miami Beach" },
    { id: "Hialeah", name: "Hialeah" },
    { id: "Coral Gables", name: "Coral Gables" },
    { id: "Homestead", name: "Homestead" },
    { id: "Broward", name: "Broward County" },
    { id: "Fort Lauderdale", name: "Fort Lauderdale" },
    { id: "Hollywood", name: "Hollywood" },
    { id: "Pompano Beach", name: "Pompano Beach" },
    { id: "Coral Springs", name: "Coral Springs" },
    { id: "Pembroke Pines", name: "Pembroke Pines" },
    { id: "Weston", name: "Weston" },
    { id: "Palm Beach", name: "Palm Beach County" },
    { id: "West Palm Beach", name: "West Palm Beach" },
    { id: "Boca Raton", name: "Boca Raton" },
    { id: "Delray Beach", name: "Delray Beach" },
    { id: "Boynton Beach", name: "Boynton Beach" },
    { id: "Jupiter", name: "Jupiter" },
  ];

  const categories = [
    { id: "all", name: "All", icon: null },
    { id: "roofing", name: "Roofing", icon: Home },
    { id: "electrical", name: "Electrical", icon: Zap },
    { id: "plumbing", name: "Plumbing", icon: Droplets },
    { id: "hvac", name: "HVAC", icon: Wind },
    { id: "general", name: "General", icon: Hammer },
    { id: "landscaping", name: "Landscaping", icon: TreePine },
    { id: "windows", name: "Windows", icon: DoorOpen },
    { id: "handyman", name: "Handyman", icon: Wrench },
    { id: "solar", name: "Solar", icon: Sun },
    { id: "painting", name: "Painting", icon: Paintbrush },
    { id: "fencing", name: "Fencing", icon: Fence },
    { id: "flooring", name: "Flooring", icon: Grid3X3 },
    { id: "engineering", name: "Engineering", icon: Ruler }
  ];

  useEffect(() => {
    loadContractors();
  }, [selectedCategory]);

  const loadContractors = async () => {
    setLoading(true);

    // Load all contractor profiles. The directory shows BOTH verified pros
    // (via feature access OR is_directory_eligible) AND unverified independents/handymen.
    let query = supabase
      .from("contractor_profiles")
      .select("*");

    if (selectedCategory !== "all") {
      query = query.eq("category", selectedCategory);
    }

    const { data } = await query;
    setContractors((data as ContractorProfile[]) || []);
    setLoading(false);
  };

  const isVerifiedListing = (c: ContractorProfile) =>
    c.is_directory_eligible === true ||
    c.verification_status === "approved" ||
    c.verification_status === "verified" ||
    c.is_verified === true;

  const filteredContractors = contractors
    .filter(c => {
      const matchesSearch = c.company_name.toLowerCase().includes(search.toLowerCase()) ||
        (c.service_area && c.service_area.some(area => area.toLowerCase().includes(search.toLowerCase())));
      const matchesVerified = !verifiedOnly || isVerifiedListing(c);
      const matchesLocation = selectedLocation === "all" || 
        (c.service_area && c.service_area.some(area => area.toLowerCase().includes(selectedLocation.toLowerCase())));
      return matchesSearch && matchesVerified && matchesLocation;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.average_rating || 0) - (a.average_rating || 0);
        case "reviews":
          return (b.review_count || 0) - (a.review_count || 0);
        case "name":
          return a.company_name.localeCompare(b.company_name);
        default:
          return 0;
      }
    });

  const verifiedContractors = filteredContractors.filter(isVerifiedListing);
  const unverifiedContractors = filteredContractors.filter(c => !isVerifiedListing(c));

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />);
      } else if (i === fullStars && hasHalf) {
        stars.push(<Star key={i} className="h-4 w-4 fill-amber-400/50 text-amber-400" />);
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-slate-600" />);
      }
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <PublicHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Find a Contractor</h1>
            <p className="text-xl text-slate-400 mb-8">Connect with the best reviewed professionals in your area</p>
          </div>

          {/* Category Buttons - Prominent */}
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2 mb-8">
            {categories.map((cat) => {
              const IconComponent = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <Button
                  key={cat.id}
                  variant="outline"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex flex-col items-center gap-2 h-auto py-4 transition-all ${
                    isSelected 
                      ? "bg-amber-500/20 border-amber-500 text-amber-400" 
                      : cat.id !== "all" 
                        ? categoryColors[cat.id] 
                        : "border-slate-700 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {IconComponent && <IconComponent className="h-6 w-6" />}
                  <span className="text-sm font-medium">{cat.name}</span>
                </Button>
              );
            })}
          </div>

          {/* Search and Sort Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700 text-white">
                  <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {locations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px] bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="rating">Best Reviewed</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                  <SelectItem value="name">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={verifiedOnly ? "default" : "outline"}
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={verifiedOnly 
                  ? "bg-green-500/20 border-green-500 text-green-400" 
                  : "border-slate-700 text-slate-300"
                }
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Verified Only
              </Button>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-slate-400 mb-4">
            Showing {filteredContractors.length} contractor{filteredContractors.length !== 1 ? "s" : ""}
            {verifiedContractors.length > 0 && ` · ${verifiedContractors.length} verified`}
            {unverifiedContractors.length > 0 && ` · ${unverifiedContractors.length} unverified`}
            {selectedCategory !== "all" && ` in ${selectedCategory}`}
            {selectedLocation !== "all" && ` serving ${selectedLocation}`}
          </p>

          {/* Safety disclaimer for unverified */}
          {!verifiedOnly && unverifiedContractors.length > 0 && (
            <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-100">
                <p className="font-semibold mb-1">Some contractors below are unverified</p>
                <p className="text-amber-200/80">
                  Independent crews and handymen marked "Unverified" have not completed our full vetting process. We recommend using them only for repairs, handyman work, or alongside a project consultant. Toggle "Verified Only" above to hide them.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading contractors...</div>
          ) : filteredContractors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No contractors found matching your criteria.</p>
              <Button 
                variant="outline" 
                className="mt-4 border-slate-700 text-slate-300"
                onClick={() => { setSearch(""); setSelectedCategory("all"); setSelectedLocation("all"); setVerifiedOnly(false); }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContractors.map((contractor, index) => {
                const isTopRated = index < 3 && sortBy === "rating" && (contractor.average_rating || 0) >= 4.5;
                const CategoryIcon = categoryIcons[contractor.category];
                
                return (
                  <Card 
                    key={contractor.id} 
                    className={`bg-slate-900 border-slate-800 hover:border-slate-700 transition-all relative ${
                      isTopRated ? "ring-2 ring-amber-500/50" : ""
                    }`}
                  >
                    {isTopRated && (
                      <div className="absolute -top-3 left-4 bg-amber-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        Top Rated
                      </div>
                    )}
                    <CardHeader className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {contractor.logo_url ? (
                            <img src={contractor.logo_url} alt={contractor.company_name} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                              {CategoryIcon && <CategoryIcon className="h-6 w-6 text-slate-400" />}
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-lg text-white">{contractor.company_name}</CardTitle>
                            <Badge className={`mt-1 capitalize ${categoryColors[contractor.category] || "bg-slate-700"}`}>
                              {contractor.category}
                            </Badge>
                          </div>
                        </div>
                        {isVerifiedListing(contractor) ? (
                          <div className="flex items-center gap-1 text-green-400" title="Verified">
                            <CheckCircle className="h-5 w-5" />
                          </div>
                        ) : (
                          <Badge variant="outline" className="border-amber-500/40 text-amber-300 bg-amber-500/10 text-[10px]">
                            Unverified
                          </Badge>
                        )}
                      </div>
                      
                      {/* Rating Display */}
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex">
                          {renderStars(contractor.average_rating || 0)}
                        </div>
                        <span className="text-amber-400 font-semibold">
                          {(contractor.average_rating || 0).toFixed(1)}
                        </span>
                        <span className="text-slate-500 text-sm">
                          ({contractor.review_count || 0} reviews)
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-400 mb-4 line-clamp-2">{contractor.description}</p>
                      
                      <div className="space-y-2 text-sm mb-4">
                        {contractor.service_area && contractor.service_area.length > 0 && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-500" />
                            <span className="text-slate-300">{contractor.service_area.join(", ")}</span>
                          </div>
                        )}
                        {contractor.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-500" />
                            <span className="text-slate-300">{contractor.phone}</span>
                          </div>
                        )}
                        {contractor.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-500" />
                            <span className="truncate text-slate-300">{contractor.email}</span>
                          </div>
                        )}
                        {contractor.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-slate-500" />
                            <a href={contractor.website} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline truncate">
                              Visit Website
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white" 
                          onClick={() => window.location.href = `mailto:${contractor.email}`}
                        >
                          Contact
                        </Button>
                        <Button 
                          variant="outline"
                          className="border-slate-700 text-slate-300 hover:bg-slate-800"
                          onClick={() => {
                            setSelectedContractor(contractor);
                            setReviewDialogOpen(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Review Dialog */}
      {selectedContractor && (
        <ReviewSubmissionDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          contractorId={selectedContractor.id}
          contractorName={selectedContractor.company_name}
        />
      )}
    </div>
  );
}
