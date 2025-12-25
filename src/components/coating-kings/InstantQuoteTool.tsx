import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, MapPin, Pencil, Trash2, Navigation, Sparkles, Zap, Map, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { SpinWheel } from "./SpinWheel";
import { DiscountClaimForm } from "./DiscountClaimForm";
import { ThankYouScreen } from "./ThankYouScreen";

const MAPBOX_TOKEN = "pk.eyJ1IjoiamphbmFjZWsyMSIsImEiOiJjbWdmNHg1YXowNHh1MmlxMmdubjdjdzUzIn0.JKeexzDNUQk8_5cItGJQ2g";

const COATING_PRICES = {
  acrylic: { low: 2.0, high: 3.0, name: "Acrylic" },
  "acrylic-base": { low: 3.25, high: 4.0, name: "Acrylic + Base" },
  elastomeric: { low: 3.0, high: 4.0, name: "Elastomeric" },
  silicone: { low: 3.75, high: 4.5, name: "Silicone" },
  "silicone-base": { low: 4.5, high: 7.0, name: "Silicone + Base" },
  polyurethane: { low: 4.5, high: 7.0, name: "Polyurethane" },
  rubber: { low: 6.0, high: 8.0, name: "Rubber" },
};

const PROPERTY_TYPES = [
  { value: 'single-family', label: 'Single Family Home' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'commercial', label: 'Commercial Building' },
];

const LIVING_AREA_RANGES = [
  { value: '1000', label: 'Under 1,000 sq ft', min: 800, max: 1000 },
  { value: '1500', label: '1,000 - 1,500 sq ft', min: 1000, max: 1500 },
  { value: '2000', label: '1,500 - 2,000 sq ft', min: 1500, max: 2000 },
  { value: '2500', label: '2,000 - 2,500 sq ft', min: 2000, max: 2500 },
  { value: '3000', label: '2,500 - 3,000 sq ft', min: 2500, max: 3000 },
  { value: '3500', label: '3,000 - 3,500 sq ft', min: 3000, max: 3500 },
  { value: '4000', label: '3,500 - 4,000 sq ft', min: 3500, max: 4000 },
  { value: '5000', label: '4,000+ sq ft', min: 4000, max: 5000 },
];

interface InstantQuoteToolProps {
  selectedCoatingType?: string;
}

interface AIEstimation {
  estimatedSqftLow: number;
  estimatedSqftHigh: number;
  confidence: 'high' | 'medium' | 'low';
  methodology: string;
}

