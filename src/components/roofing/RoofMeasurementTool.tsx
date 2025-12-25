import { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Pencil, Trash2, Calculator, Zap, Map, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

interface RoofMeasurements {
  flatArea: number;
  pitchedArea: number;
  totalSquares: number;
  address: string;
  pitchMultiplier: number;
  wasteFactor: number;
}

interface RoofMeasurementToolProps {
  onMeasurementComplete: (measurements: RoofMeasurements) => void;
}

interface AIEstimation {
  estimatedSqftLow: number;
  estimatedSqftHigh: number;
  confidence: 'high' | 'medium' | 'low';
  methodology: string;
}

const PITCH_MULTIPLIERS: { [key: string]: number } = {
  "3/12": 1.031,
  "4/12": 1.054,
  "5/12": 1.083,
  "6/12": 1.118,
  "7/12": 1.158,
  "8/12": 1.202,
  "9/12": 1.250,
  "10/12": 1.302,
  "11/12": 1.357,
  "12/12": 1.414,
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

export function RoofMeasurementTool({ onMeasurementComplete }: RoofMeasurementToolProps) {
  // Use callback ref to detect when container is ready
  const [mapContainerNode, setMapContainerNode] = useState<HTMLDivElement | null>(null);
  const mapContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setMapContainerNode(node);
    }
  }, []);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const { toast } = useToast();
  
  // Common state
  const [activeTab, setActiveTab] = useState("quick");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [pitch, setPitch] = useState("6/12");
  const [wasteFactor, setWasteFactor] = useState(10);
  
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
  const [isDrawing, setIsDrawing] = useState(false);
  const [flatArea, setFlatArea] = useState(0);
  const [pitchedArea, setPitchedArea] = useState(0);
  const [totalSquares, setTotalSquares] = useState(0);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Initialize map only when Draw on Map tab is active AND container is ready
  useEffect(() => {
    if (activeTab !== "draw" || !mapContainerNode || map.current) return;

    mapboxgl.accessToken = "pk.eyJ1IjoiamphbmFjZWsyMSIsImEiOiJjbWdmNHg1YXowNHh1MmlxMmdubjdjdzUzIn0.JKeexzDNUQk8_5cItGJQ2g";
    
    map.current = new mapboxgl.Map({
      container: mapContainerNode,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [-98.5795, 39.8283],
      zoom: 4,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      defaultMode: "simple_select",
    });

    map.current.addControl(draw.current as any);

    map.current.on("draw.create", updateMeasurements);
    map.current.on("draw.update", updateMeasurements);
    map.current.on("draw.delete", updateMeasurements);
    
    map.current.on("load", () => {
      setMapInitialized(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
      draw.current = null;
      setMapContainerNode(null);
      setMapInitialized(false);
    };
  }, [activeTab, mapContainerNode]);

  // Search for addresses
  useEffect(() => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?access_token=pk.eyJ1IjoiamphbmFjZWsyMSIsImEiOiJjbWdmNHg1YXowNHh1MmlxMmdubjdjdzUzIn0.JKeexzDNUQk8_5cItGJQ2g&limit=5&types=address`
        );
        const data = await response.json();
        setResults(data.features || []);
        setShowResults(true);
      } catch (error) {
        console.error("Error searching address:", error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelectResult = (result: any) => {
    setQuery(result.place_name);
    setSelectedAddress(result.place_name);
    setShowResults(false);
    setResults([]);
    
    if (map.current && activeTab === "draw") {
      map.current.flyTo({
        center: result.center,
        zoom: 19,
        pitch: 0,
        bearing: 0,
        essential: true,
      });
    }
  };

  const updateMeasurements = () => {
    if (!draw.current) return;

    const data = draw.current.getAll();
    if (data.features.length === 0) {
      setFlatArea(0);
      setPitchedArea(0);
      setTotalSquares(0);
      return;
    }

    let totalArea = 0;
    data.features.forEach((feature) => {
      if (feature.geometry.type === "Polygon") {
        const polygon = turf.polygon(feature.geometry.coordinates);
        const areaMeters = turf.area(polygon);
        totalArea += areaMeters * 10.7639; // Convert sq meters to sq feet
      }
    });

    setFlatArea(totalArea);
    
    const pitchMult = PITCH_MULTIPLIERS[pitch];
    const pitched = totalArea * pitchMult;
    setPitchedArea(pitched);
    
    const withWaste = pitched * (1 + wasteFactor / 100);
    const squares = withWaste / 100;
    setTotalSquares(squares);
  };

  useEffect(() => {
    if (activeTab === "draw") {
      updateMeasurements();
    }
  }, [pitch, wasteFactor]);

  // Calculate squares for quick estimate
  const calculateQuickEstimateSquares = (sqft: number) => {
    const pitchMult = PITCH_MULTIPLIERS[pitch];
    const pitched = sqft * pitchMult;
    const withWaste = pitched * (1 + wasteFactor / 100);
    return withWaste / 100;
  };

  const handleStartDrawing = () => {
    if (draw.current) {
      draw.current.changeMode("draw_polygon");
      setIsDrawing(true);
    }
  };

  const handleClear = () => {
    if (draw.current) {
      draw.current.deleteAll();
      setFlatArea(0);
      setPitchedArea(0);
      setTotalSquares(0);
    }
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
    toast({
      title: "Estimate Accepted",
      description: `Using ${avgSqft.toLocaleString()} sq ft for your quote.`,
    });
  };

  const handleGenerateReport = () => {
    let finalSqft = 0;
    let finalAddress = selectedAddress;

    if (activeTab === "quick" && acceptedSqft) {
      finalSqft = acceptedSqft;
    } else if (activeTab === "draw" && flatArea > 0) {
      finalSqft = flatArea;
    }

    if (finalSqft === 0 || !finalAddress) {
      toast({
        title: "Missing Information",
        description: "Please complete the estimation or draw your roof first.",
        variant: "destructive",
      });
      return;
    }

    const pitchMult = PITCH_MULTIPLIERS[pitch];
    const pitched = finalSqft * pitchMult;
    const withWaste = pitched * (1 + wasteFactor / 100);
    const squares = withWaste / 100;

    onMeasurementComplete({
      flatArea: finalSqft,
      pitchedArea: pitched,
      totalSquares: squares,
      address: finalAddress,
      pitchMultiplier: pitchMult,
      wasteFactor,
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

  const canGenerateReport = 
    (activeTab === "quick" && acceptedSqft && selectedAddress) ||
    (activeTab === "draw" && totalSquares > 0 && selectedAddress);

  return (
    <div className="space-y-4">
      {/* Address Search - Common for both tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="address-search">Enter Your Property Address</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address-search"
                  type="text"
                  placeholder="123 Main St, City, State"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => results.length > 0 && setShowResults(true)}
                  className="pl-10"
                />
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

            {selectedAddress && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Selected: {selectedAddress}
              </div>
            )}
          </div>
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
                      <SelectItem value="simple">Simple (Hip or Gable)</SelectItem>
                      <SelectItem value="moderate">Moderate (Some Valleys)</SelectItem>
                      <SelectItem value="complex">Complex (Multiple Levels/Dormers)</SelectItem>
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
                        {aiEstimation.confidence === 'medium' && <AlertCircle className="h-4 w-4" />}
                        {aiEstimation.confidence === 'low' && <AlertCircle className="h-4 w-4" />}
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
                <div ref={mapContainerRef} className="w-full h-[500px] rounded-lg" />
                
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
                    disabled={flatArea === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>

                {/* Measurement Display */}
                {flatArea > 0 && (
                  <Card className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Flat Area</Label>
                          <div className="text-lg font-bold">{flatArea.toFixed(0)} sq ft</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Pitched Area</Label>
                          <div className="text-lg font-bold">{pitchedArea.toFixed(0)} sq ft</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">With {wasteFactor}% Waste</Label>
                          <div className="text-lg font-bold">{(pitchedArea * (1 + wasteFactor / 100)).toFixed(0)} sq ft</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Total Squares</Label>
                          <div className="text-lg font-bold text-primary">{totalSquares.toFixed(2)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Calculation Options */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pitch">Roof Pitch</Label>
              <Select value={pitch} onValueChange={setPitch}>
                <SelectTrigger id="pitch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(PITCH_MULTIPLIERS).map((p) => (
                    <SelectItem key={p} value={p}>
                      {p} (×{PITCH_MULTIPLIERS[p].toFixed(3)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="waste">Waste Factor (%)</Label>
              <Select value={String(wasteFactor)} onValueChange={(v) => setWasteFactor(Number(v))}>
                <SelectTrigger id="waste">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="15">15%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Report Button */}
      <Button
        onClick={handleGenerateReport}
        disabled={!canGenerateReport}
        size="lg"
        className="w-full"
      >
        <Calculator className="h-5 w-5 mr-2" />
        Get My Free Measurement Report
      </Button>
    </div>
  );
}
