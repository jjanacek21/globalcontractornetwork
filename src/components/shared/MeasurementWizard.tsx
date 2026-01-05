import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MapPin, Pencil, Trash2, Navigation, Zap, Map, Loader2, CheckCircle2, AlertCircle, Satellite } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { RoofAnalysisNote } from "@/components/shared/RoofAnalysisNote";
import { PitchSelector } from "./PitchSelector";
import { ComplexitySelector } from "./ComplexitySelector";
import {
  ServiceType,
  PitchBucket,
  ComplexityLevel,
  Confidence,
  MeasurementResult,
  calculateMeasurement,
  getDefaultPitch,
  getDefaultComplexity,
  getConfidenceColor,
} from "@/lib/roofMeasurements";

const MAPBOX_TOKEN = "pk.eyJ1IjoiamphbmFjZWsyMSIsImEiOiJjbWdmNHg1YXowNHh1MmlxMmdubjdjdzUzIn0.JKeexzDNUQk8_5cItGJQ2g";

interface MeasurementWizardProps {
  serviceType: ServiceType;
  onMeasurementComplete: (result: MeasurementResult) => void;
  className?: string;
}

interface VisionEstimation {
  estimatedSqft: number;
  confidence: Confidence;
  methodology: string;
  roofShape: string;
  roofComplexity: string;
}