export const InstantQuoteTool = ({ selectedCoatingType }: InstantQuoteToolProps) => {
  const { toast } = useToast();
  
  // Common state
  const [activeTab, setActiveTab] = useState("quick");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [roofType, setRoofType] = useState<string>("");
  const [coatingType, setCoatingType] = useState<string>("");
  const [sqft, setSqft] = useState<number>(0);
  const [estimateLow, setEstimateLow] = useState<number>(0);
  const [estimateHigh, setEstimateHigh] = useState<number>(0);
  const [showEstimate, setShowEstimate] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  // SpinWheel and discount state
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [submittedLead, setSubmittedLead] = useState<any>(null);

  // Quick estimate state
  const [propertyType, setPropertyType] = useState("");
  const [stories, setStories] = useState("");
  const [livingAreaRange, setLivingAreaRange] = useState("");
  const [customLivingArea, setCustomLivingArea] = useState("");
  const [roofComplexity, setRoofComplexity] = useState("");
  const [isEstimating, setIsEstimating] = useState(false);
  const [aiEstimation, setAiEstimation] = useState<AIEstimation | null>(null);
  const [acceptedSqft, setAcceptedSqft] = useState<number | null>(null);

  // Map drawing state
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Update coating type when selectedCoatingType prop changes
  useEffect(() => {
    if (selectedCoatingType) {
      setCoatingType(selectedCoatingType);
    }
  }, [selectedCoatingType]);

  // Initialize map only when Draw on Map tab is active
  useEffect(() => {
    if (activeTab !== "draw" || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [-80.1918, 25.7617], // Miami
      zoom: 18,
    });

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      defaultMode: "simple_select",
    });

    map.current.addControl(draw.current as any);
    map.current.addControl(new mapboxgl.NavigationControl());

    map.current.on("draw.create", updateArea);
    map.current.on("draw.update", updateArea);
    map.current.on("draw.delete", () => {
      setSqft(0);
      setEstimateLow(0);
      setEstimateHigh(0);
      setShowEstimate(false);
    });

    map.current.on("load", () => {
      setMapInitialized(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
      draw.current = null;
      setMapInitialized(false);
    };
  }, [activeTab]);

  // Debounced address search
  useEffect(() => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?access_token=${MAPBOX_TOKEN}&country=US&limit=5&types=address`
        );
        const data = await response.json();
        setSearchResults(data.features || []);
        setShowSearchResults(true);
      } catch (error) {
        console.error("Search error:", error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const selectAddress = (feature: any) => {
    setQuery(feature.place_name);
    setSelectedAddress(feature.place_name);
    setShowSearchResults(false);
    setSearchResults([]);
    
    if (map.current && activeTab === "draw") {
      map.current.flyTo({
        center: feature.center,
        zoom: 19,
        pitch: 0,
        bearing: 0,
        essential: true,
      });
    }
  };

  const updateArea = () => {
    if (!draw.current) return;

    const data = draw.current.getAll();
    if (data.features.length === 0) {
      setSqft(0);
      setEstimateLow(0);
      setEstimateHigh(0);
      setShowEstimate(false);
      return;
    }

    const polygon = data.features[0];
    const area = turf.area(polygon);
    const sqftCalc = Math.round(area * 10.764);
    setSqft(sqftCalc);
    calculateEstimate(sqftCalc);
  };

  const calculateEstimate = (area: number) => {
    if (!area || !coatingType) {
      setEstimateLow(0);
      setEstimateHigh(0);
      setShowEstimate(false);
      return;
    }

    const pricing = COATING_PRICES[coatingType as keyof typeof COATING_PRICES];
    if (pricing) {
      setEstimateLow(Math.round(area * pricing.low));
      setEstimateHigh(Math.round(area * pricing.high));
      setShowEstimate(true);
    }
  };

  useEffect(() => {
    if (sqft && coatingType) {
      calculateEstimate(sqft);
    }
  }, [sqft, coatingType]);

  // Quick estimate also calculates pricing
  useEffect(() => {
    if (acceptedSqft && coatingType) {
      calculateEstimate(acceptedSqft);
      setSqft(acceptedSqft);
    }
  }, [acceptedSqft, coatingType]);

  const handleStartDrawing = () => {
    if (draw.current) {
      draw.current.changeMode("draw_polygon");
      setIsDrawing(true);
    }
  };

  const handleClear = () => {
    if (draw.current) {
      draw.current.deleteAll();
      setSqft(0);
      setEstimateLow(0);
      setEstimateHigh(0);
      setShowEstimate(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`
          );
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const address = data.features[0];
            setQuery(address.place_name);
            setSelectedAddress(address.place_name);
            
            if (map.current && activeTab === "draw") {
              map.current.flyTo({
                center: [longitude, latitude],
                zoom: 19,
                pitch: 0,
                bearing: 0,
                essential: true,
              });
            }

            toast({
              title: "Location found",
              description: "Map centered on your current location",
            });
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          toast({
            title: "Error",
            description: "Could not get address for your location",
            variant: "destructive",
          });
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        let message = "Could not get your location";
        
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission denied. Please enable location access.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location information unavailable";
        } else if (error.code === error.TIMEOUT) {
          message = "Location request timed out";
        }

        toast({
          title: "Location Error",
          description: message,
          variant: "destructive",
        });
      }
    );
  };

  const handleGetAIEstimate = async () => {
    const livingArea = customLivingArea 
      ? parseInt(customLivingArea) 
      : parseInt(livingAreaRange);
    
    if (!propertyType || !stories || !livingArea || !roofComplexity) {
      toast({
        title: "Missing Information",
        description: "Please fill in all property details to get an estimate.",
        variant: "destructive",
      });
      return;
    }

    setIsEstimating(true);
    setAiEstimation(null);

    try {
      const { data, error } = await supabase.functions.invoke('property-estimator-ai', {
        body: {
          propertyDetails: {
            propertyType,
            stories: parseInt(stories),
            livingArea,
            roofComplexity,
            state: 'Florida'
          }
        }
      });

      if (error) throw error;

      if (data?.estimation) {
        setAiEstimation(data.estimation);
      } else {
        throw new Error('No estimation received');
      }
    } catch (error) {
      console.error('Error getting AI estimate:', error);
      toast({
        title: "Estimation Error",
        description: "Could not get AI estimate. Please try again or use manual drawing.",
        variant: "destructive",
      });
    } finally {
      setIsEstimating(false);
    }
  };

  const handleAcceptEstimate = () => {
    if (!aiEstimation) return;
    const avgSqft = Math.round((aiEstimation.estimatedSqftLow + aiEstimation.estimatedSqftHigh) / 2);
    setAcceptedSqft(avgSqft);
    setSqft(avgSqft);
    toast({
      title: "Estimate Accepted",
      description: `Using ${avgSqft.toLocaleString()} sq ft for your quote.`,
    });
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <section id="quote-tool" className="py-20 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Get Your <span className="text-primary">Instant Quote</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Answer a few questions or draw your roof on the map to get an instant estimate
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Address Search Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Property Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="address">Property Address</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="h-7 text-xs"
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  {isLocating ? "Locating..." : "Use Current Location"}
                </Button>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="address"
                  placeholder="Enter property address..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                  className="pl-10"
                />
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
                        onClick={() => selectAddress(result)}
                      >
                        {result.place_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedAddress && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Selected: {selectedAddress}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Measurement Method Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quick" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Quick Estimate
              </TabsTrigger>
              <TabsTrigger value="draw" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Draw on Map
              </TabsTrigger>
            </TabsList>

            {/* Quick Estimate Tab */}
            <TabsContent value="quick" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    AI-Powered Quick Estimate
                  </CardTitle>
                  <CardDescription>
                    Answer a few questions and get an instant roof size estimate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Property Type</Label>
                      <Select value={propertyType} onValueChange={setPropertyType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROPERTY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Number of Stories</Label>
                      <Select value={stories} onValueChange={setStories}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Story</SelectItem>
                          <SelectItem value="2">2 Stories</SelectItem>
                          <SelectItem value="3">3+ Stories</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Living Area (sq ft)</Label>
                      <Select value={livingAreaRange} onValueChange={(v) => { setLivingAreaRange(v); setCustomLivingArea(""); }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          {LIVING_AREA_RANGES.map((range) => (
                            <SelectItem key={range.value} value={range.value}>
                              {range.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="mt-2">
                        <Input
                          type="number"
                          placeholder="Or enter exact sq ft"
                          value={customLivingArea}
                          onChange={(e) => { setCustomLivingArea(e.target.value); setLivingAreaRange(""); }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Roof Complexity</Label>
                      <Select value={roofComplexity} onValueChange={setRoofComplexity}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select complexity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple (Flat or Low Slope)</SelectItem>
                          <SelectItem value="moderate">Moderate (Some Angles)</SelectItem>
                          <SelectItem value="complex">Complex (Multiple Levels)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleGetAIEstimate}
                    disabled={isEstimating || !propertyType || !stories || (!livingAreaRange && !customLivingArea) || !roofComplexity}
                    className="w-full"
                    size="lg"
                  >
                    {isEstimating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5 mr-2" />
                        Get AI Estimate
                      </>
                    )}
                  </Button>

                  {/* AI Estimation Result */}
                  {aiEstimation && (
                    <Card className="border-primary/50 bg-primary/5">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Estimated Roof Size</p>
                            <p className="text-3xl font-bold text-primary">
                              {aiEstimation.estimatedSqftLow.toLocaleString()} - {aiEstimation.estimatedSqftHigh.toLocaleString()} sq ft
                            </p>
                          </div>
                          <div className={`flex items-center justify-center gap-2 ${getConfidenceColor(aiEstimation.confidence)}`}>
                            {aiEstimation.confidence === 'high' && <CheckCircle2 className="h-4 w-4" />}
                            {aiEstimation.confidence !== 'high' && <AlertCircle className="h-4 w-4" />}
                            <span className="text-sm font-medium capitalize">{aiEstimation.confidence} Confidence</span>
                          </div>
                          {aiEstimation.methodology && (
                            <p className="text-xs text-muted-foreground">{aiEstimation.methodology}</p>
                          )}

                          {acceptedSqft ? (
                            <div className="flex items-center justify-center gap-2 text-green-600">
                              <CheckCircle2 className="h-5 w-5" />
                              <span>Using {acceptedSqft.toLocaleString()} sq ft</span>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button onClick={handleAcceptEstimate} className="flex-1">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Looks Good!
                              </Button>
                              <Button variant="outline" onClick={() => setActiveTab("draw")} className="flex-1">
                                <Map className="h-4 w-4 mr-2" />
                                Need More Accuracy?
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Draw on Map Tab */}
            <TabsContent value="draw" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5 text-primary" />
                    Draw Your Roof
                  </CardTitle>
                  <CardDescription>
                    Draw the outline of your roof on the satellite map for precise measurements
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative">
                    <div ref={mapContainer} className="w-full h-[500px] rounded-lg" />
                    
                    {/* Drawing Controls */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Button
                        onClick={handleStartDrawing}
                        disabled={!selectedAddress || !mapInitialized}
                        size="sm"
                        variant={isDrawing ? "default" : "secondary"}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        {isDrawing ? "Drawing..." : "Draw Roof"}
                      </Button>
                      <Button
                        onClick={handleClear}
                        size="sm"
                        variant="destructive"
                        disabled={sqft === 0}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>

                    {/* Measurement Display */}
                    {sqft > 0 && (
                      <Card className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur">
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">Roof Area</Label>
                              <div className="text-lg font-bold">{sqft.toLocaleString()} sq ft</div>
                            </div>
                            {showEstimate && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Estimated Cost</Label>
                                <div className="text-lg font-bold text-primary">
                                  ${estimateLow.toLocaleString()} - ${estimateHigh.toLocaleString()}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Property Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Coating Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Roof Type</Label>
                  <Select value={roofType} onValueChange={setRoofType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select roof type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat Roof</SelectItem>
                      <SelectItem value="metal">Metal Roof</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Coating Type</Label>
                  <Select value={coatingType} onValueChange={setCoatingType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select coating type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COATING_PRICES).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.name} (${value.low} - ${value.high}/SF)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="sqft">Square Footage</Label>
                <Input
                  id="sqft"
                  type="number"
                  placeholder="Use AI estimate, draw on map, or enter manually"
                  value={sqft || ""}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setSqft(value);
                    calculateEstimate(value);
                  }}
                />
              </div>

              {/* Results */}
              {showEstimate && estimateLow > 0 && (
                <div className="pt-6 space-y-4 border-t">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Estimated Cost Range</p>
                    <div className="text-3xl font-bold text-primary">
                      ${estimateLow.toLocaleString()} - ${estimateHigh.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Based on {sqft.toLocaleString()} square feet
                    </p>
                  </div>
                  
                  {/* Spin to Win CTA */}
                  <Button
                    size="lg"
                    className="w-full text-lg py-6 bg-gradient-to-r from-primary via-yellow-500 to-primary animate-pulse"
                    onClick={() => setShowSpinWheel(true)}
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    🎰 TODAY ONLY! Spin to Win Up to 90% OFF!
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Spin Wheel Modal */}
      <SpinWheel
        open={showSpinWheel}
        onClose={() => setShowSpinWheel(false)}
        onResult={(percent) => {
          setDiscountPercent(percent);
          setShowSpinWheel(false);
          setShowClaimForm(true);
        }}
      />

      {/* Discount Claim Form Modal */}
      <DiscountClaimForm
        open={showClaimForm}
        onClose={() => setShowClaimForm(false)}
        onSuccess={(leadData) => {
          setSubmittedLead(leadData);
          setShowClaimForm(false);
          setShowThankYou(true);
        }}
        discountPercent={discountPercent}
        estimateLow={estimateLow}
        estimateHigh={estimateHigh}
        sqft={sqft}
        coatingType={coatingType}
        propertyAddress={selectedAddress}
      />

      {/* Thank You Screen Modal */}
      {submittedLead && (
        <ThankYouScreen
          open={showThankYou}
          onClose={() => setShowThankYou(false)}
          leadData={submittedLead}
        />
      )}
    </section>
  );
};
