import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  Building2, 
  Phone, 
  Globe, 
  Clock,
  FileText,
  AlertTriangle,
  ExternalLink,
  Download,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
  context?: Array<{ id: string; text: string }>;
}

interface BuildingDept {
  id: string;
  name: string;
  jurisdiction_type: string;
  county: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  portal_url: string | null;
  hours: string | null;
}

interface LocalCode {
  id: string;
  trade_type: string;
  requirement_title: string;
  requirement_description: string | null;
  is_mandatory: boolean;
  code_reference: string | null;
}

interface RequiredDocument {
  id: string;
  trade_type: string;
  document_name: string;
  document_url: string | null;
  is_required: boolean;
  notes: string | null;
}

const MAPBOX_TOKEN = "pk.eyJ1IjoiamphbmFjZWsyMSIsImEiOiJjbWdmNHg1NXowNHh1MmlxMmdubjdjdzUzIn0.JKeexzDNUQk8_5cItGJQ2g";

export function BuildingDeptLookup() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [buildingDept, setBuildingDept] = useState<BuildingDept | null>(null);
  const [localCodes, setLocalCodes] = useState<LocalCode[]>([]);
  const [requiredDocs, setRequiredDocs] = useState<RequiredDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<string>("roofing");
  const searchTimeout = useRef<NodeJS.Timeout>();

  const trades = [
    { value: "roofing", label: "Roofing" },
    { value: "hvac", label: "HVAC" },
    { value: "electrical", label: "Electrical" },
    { value: "plumbing", label: "Plumbing" },
    { value: "general", label: "General" },
    { value: "solar", label: "Solar" },
  ];

  // Florida Building Code requirements (statewide)
  const floridaBuildingCodes = [
    {
      title: "Florida Building Code 7th Edition (2023)",
      description: "All construction must comply with the current Florida Building Code requirements.",
      reference: "FBC 2023"
    },
    {
      title: "Wind Mitigation Requirements",
      description: "Roofing installations must meet Miami-Dade County wind resistance standards in High-Velocity Hurricane Zones (HVHZ).",
      reference: "FBC 1523.6"
    },
    {
      title: "Product Approval Required",
      description: "All roofing materials must be Florida Product Approved or Miami-Dade NOA approved for HVHZ.",
      reference: "FBC 1507"
    },
    {
      title: "Permit Required",
      description: "Building permits are required for all roofing work including repairs, re-roofs, and new construction.",
      reference: "FBC 105.1"
    },
    {
      title: "Licensed Contractor Requirement",
      description: "Work must be performed by a Florida licensed contractor registered with the local building department.",
      reference: "FL Statute 489"
    }
  ];

  useEffect(() => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?access_token=${MAPBOX_TOKEN}&limit=5&types=address&country=us&region=FL`
        );
        const data = await response.json();
        setResults(data.features || []);
        setShowResults(true);
      } catch (error) {
        console.error("Error searching address:", error);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  const extractCityCounty = (result: SearchResult) => {
    let city = null;
    let county = null;
    
    if (result.context) {
      for (const ctx of result.context) {
        if (ctx.id.startsWith("place.")) {
          city = ctx.text;
        }
        if (ctx.id.startsWith("district.") || ctx.id.includes("county")) {
          county = ctx.text.replace(" County", "");
        }
      }
    }
    
    return { city, county };
  };

  const handleSelectResult = async (result: SearchResult) => {
    setQuery(result.place_name);
    setShowResults(false);
    setResults([]);
    setSelectedAddress(result.place_name);
    
    const { city, county } = extractCityCounty(result);
    setSelectedCity(city);
    setSelectedCounty(county);
    
    setLoading(true);
    
    try {
      // Try to find building department by city first, then county
      let deptQuery = supabase
        .from("permit_building_departments")
        .select("*");
      
      if (city) {
        deptQuery = deptQuery.ilike("city", `%${city}%`);
      }
      
      const { data: deptData } = await deptQuery.limit(1);
      
      if (deptData && deptData.length > 0) {
        setBuildingDept(deptData[0]);
        
        // Fetch local codes
        const { data: codesData } = await supabase
          .from("permit_local_codes")
          .select("*")
          .eq("building_dept_id", deptData[0].id)
          .eq("trade_type", selectedTrade);
        
        setLocalCodes(codesData || []);
        
        // Fetch required documents
        const { data: docsData } = await supabase
          .from("permit_required_documents")
          .select("*")
          .eq("building_dept_id", deptData[0].id)
          .eq("trade_type", selectedTrade)
          .order("sort_order");
        
        setRequiredDocs(docsData || []);
      } else {
        // No specific building department found - show county level info
        setBuildingDept(null);
        setLocalCodes([]);
        setRequiredDocs([]);
      }
    } catch (error) {
      console.error("Error fetching building department:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTradeChange = async (trade: string) => {
    setSelectedTrade(trade);
    
    if (buildingDept) {
      setLoading(true);
      try {
        const { data: codesData } = await supabase
          .from("permit_local_codes")
          .select("*")
          .eq("building_dept_id", buildingDept.id)
          .eq("trade_type", trade);
        
        setLocalCodes(codesData || []);
        
        const { data: docsData } = await supabase
          .from("permit_required_documents")
          .select("*")
          .eq("building_dept_id", buildingDept.id)
          .eq("trade_type", trade)
          .order("sort_order");
        
        setRequiredDocs(docsData || []);
      } catch (error) {
        console.error("Error fetching trade data:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Input */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Enter your project address in Florida..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className="pl-12 h-14 text-lg bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-amber-500"
          />
          
          {showResults && results.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-700 text-sm text-slate-200 transition-colors flex items-center gap-3"
                >
                  <MapPin className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  {result.place_name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trade Type Selector */}
      {selectedAddress && (
        <div className="flex flex-wrap justify-center gap-2">
          {trades.map((trade) => (
            <Button
              key={trade.value}
              variant={selectedTrade === trade.value ? "default" : "outline"}
              onClick={() => handleTradeChange(trade.value)}
              className={selectedTrade === trade.value 
                ? "bg-amber-500 hover:bg-amber-600 text-white" 
                : "border-slate-600 text-slate-300 hover:border-amber-500 hover:text-amber-500"
              }
            >
              {trade.label}
            </Button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      )}

      {/* Results */}
      {selectedAddress && !loading && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Building Department Info */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Building2 className="h-5 w-5 text-amber-500" />
                Building Department
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {buildingDept ? (
                <>
                  <div>
                    <h3 className="font-semibold text-lg text-white">{buildingDept.name}</h3>
                    <Badge variant="outline" className="mt-1 border-amber-500/50 text-amber-500">
                      {buildingDept.jurisdiction_type === "city" ? "City" : "County"} Jurisdiction
                    </Badge>
                  </div>
                  
                  {buildingDept.address && (
                    <div className="flex items-start gap-2 text-slate-300">
                      <MapPin className="h-4 w-4 mt-0.5 text-slate-500" />
                      <span>{buildingDept.address}</span>
                    </div>
                  )}
                  
                  {buildingDept.phone && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <span>{buildingDept.phone}</span>
                    </div>
                  )}
                  
                  {buildingDept.hours && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span>{buildingDept.hours}</span>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    {buildingDept.website && (
                      <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:border-amber-500" asChild>
                        <a href={buildingDept.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4 mr-2" />
                          Website
                        </a>
                      </Button>
                    )}
                    {buildingDept.portal_url && (
                      <Button size="sm" className="bg-amber-500 hover:bg-amber-600" asChild>
                        <a href={buildingDept.portal_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Permit Portal
                        </a>
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <Building2 className="h-12 w-12 mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-400">
                    Building department information for <strong className="text-white">{selectedCity || selectedCounty}</strong> will be added soon.
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Contact us for permit assistance in this area.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Required Documents */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5 text-amber-500" />
                Required Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requiredDocs.length > 0 ? (
                <ul className="space-y-3">
                  {requiredDocs.map((doc) => (
                    <li key={doc.id} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                      <FileText className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{doc.document_name}</span>
                          {doc.is_required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                        </div>
                        {doc.notes && (
                          <p className="text-sm text-slate-400 mt-1">{doc.notes}</p>
                        )}
                      </div>
                      {doc.document_url && (
                        <Button size="sm" variant="ghost" className="text-amber-500 hover:text-amber-400" asChild>
                          <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-12 w-12 mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-400">
                    Document requirements for this jurisdiction will be added soon.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Florida Building Code Requirements */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Florida Building Code Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {floridaBuildingCodes.map((code, index) => (
                  <li key={index} className="p-3 bg-slate-900/50 rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-white">{code.title}</h4>
                      <Badge variant="outline" className="text-xs border-slate-600 text-slate-400 flex-shrink-0">
                        {code.reference}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{code.description}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Local Code Requirements */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Local Code Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {localCodes.length > 0 ? (
                <ul className="space-y-3">
                  {localCodes.map((code) => (
                    <li key={code.id} className="p-3 bg-slate-900/50 rounded-lg border-l-4 border-orange-500">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-white">{code.requirement_title}</h4>
                        {code.is_mandatory && (
                          <Badge variant="destructive" className="text-xs flex-shrink-0">Mandatory</Badge>
                        )}
                      </div>
                      {code.requirement_description && (
                        <p className="text-sm text-slate-400 mt-1">{code.requirement_description}</p>
                      )}
                      {code.code_reference && (
                        <p className="text-xs text-slate-500 mt-2">Ref: {code.code_reference}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6">
                  <AlertTriangle className="h-12 w-12 mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-400">
                    No special local requirements found for this area.
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Standard Florida Building Code applies.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* CTA after lookup */}
      {selectedAddress && !loading && (
        <div className="text-center pt-8">
          <Card className="inline-block bg-gradient-to-r from-amber-500/10 to-orange-600/10 border-amber-500/30 p-8">
            <h3 className="text-xl font-semibold text-white mb-2">
              Need Help With This Permit?
            </h3>
            <p className="text-slate-400 mb-4">
              Let Permit Pros handle the paperwork for you. Fast, accurate, hassle-free.
            </p>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
              Get Started Now
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