export function MeasurementWizard({ serviceType, onMeasurementComplete, className }: MeasurementWizardProps) {
  const { toast } = useToast();
  
  // Address state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  // Zoom level for satellite imagery
  const [zoomLevel, setZoomLevel] = useState<number>(19);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"ai" | "draw">("ai");
  
  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visionEstimation, setVisionEstimation] = useState<VisionEstimation | null>(null);
  const [baseSqFt, setBaseSqFt] = useState<number>(0);
  const [confidence, setConfidence] = useState<Confidence>("medium");
  const [methodology, setMethodology] = useState<string>("");
  
  // User selections (with service-appropriate defaults)
  const [pitchBucket, setPitchBucket] = useState<PitchBucket>(getDefaultPitch(serviceType));
  const [complexity, setComplexity] = useState<ComplexityLevel>(getDefaultComplexity(serviceType));
  
  // Measurement result
  const [measurement, setMeasurement] = useState<ReturnType<typeof calculateMeasurement> | null>(null);
  
  // Map drawing state
  const [mapContainerNode, setMapContainerNode] = useState<HTMLDivElement | null>(null);
  const mapContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setMapContainerNode(node);
    }
  }, []);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Recalculate measurement when inputs change
  useEffect(() => {
    if (baseSqFt > 0) {
      const result = calculateMeasurement({
        baseSqFt,
        serviceType,
        pitchBucket,
        complexity,
      });
      setMeasurement(result);
    } else {
      setMeasurement(null);
    }
  }, [baseSqFt, pitchBucket, complexity, serviceType]);

  // Initialize map only when Draw tab is active AND container is ready
  useEffect(() => {
    if (activeTab !== "draw" || !mapContainerNode || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainerNode,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: selectedCoords ? [selectedCoords.lng, selectedCoords.lat] : [-80.1918, 25.7617],
      zoom: 19,
    });

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      defaultMode: "simple_select",
    });

    map.current.addControl(draw.current as any);
    map.current.addControl(new mapboxgl.NavigationControl());

    map.current.on("draw.create", updateDrawnArea);
    map.current.on("draw.update", updateDrawnArea);
    map.current.on("draw.delete", () => {
      setBaseSqFt(0);
      setConfidence("medium");
      setMethodology("Manual drawing cleared");
    });

    map.current.on("load", () => {
      setMapInitialized(true);
      if (selectedCoords) {
        map.current?.flyTo({
          center: [selectedCoords.lng, selectedCoords.lat],
          zoom: 19,
        });
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
      draw.current = null;
      setMapContainerNode(null);
      setMapInitialized(false);
    };
  }, [activeTab, mapContainerNode, selectedCoords]);

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
    setSelectedCoords({ lat: feature.center[1], lng: feature.center[0] });
    setShowSearchResults(false);
    setSearchResults([]);
    // Reset previous analysis
    setVisionEstimation(null);
    setBaseSqFt(0);
    setMeasurement(null);
    
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

  const updateDrawnArea = () => {
    if (!draw.current) return;

    const data = draw.current.getAll();
    if (data.features.length === 0) {
      setBaseSqFt(0);
      return;
    }

    const polygon = data.features[0];
    const area = turf.area(polygon);
    const sqftCalc = Math.round(area * 10.764);
    
    setBaseSqFt(sqftCalc);
    setConfidence("high");
    setMethodology("Manual drawing provides the most accurate measurement");
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
      setBaseSqFt(0);
      setIsDrawing(false);
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
            setSelectedCoords({ lat: latitude, lng: longitude });
            
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
        }

        toast({
          title: "Location Error",
          description: message,
          variant: "destructive",
        });
      }
    );
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
          context: serviceType
        }
      });

      if (error) throw error;

      if (data?.estimation) {
        const est = data.estimation;
        setVisionEstimation(est);
        setBaseSqFt(est.estimatedSqft);
        setConfidence(est.confidence || 'medium');
        setMethodology(est.methodology || 'AI satellite analysis');
        
        toast({
          title: "Analysis Complete",
          description: `AI detected approximately ${est.estimatedSqft.toLocaleString()} sq ft with ${est.confidence} confidence.`,
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

  const handleAcceptMeasurement = () => {
    if (!measurement || !selectedCoords || !selectedAddress) return;
    
    const result: MeasurementResult = {
      ...measurement,
      address: selectedAddress,
      coordinates: selectedCoords,
      confidence,
      methodology,
      pitchBucket,
      complexity,
    };
    
    onMeasurementComplete(result);
    
    toast({
      title: "Measurement Accepted",
      description: `Using ${measurement.totalWithWaste.toLocaleString()} sq ft (with waste) for your estimate.`,
    });
  };

  return (
    <div className={className}>
      <div className="space-y-6">
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
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ai" | "draw")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Satellite className="h-4 w-4" />
              AI Satellite Analysis
            </TabsTrigger>
            <TabsTrigger value="draw" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Draw on Map
            </TabsTrigger>
          </TabsList>

          {/* AI Satellite Analysis Tab */}
          <TabsContent value="ai" className="space-y-4">
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

                {/* Roof Analysis Note */}
                {selectedCoords && !visionEstimation && (
                  <RoofAnalysisNote />
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
                  <div ref={mapContainerRef} className="w-full h-[400px] rounded-lg" />
                  
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
                      disabled={baseSqFt === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Assumptions Section - Shown after analysis */}
        {baseSqFt > 0 && (
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Measurement Assumptions</CardTitle>
                <Badge variant="outline">
                  {serviceType === 'coating' ? 'Roof Coating' : 'Re-Roof'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pitch Selector */}
              <PitchSelector
                value={pitchBucket}
                onChange={setPitchBucket}
                serviceType={serviceType}
              />
              
              {/* Complexity Selector */}
              <ComplexitySelector
                value={complexity}
                onChange={setComplexity}
                serviceType={serviceType}
              />
            </CardContent>
          </Card>
        )}

        {/* Results Card */}
        {measurement && baseSqFt > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Low/Medium Confidence Warning */}
                {(confidence === 'low' || confidence === 'medium') && activeTab === 'ai' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">
                        {confidence === 'low' ? 'Low Confidence Estimate' : 'Moderate Confidence'}
                      </p>
                      <p className="text-yellow-700">
                        Shadows or trees may be affecting accuracy. Consider using "Draw Manually" for a more precise measurement.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* 3-Column Results Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">True Sq Ft</p>
                    <p className="text-lg font-bold">{measurement.trueSqft.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-3 bg-primary/10 rounded-lg">
                    <p className="text-xs text-muted-foreground">Total with Waste</p>
                    <p className="text-lg font-bold text-primary">{measurement.totalWithWaste.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-3 bg-primary/20 rounded-lg">
                    <p className="text-xs text-muted-foreground">Roof Squares</p>
                    <p className="text-xl font-bold text-primary">{measurement.squares.toFixed(1)}</p>
                  </div>
                </div>
                
                {/* Confidence indicator */}
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <div className={`flex items-center gap-2 ${getConfidenceColor(confidence)}`}>
                    {confidence === 'high' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium capitalize">{confidence} Confidence</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button onClick={handleAcceptMeasurement} className="flex-1" size="lg">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Looks Good!
                  </Button>
                  {activeTab === 'ai' && (
                    <Button 
                      variant={confidence === 'low' ? "default" : "outline"} 
                      onClick={() => setActiveTab("draw")} 
                      className="flex-1"
                      size="lg"
                    >
                      <Map className="h-4 w-4 mr-2" />
                      Draw Manually
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
