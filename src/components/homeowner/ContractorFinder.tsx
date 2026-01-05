import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Star, MapPin, Phone, Mail, ExternalLink, DollarSign, Clock, Filter, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ContractorProfile {
  id: string;
  company_name: string;
  category: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  average_rating: number | null;
  review_count: number | null;
  is_verified: boolean | null;
  service_area: string[] | null;
  price_tier: string | null;
  availability_days: number | null;
}

const CATEGORIES = [
  'Roofing',
  'Plumbing',
  'HVAC',
  'Electrical',
  'Landscaping',
  'Windows & Doors',
  'Mold Remediation',
  'Emergency Services',
  'General Contractor'
];

const PRICE_TIERS = [
  { value: 'budget', label: '$ Budget-Friendly' },
  { value: 'mid', label: '$$ Mid-Range' },
  { value: 'premium', label: '$$$ Premium' },
  { value: 'luxury', label: '$$$$ Luxury' }
];

export function ContractorFinder() {
  const [contractors, setContractors] = useState<ContractorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriceTier, setSelectedPriceTier] = useState<string>('all');
  const [minRating, setMinRating] = useState<string>('all');
  const [maxAvailability, setMaxAvailability] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    fetchContractors();
  }, []);

  const fetchContractors = async () => {
    try {
      const { data, error } = await supabase
        .from('contractor_profiles')
        .select('*')
        .order('average_rating', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setContractors(data || []);
    } catch (error) {
      console.error('Error fetching contractors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContractors = contractors.filter(c => {
    if (searchQuery && !c.company_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (selectedPriceTier !== 'all' && c.price_tier !== selectedPriceTier) return false;
    if (minRating !== 'all' && (c.average_rating || 0) < parseFloat(minRating)) return false;
    if (maxAvailability !== 'all' && c.availability_days && c.availability_days > parseInt(maxAvailability)) return false;
    if (verifiedOnly && !c.is_verified) return false;
    return true;
  });

  const getPriceTierDisplay = (tier: string | null) => {
    switch (tier) {
      case 'budget': return '$';
      case 'mid': return '$$';
      case 'premium': return '$$$';
      case 'luxury': return '$$$$';
      default: return null;
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5 text-[hsl(45,100%,51%)]" />
            Find Contractors
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search contractors..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="space-y-2">
              <Label className="text-white/70 text-xs">Trade/Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white/70 text-xs">Price Range</Label>
              <Select value={selectedPriceTier} onValueChange={setSelectedPriceTier}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Any Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Price</SelectItem>
                  {PRICE_TIERS.map(tier => (
                    <SelectItem key={tier.value} value={tier.value}>{tier.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white/70 text-xs">Min Rating</Label>
              <Select value={minRating} onValueChange={setMinRating}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Any Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Rating</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  <SelectItem value="5">5 Stars Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white/70 text-xs">Availability</Label>
              <Select value={maxAvailability} onValueChange={setMaxAvailability}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Any Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Time</SelectItem>
                  <SelectItem value="7">Within 1 Week</SelectItem>
                  <SelectItem value="14">Within 2 Weeks</SelectItem>
                  <SelectItem value="30">Within 1 Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2 pb-1">
              <Switch
                id="verified-only"
                checked={verifiedOnly}
                onCheckedChange={setVerifiedOnly}
              />
              <Label htmlFor="verified-only" className="text-white text-sm cursor-pointer">
                Verified Only
              </Label>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="text-center py-8 text-white/60">Loading contractors...</div>
        ) : filteredContractors.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No contractors found matching your criteria</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredContractors.map(contractor => (
              <div
                key={contractor.id}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[hsl(45,100%,51%)]/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Logo/Avatar */}
                  <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                    {contractor.logo_url ? (
                      <img 
                        src={contractor.logo_url} 
                        alt={contractor.company_name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-[hsl(45,100%,51%)]">
                        {contractor.company_name[0]}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          {contractor.company_name}
                          {contractor.is_verified && (
                            <CheckCircle2 className="h-4 w-4 text-[hsl(45,100%,51%)]" />
                          )}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="secondary" className="bg-slate-700 text-white">
                            {contractor.category}
                          </Badge>
                          {contractor.price_tier && (
                            <Badge variant="outline" className="border-green-500/50 text-green-400">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {getPriceTierDisplay(contractor.price_tier)}
                            </Badge>
                          )}
                          {contractor.availability_days && (
                            <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                              <Clock className="h-3 w-3 mr-1" />
                              {contractor.availability_days}d
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Rating */}
                      {contractor.average_rating && (
                        <div className="flex items-center gap-1 text-[hsl(45,100%,51%)]">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="font-medium">{contractor.average_rating.toFixed(1)}</span>
                          {contractor.review_count && (
                            <span className="text-white/50 text-sm">({contractor.review_count})</span>
                          )}
                        </div>
                      )}
                    </div>

                    {contractor.description && (
                      <p className="text-white/60 text-sm mt-2 line-clamp-2">{contractor.description}</p>
                    )}

                    {/* Contact Actions */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {contractor.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => window.open(`tel:${contractor.phone}`)}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                      )}
                      {contractor.email && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => window.open(`mailto:${contractor.email}`)}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Button>
                      )}
                      {contractor.website && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => window.open(contractor.website!, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Website
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
