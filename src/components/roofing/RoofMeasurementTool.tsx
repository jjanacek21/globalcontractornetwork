import { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Pencil, Trash2, Calculator, Zap, Map, Loader2, CheckCircle2, AlertCircle, Satellite } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

const MAPBOX_TOKEN = "pk.eyJ1IjoiamphbmFjZWsyMSIsImEiOiJjbWdmNHg1YXowNHh1MmlxMmdubjdjdzUzIn0.JKeexzDNUQk8_5cItGJQ2g";

// Pitched roof calculation constants
const PITCH_FACTOR = 1.11;

// Waste factors based on roof complexity
const WASTE_FACTORS = {
  flat: 1.05,    // +5% waste
  gable: 1.10,   // +10% waste (2 sides with ridge)
  hip: 1.15,     // +15% waste (4 sides with hips/valleys)
  complex: 1.20  // +20% waste (complex with many facets)
};

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
  roofComplexity: 'flat' | 'gable' | 'hip' | 'complex';
  satelliteImageUrl: string;
}

export function RoofMeasurementTool({ onMeasurementComplete, onEstimateAccepted }: RoofMeasurementToolProps) {
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
  
  // Zoom level for satellite imagery
  const [zoomLevel, setZoomLevel] = useState<number>(19);
  
  // AI Vision state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visionEstimation, setVisionEstimation] = useState<VisionEstimation | null>(null);
  const [acceptedSqft, setAcceptedSqft] = useState<number | null>(null);
  
  // Calculated display values
  const [trueSqft, setTrueSqft] = useState<number>(0);
  const [totalWithWaste, setTotalWithWaste] = useState<number>(0);
  
  // Map drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [flatArea, setFlatArea] = useState(0);
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
    map.current.on("draw.delete", () => {
      setFlatArea(0);
      setTrueSqft(0);
      setTotalWithWaste(0);
    });
    
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
    setTrueSqft(0);
    setTotalWithWaste(0);
    
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
      setTrueSqft(0);
      setTotalWithWaste(0);
      return;
    }

    let totalArea = 0;
    data.features.forEach((feature) => {
      if (feature.geometry.type === "Polygon") {
        const polygon = turf.polygon(feature.geometry.coordinates);
        const areaMeters = turf.area(polygon);
        totalArea += areaMeters * 10.7639;
      }
    });

    setFlatArea(totalArea);
    
    // For drawn roofs: True Sq Ft = flat × 1.11, assume gable for manual drawing (+10%)
    const trueSqftCalc = Math.round(totalArea * PITCH_FACTOR);
    const totalWithWasteCalc = Math.round(trueSqftCalc * WASTE_FACTORS.gable);
    
    setTrueSqft(trueSqftCalc);
    setTotalWithWaste(totalWithWasteCalc);
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
      setTrueSqft(0);
      setTotalWithWaste(0);
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
          address: selectedAddress,
          zoomLevel: zoomLevel,
          context: 'roofing'
        }
      });

      if (error) throw error;

      if (data?.estimation) {
        setVisionEstimation(data.estimation);
        toast({
          title: "Analysis Complete",
          description: `AI detected approximately ${data.estimation.estimatedSqft.toLocaleString()} sq ft with ${data.estimation.confidence} confidence.`,
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
    
    // For pitched roofs: True Sq Ft = flat × 1.11
    const trueSqftCalc = Math.round(visionEstimation.estimatedSqft * PITCH_FACTOR);
    
    // Get waste factor based on roof complexity
    const roofComplexity = visionEstimation.roofComplexity || 'gable';
    const wasteFactor = WASTE_FACTORS[roofComplexity] || WASTE_FACTORS.gable;
    const totalWithWasteCalc = Math.round(trueSqftCalc * wasteFactor);
    
    setAcceptedSqft(visionEstimation.estimatedSqft);
    setTrueSqft(trueSqftCalc);
    setTotalWithWaste(totalWithWasteCalc);
    
    toast({
      title: "Estimate Accepted",
      description: `Using ${totalWithWasteCalc.toLocaleString()} sq ft (with waste) for your quote.`,
    });
    
    // Trigger callback
    if (onEstimateAccepted && selectedAddress) {
      onEstimateAccepted(totalWithWasteCalc, selectedAddress);
    }
  };

  const handleGenerateReport = () => {
    let finalFlatSqft = 0;
    let finalAddress = selectedAddress;
    let wasteFactor = WASTE_FACTORS.gable;

    if (activeTab === "quick" && acceptedSqft && visionEstimation) {
      finalFlatSqft = acceptedSqft;
      wasteFactor = WASTE_FACTORS[visionEstimation.roofComplexity] || WASTE_FACTORS.gable;
    } else if (activeTab === "draw" && flatArea > 0) {
      finalFlatSqft = flatArea;
      wasteFactor = WASTE_FACTORS.gable; // Assume gable for manual drawing
    }

    if (finalFlatSqft === 0 || !finalAddress) {
      toast({
        title: "Missing Information",
        description: "Please complete the estimation or draw your roof first.",
        variant: "destructive",
      });
      return;
    }

    const pitched = finalFlatSqft * PITCH_FACTOR;
    const withWaste = pitched * wasteFactor;
    const squares = withWaste / 100;

    onMeasurementComplete({
      flatArea: finalFlatSqft,
      pitchedArea: pitched,
      totalSquares: squares,
      address: finalAddress,
      pitchMultiplier: PITCH_FACTOR,
      wasteFactor: (wasteFactor - 1) * 100,
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

  // Calculate display values for vision estimation
  const getVisionCalculations = () => {
    if (!visionEstimation) return null;
    const trueSqftCalc = Math.round(visionEstimation.estimatedSqft * PITCH_FACTOR);
    const roofComplexity = visionEstimation.roofComplexity || 'gable';
    const wasteFactor = WASTE_FACTORS[roofComplexity] || WASTE_FACTORS.gable;
    const totalWithWasteCalc = Math.round(trueSqftCalc * wasteFactor);
    return { trueSqft: trueSqftCalc, totalWithWaste: totalWithWasteCalc };
  };

  const visionCalcs = getVisionCalculations();

  const canGenerateReport = 
    (activeTab === "quick" && acceptedSqft && selectedAddress) ||
    (activeTab === "draw" && flatArea > 0 && selectedAddress);

  return (
    <div className="space-y-4">
      {/* Address Search */}
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
              {/* Zoom Level Selector */}
              <div className="flex items-center gap-4">
                <Label className="whitespace-nowrap">Satellite Zoom:</Label>
                <Select value={zoomLevel.toString()} onValueChange={(v) => setZoomLevel(parseInt(v))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select zoom level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18">Zoom 18 - Wide View (heavy tree areas)</SelectItem>
                    <SelectItem value="19">Zoom 19 - Standard</SelectItem>
                    <SelectItem value="20">Zoom 20 - Close-up (detailed roofs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Satellite Preview */}
              {selectedCoords && (
                <div className="relative rounded-lg overflow-hidden border">
                  <img
                    src={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${selectedCoords.lng},${selectedCoords.lat},${zoomLevel},0/600x400@2x?access_token=${MAPBOX_TOKEN}`}
                    alt="Satellite view of property"
                    className="w-full h-[300px] object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-background/90 backdrop-blur px-2 py-1 rounded text-xs font-medium">
                    🛰️ Satellite Preview (Zoom {zoomLevel})
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
              {visionEstimation && visionCalcs && (
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="pt-6 space-y-4">
                    {/* Low/Medium Confidence Warning */}
                    {(visionEstimation.confidence === 'low' || visionEstimation.confidence === 'medium') && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-yellow-800">
                            {visionEstimation.confidence === 'low' ? 'Low Confidence Estimate' : 'Moderate Confidence'}
                          </p>
                          <p className="text-yellow-700">
                            Shadows or trees may be affecting accuracy. Consider using "Draw Manually" for a more precise measurement.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Display True Sq Ft and Total with Waste */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">True Sq Ft</p>
                        <p className="text-2xl font-bold">{visionCalcs.trueSqft.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total with Waste</p>
                        <p className="text-2xl font-bold text-primary">{visionCalcs.totalWithWaste.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {/* Confidence & Roof Complexity */}
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                      <div className={`flex items-center gap-2 ${getConfidenceColor(visionEstimation.confidence)}`}>
                        {visionEstimation.confidence === 'high' && <CheckCircle2 className="h-4 w-4" />}
                        {visionEstimation.confidence !== 'high' && <AlertCircle className="h-4 w-4" />}
                        <span className="text-sm font-medium capitalize">{visionEstimation.confidence} Confidence</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Roof Type: <span className="font-medium capitalize">{visionEstimation.roofComplexity || 'gable'}</span>
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
                        <span>Using {totalWithWaste.toLocaleString()} sq ft (with waste)</span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={handleAcceptEstimate} className="flex-1">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Accept Estimate
                        </Button>
                        <Button 
                          variant={visionEstimation.confidence === 'low' ? "default" : "outline"} 
                          onClick={() => setActiveTab("draw")} 
                          className="flex-1"
                        >
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <Label className="text-xs text-muted-foreground">True Sq Ft</Label>
                          <div className="text-lg font-bold">{trueSqft.toLocaleString()}</div>
                        </div>
                        <div className="text-center">
                          <Label className="text-xs text-muted-foreground">Total with Waste</Label>
                          <div className="text-lg font-bold text-primary">{totalWithWaste.toLocaleString()}</div>
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
