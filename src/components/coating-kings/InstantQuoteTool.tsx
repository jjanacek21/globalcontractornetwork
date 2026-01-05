import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, MapPin, Pencil, Trash2, Navigation, Sparkles, Zap, Map, Loader2, CheckCircle2, AlertCircle, Satellite } from "lucide-react";
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
import { RoofAnalysisNote } from "@/components/shared/RoofAnalysisNote";
import { Roof3DVisualization } from "@/components/shared/Roof3DVisualization";
import { getConfidenceColor as getConfidenceColorUtil } from "@/lib/roofMeasurements";

const MAPBOX_TOKEN = "pk.eyJ1IjoiamphbmFjZWsyMSIsImEiOiJjbWdmNHg1YXowNHh1MmlxMmdubjdjdzUzIn0.JKeexzDNUQk8_5cItGJQ2g";

// Flat roof waste factor (3-5% for flat/low-slope roofs)
const FLAT_ROOF_WASTE_FACTOR = 1.05;

const COATING_PRICES = {
  acrylic: { low: 2.0, high: 3.0, name: "Acrylic" },
  "acrylic-base": { low: 3.25, high: 4.0, name: "Acrylic + Base" },
  elastomeric: { low: 3.0, high: 4.0, name: "Elastomeric" },
  silicone: { low: 3.75, high: 4.5, name: "Silicone" },
  "silicone-base": { low: 4.5, high: 7.0, name: "Silicone + Base" },
  polyurethane: { low: 4.5, high: 7.0, name: "Polyurethane" },
  rubber: { low: 6.0, high: 8.0, name: "Rubber" },
};

interface InstantQuoteToolProps {
  selectedCoatingType?: string;
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

export const InstantQuoteTool = ({ selectedCoatingType }: InstantQuoteToolProps) => {
  const { toast } = useToast();
  
  // Common state
  const [activeTab, setActiveTab] = useState("quick");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [roofType, setRoofType] = useState<string>("");
  const [coatingType, setCoatingType] = useState<string>("");
  const [sqft, setSqft] = useState<number>(0);
  const [estimateLow, setEstimateLow] = useState<number>(0);
  const [estimateHigh, setEstimateHigh] = useState<number>(0);
  const [showEstimate, setShowEstimate] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  // Zoom level for satellite imagery
  const [zoomLevel, setZoomLevel] = useState<number>(19);
  
  // SpinWheel and discount state
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [submittedLead, setSubmittedLead] = useState<any>(null);

  // AI Vision state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visionEstimation, setVisionEstimation] = useState<VisionEstimation | null>(null);
  const [acceptedSqft, setAcceptedSqft] = useState<number | null>(null);

  // Calculated values for display
  const [trueSqft, setTrueSqft] = useState<number>(0);
  const [totalWithWaste, setTotalWithWaste] = useState<number>(0);

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

  // Update coating type when selectedCoatingType prop changes
  useEffect(() => {
    if (selectedCoatingType) {
      setCoatingType(selectedCoatingType);
    }
  }, [selectedCoatingType]);

  // Initialize map only when Draw on Map tab is active AND container is ready
  useEffect(() => {
    if (activeTab !== "draw" || !mapContainerNode || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainerNode,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [-80.1918, 25.7617],
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
      setTrueSqft(0);
      setTotalWithWaste(0);
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
      setMapContainerNode(null);
      setMapInitialized(false);
    };
  }, [activeTab, mapContainerNode]);

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
    setAcceptedSqft(null);
    setTrueSqft(0);
    setTotalWithWaste(0);
    
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
      setTrueSqft(0);
      setTotalWithWaste(0);
      setEstimateLow(0);
      setEstimateHigh(0);
      setShowEstimate(false);
      return;
    }

    const polygon = data.features[0];
    const area = turf.area(polygon);
    const sqftCalc = Math.round(area * 10.764);
    
    // For coating (flat roofs): True Sq Ft = flat area, Total with Waste = +5%
    const trueSqftCalc = sqftCalc;
    const totalWithWasteCalc = Math.round(sqftCalc * FLAT_ROOF_WASTE_FACTOR);
    
