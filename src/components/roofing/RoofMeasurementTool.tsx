import { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Pencil, Trash2, Calculator, Zap, Map, Loader2, CheckCircle2, AlertCircle, Satellite } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

const MAPBOX_TOKEN = "pk.eyJ1IjoiamphbmFjZWsyMSIsImEiOiJjbWdmNHg1YXowNHh1MmlxMmdubjdjdzUzIn0.JKeexzDNUQk8_5cItGJQ2g";

// Fixed multipliers
const FIXED_PITCH_MULTIPLIER = 1.1;
const FIXED_WASTE_MULTIPLIER = 1.13;

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
  onEstimateAccepted?: (sqft: number, address: string) => void;
}

interface VisionEstimation {
  estimatedSqft: number;
  estimatedSqftLow: number;
  estimatedSqftHigh: number;
  confidence: 'high' | 'medium' | 'low';
  methodology: string;
  roofShape: string;
  satelliteImageUrl: string;
}

export function RoofMeasurementTool({ onMeasurementComplete, onEstimateAccepted }: RoofMeasurementToolProps) {
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
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // AI Vision state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visionEstimation, setVisionEstimation] = useState<VisionEstimation | null>(null);
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

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
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
          )}.json?access_token=${MAPBOX_TOKEN}&limit=5&types=address`
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
    setSelectedCoords({ lat: result.center[1], lng: result.center[0] });
    setShowResults(false);
    setResults([]);
    // Reset previous analysis
    setVisionEstimation(null);
    setAcceptedSqft(null);
    
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
    
    // Use fixed multipliers: 1.1 for pitch, 1.13 for waste
    const pitched = totalArea * FIXED_PITCH_MULTIPLIER;
    setPitchedArea(pitched);
    
    const withWaste = pitched * FIXED_WASTE_MULTIPLIER;
    const squares = withWaste / 100;
    setTotalSquares(squares);
  };

  // Calculate squares for vision estimate using fixed multipliers
  const calculateVisionSquares = (sqft: number) => {
    const pitched = sqft * FIXED_PITCH_MULTIPLIER;
    const withWaste = pitched * FIXED_WASTE_MULTIPLIER;
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

  const handleAnalyzeRoof = async () => {
    if (!selectedCoords || !selectedAddress) {
      toast({
        title: "Address Required",
        description: "Please select an address first to analyze the roof.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setVisionEstimation(null);

    try {
      const { data, error } = await supabase.functions.invoke('roof-vision-ai', {
        body: {
          latitude: selectedCoords.lat,
          longitude: selectedCoords.lng,
          address: selectedAddress
        }
      });

      if (error) throw error;

      if (data?.estimation) {
        setVisionEstimation(data.estimation);
        toast({
          title: "Analysis Complete",
          description: `AI detected a ${data.estimation.roofShape} roof with ${data.estimation.confidence} confidence.`,
        });
      } else {
        throw new Error('No estimation received');
      }
    } catch (error) {
      console.error('Error analyzing roof:', error);
      toast({
        title: "Analysis Error",
        description: "Could not analyze satellite image. Please try again or use manual drawing.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAcceptEstimate = () => {
    if (!visionEstimation) return;
    setAcceptedSqft(visionEstimation.estimatedSqft);
    
    // Calculate total with fixed pitch (1.1) and waste (1.13) multipliers
    const totalSquares = calculateVisionSquares(visionEstimation.estimatedSqft);
    const totalSqft = Math.round(totalSquares * 100); // Convert squares to sqft
    
    toast({
      title: "Estimate Accepted",
      description: `Using ${totalSqft.toLocaleString()} sq ft (${totalSquares.toFixed(1)} squares) for your quote.`,
    });
    // Trigger callback to open quiz dialog with calculated total
    if (onEstimateAccepted && selectedAddress) {
      onEstimateAccepted(totalSqft, selectedAddress);
    }
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

    // Use fixed multipliers
    const pitched = finalSqft * FIXED_PITCH_MULTIPLIER;
    const withWaste = pitched * FIXED_WASTE_MULTIPLIER;
    const squares = withWaste / 100;

    onMeasurementComplete({
      flatArea: finalSqft,
      pitchedArea: pitched,
      totalSquares: squares,
      address: finalAddress,
      pitchMultiplier: FIXED_PITCH_MULTIPLIER,
      wasteFactor: 13, // 13% waste (1.13 multiplier)
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
            <Satellite className="h-4 w-4" />
            AI Satellite Analysis
          </TabsTrigger>
          <TabsTrigger value="draw" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Draw on Map
          </TabsTrigger>
        </TabsList>

        {/* AI Satellite Analysis Tab */}
        <TabsContent value="quick" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Satellite className="h-5 w-5 text-primary" />
                AI-Powered Roof Analysis
              </CardTitle>
              <CardDescription>
                Our AI analyzes satellite imagery to measure your roof automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Satellite Preview */}
              {selectedCoords && (
                <div className="relative rounded-lg overflow-hidden border">
                  <img
                    src={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${selectedCoords.lng},${selectedCoords.lat},19,0/600x400@2x?access_token=${MAPBOX_TOKEN}`}
                    alt="Satellite view of property"
                    className="w-full h-[300px] object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-background/90 backdrop-blur px-2 py-1 rounded text-xs font-medium">
                    🛰️ Satellite Preview
                  </div>
                  {/* Center crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 border-2 border-primary rounded-full opacity-70" />
                    <div className="absolute w-0.5 h-4 bg-primary opacity-70" />
                    <div className="absolute w-4 h-0.5 bg-primary opacity-70" />
                  </div>
                </div>
              )}

              {!selectedCoords && (
                <div className="flex flex-col items-center justify-center h-[200px] bg-muted/50 rounded-lg border-2 border-dashed">
                  <Satellite className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Enter an address above to see satellite imagery
                  </p>
                </div>
              )}

              <Button
                onClick={handleAnalyzeRoof}
                disabled={isAnalyzing || !selectedCoords}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing Satellite Image...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Analyze My Roof with AI
                  </>
                )}
              </Button>

              {/* AI Vision Result */}
              {visionEstimation && (
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="pt-6 space-y-4">
                    {/* Detected Footprint */}
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">AI-Detected Footprint (Flat Area)</p>
                      <p className="text-3xl font-bold text-primary">
                        {visionEstimation.estimatedSqft.toLocaleString()} sq ft
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Range: {visionEstimation.estimatedSqftLow.toLocaleString()} - {visionEstimation.estimatedSqftHigh.toLocaleString()} sq ft
                      </p>
                    </div>
                    
                    {/* Confidence & Roof Type */}
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                      <div className={`flex items-center gap-2 ${getConfidenceColor(visionEstimation.confidence)}`}>
                        {visionEstimation.confidence === 'high' && <CheckCircle2 className="h-4 w-4" />}
                        {visionEstimation.confidence !== 'high' && <AlertCircle className="h-4 w-4" />}
                        <span className="text-sm font-medium capitalize">{visionEstimation.confidence} Confidence</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Roof Type: <span className="font-medium capitalize">{visionEstimation.roofShape}</span>
                      </div>
                    </div>

                    {/* Fixed Multipliers Info */}
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                      <p className="text-sm font-medium text-center">Standard Calculation Applied</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground">Pitch Multiplier</p>
                          <p className="font-bold text-primary">×1.10</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Waste Factor</p>
                          <p className="font-bold text-primary">×1.13 (13%)</p>
                        </div>
                      </div>
                    </div>

                    {/* Real-Time Calculation Breakdown */}
                    <div className="border rounded-lg p-4 space-y-2 bg-background">
                      <p className="text-sm font-medium text-center mb-3">Calculation Breakdown</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Flat Area (AI Detected)</span>
                          <span className="font-medium">{visionEstimation.estimatedSqft.toLocaleString()} sq ft</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">× Pitch Multiplier (Standard)</span>
                          <span className="font-medium">×1.10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">= Pitched Area</span>
                          <span className="font-medium">{Math.round(visionEstimation.estimatedSqft * FIXED_PITCH_MULTIPLIER).toLocaleString()} sq ft</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">× Waste Factor (13%)</span>
                          <span className="font-medium">×1.13</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-muted-foreground">= Total Area</span>
                          <span className="font-medium">{Math.round(visionEstimation.estimatedSqft * FIXED_PITCH_MULTIPLIER * FIXED_WASTE_MULTIPLIER).toLocaleString()} sq ft</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t bg-primary/10 -mx-4 px-4 py-2 rounded-b">
                          <span className="font-semibold">TOTAL SQUARES</span>
                          <span className="text-xl font-bold text-primary">{calculateVisionSquares(visionEstimation.estimatedSqft).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {visionEstimation.methodology && (
                      <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded text-center">
                        {visionEstimation.methodology}
                      </p>
                    )}

                    {acceptedSqft ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Estimate accepted - {calculateVisionSquares(acceptedSqft).toFixed(2)} squares</span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={handleAcceptEstimate} className="flex-1">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Accept Estimate
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab("draw")} className="flex-1">
                          <Map className="h-4 w-4 mr-2" />
                          Draw Manually
                        </Button>
                      </div>
                    )}
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
                          <Label className="text-xs text-muted-foreground">Pitched Area (×1.10)</Label>
                          <div className="text-lg font-bold">{pitchedArea.toFixed(0)} sq ft</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">With 13% Waste</Label>
                          <div className="text-lg font-bold">{(pitchedArea * FIXED_WASTE_MULTIPLIER).toFixed(0)} sq ft</div>
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

      {/* Fixed Multipliers Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">Standard Pitch Multiplier</p>
              <p className="text-2xl font-bold text-primary">×1.10</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-muted-foreground">Standard Waste Factor</p>
              <p className="text-2xl font-bold text-primary">13%</p>
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