    setSqft(sqftCalc);
    setTrueSqft(trueSqftCalc);
    setTotalWithWaste(totalWithWasteCalc);
    calculateEstimate(totalWithWasteCalc);
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
    if (totalWithWaste && coatingType) {
      calculateEstimate(totalWithWaste);
    } else if (sqft && coatingType) {
      const total = Math.round(sqft * FLAT_ROOF_WASTE_FACTOR);
      setTotalWithWaste(total);
      calculateEstimate(total);
    }
  }, [sqft, totalWithWaste, coatingType]);

  // Vision estimate calculation
  useEffect(() => {
    if (acceptedSqft && coatingType) {
      const total = Math.round(acceptedSqft * FLAT_ROOF_WASTE_FACTOR);
      setTrueSqft(acceptedSqft);
      setTotalWithWaste(total);
      setSqft(acceptedSqft);
      calculateEstimate(total);
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
      setTrueSqft(0);
      setTotalWithWaste(0);
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
          context: 'coating'
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
    
    // For flat roofs: True Sq Ft = AI detected area, Total with Waste = +5%
    const trueSqftCalc = visionEstimation.estimatedSqft;
    const totalWithWasteCalc = Math.round(trueSqftCalc * FLAT_ROOF_WASTE_FACTOR);
    
    setAcceptedSqft(trueSqftCalc);
    setTrueSqft(trueSqftCalc);
    setTotalWithWaste(totalWithWasteCalc);
    setSqft(trueSqftCalc);
    
    toast({
      title: "Estimate Accepted",
      description: `Using ${totalWithWasteCalc.toLocaleString()} sq ft (with waste) for your quote.`,
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
    const trueSqftCalc = visionEstimation.estimatedSqft;
    const totalWithWasteCalc = Math.round(trueSqftCalc * FLAT_ROOF_WASTE_FACTOR);
    return { trueSqft: trueSqftCalc, totalWithWaste: totalWithWasteCalc };
  };

  const visionCalcs = getVisionCalculations();

  return (
    <section id="quote-tool" className="py-20 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Get Your <span className="text-primary">Instant Quote</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enter your address and our AI will analyze satellite imagery to measure your roof
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

                  {/* Roof Analysis Note - shown after address is selected */}
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

                  {/* AI Vision Result */}
                  {visionEstimation && visionCalcs && (
                    <Card className="border-primary/50 bg-primary/5">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          {/* Low/Medium Confidence Warning */}
                          {(visionEstimation.confidence === 'low' || visionEstimation.confidence === 'medium') && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2 text-left">
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
                          
                          <div className="flex items-center justify-center gap-4 flex-wrap">
                            <div className={`flex items-center gap-2 ${getConfidenceColor(visionEstimation.confidence)}`}>
                              {visionEstimation.confidence === 'high' && <CheckCircle2 className="h-4 w-4" />}
                              {visionEstimation.confidence !== 'high' && <AlertCircle className="h-4 w-4" />}
                              <span className="text-sm font-medium capitalize">{visionEstimation.confidence} Confidence</span>
                            </div>
                          </div>

                          {visionEstimation.methodology && (
                            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
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
                                Looks Good!
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

                          {/* 3D Visualization Toggle */}
                          {acceptedSqft && (
                            <Roof3DVisualization
                              totalSqft={totalWithWaste}
                              roofComplexity={visionEstimation.roofComplexity}
                              className="mt-4"
                            />
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
                            <div className="text-center">
                              <Label className="text-xs text-muted-foreground">True Sq Ft</Label>
                              <div className="text-lg font-bold">{trueSqft.toLocaleString()}</div>
                            </div>
                            <div className="text-center">
                              <Label className="text-xs text-muted-foreground">Total with Waste</Label>
                              <div className="text-lg font-bold text-primary">{totalWithWaste.toLocaleString()}</div>
                            </div>
                          </div>
                          {showEstimate && (
                            <div className="mt-3 pt-3 border-t text-center">
                              <Label className="text-xs text-muted-foreground">Estimated Cost</Label>
                              <div className="text-lg font-bold text-primary">
                                ${estimateLow.toLocaleString()} - ${estimateHigh.toLocaleString()}
                              </div>
                            </div>
                          )}
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
                  placeholder="Use AI analysis, draw on map, or enter manually"
                  value={sqft || ""}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setSqft(value);
                    setTrueSqft(value);
                    const total = Math.round(value * FLAT_ROOF_WASTE_FACTOR);
                    setTotalWithWaste(total);
                    calculateEstimate(total);
                  }}
                />
              </div>

              {/* Results */}
              {showEstimate && estimateLow > 0 && (
                <div className="pt-6 space-y-4 border-t">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">True Sq Ft</p>
                      <p className="text-xl font-bold">{trueSqft.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total with Waste</p>
                      <p className="text-xl font-bold text-primary">{totalWithWaste.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Estimated Cost Range</p>
                    <div className="text-3xl font-bold text-primary">
                      ${estimateLow.toLocaleString()} - ${estimateHigh.toLocaleString()}
                    </div>
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
        sqft={totalWithWaste}
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
