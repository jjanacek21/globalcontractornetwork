import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDesc } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, CheckCircle2, ArrowRight, ArrowLeft, Home, Ruler, DollarSign, Edit2, Eye, Video, Users, Calendar, Palette, AlertTriangle, Clock, Navigation, Satellite, Map, Pencil, Trash2, Zap, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RoofingPackage } from "./PackageBrowser";
import { SchedulingDialog } from "./SchedulingDialog";
import { RoofPhotoUpload } from "./RoofPhotoUpload";
import { RoofAnalysisNote } from "@/components/shared/RoofAnalysisNote";
import { Roof3DVisualization } from "@/components/shared/Roof3DVisualization";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

const MAPBOX_TOKEN = "pk.eyJ1IjoiamphbmFjZWsyMSIsImEiOiJjbWdmNHg1YXowNHh1MmlxMmdubjdjdzUzIn0.JKeexzDNUQk8_5cItGJQ2g";

interface InstantEstimateFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPackage: RoofingPackage | null;
  onRequestQuote: (pkg: RoofingPackage, estimate: EstimateResult) => void;
  onCompareOthers: () => void;
}

interface EstimateResult {
  address: string;
  totalSquares: number;
  confidence: string;
  estimateLow: number;
  estimateHigh: number;
  roofComplexity?: string;
  flatSqft?: number;
  adjustedSqft?: number;
  // Mixed roof detection
  hasMixedRoof?: boolean;
  shingleSection?: { sqft: number; color: string };
  flatSection?: { sqft: number; color: string };
  primaryRoofColor?: string;
  // Age estimation
  estimatedAgeYears?: number;
  ageConfidence?: string;
  degradationNotes?: string;
}

interface AddressSuggestion {
  place_name: string;
  center: [number, number];
}

type Step = "address" | "verify" | "draw" | "analyzing" | "results";

const parsePrice = (priceStr: string): { low: number; high: number } | null => {
  const cleaned = priceStr.replace(/[,$]/g, '').replace('/sq', '');
  const parts = cleaned.split('-').map(p => parseFloat(p.trim()));
  
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { low: parts[0], high: parts[1] };
  }
  if (parts.length === 1 && !isNaN(parts[0])) {
    return { low: parts[0], high: parts[0] };
  }
  return null;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Apply pitch factors based on roof complexity
const applyPitchFactor = (flatSqft: number, complexity: string): { adjustedSqft: number; factor: number } => {
  const trueSqft = flatSqft * 1.1;
  
  let complexityFactor = 1.0;
  switch (complexity) {
    case 'gable':
      complexityFactor = 1.10;
      break;
    case 'hip':
      complexityFactor = 1.15;
      break;
    case 'complex':
      complexityFactor = 1.17;
      break;
    case 'flat':
    default:
      complexityFactor = 1.0;
      break;
  }
  
  return {
    adjustedSqft: trueSqft * complexityFactor,
    factor: 1.1 * complexityFactor
  };
};

// Normalize address for cache lookup
const normalizeAddress = (addr: string): string => {
  return addr.toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9\s]/g, '').trim();
};

export function InstantEstimateFlow({ 
  open, 
  onOpenChange, 
  selectedPackage,
  onRequestQuote,
  onCompareOthers
}: InstantEstimateFlowProps) {
  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [progressMessage, setProgressMessage] = useState("");
  const [manualSquares, setManualSquares] = useState<number | null>(null);
  const [isEditingSquares, setIsEditingSquares] = useState(false);
  const [showScheduling, setShowScheduling] = useState(false);
  const [appointmentType, setAppointmentType] = useState<"zoom" | "in_person">("zoom");
  const debounceRef = useRef<NodeJS.Timeout>();
  const saveDebounceRef = useRef<NodeJS.Timeout>();
  
  // New states for unified UI
  const [zoomLevel, setZoomLevel] = useState(19);
  const [activeTab, setActiveTab] = useState<"ai" | "draw">("ai");
  const [isLocating, setIsLocating] = useState(false);
  
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
  const [drawSqft, setDrawSqft] = useState(0);

  const resetFlow = () => {
    setStep("address");
    setAddress("");
    setSuggestions([]);
    setShowSuggestions(false);
    setCoordinates(null);
    setEstimate(null);
    setProgressMessage("");
    setManualSquares(null);
    setIsEditingSquares(false);
    setActiveTab("ai");
    setDrawSqft(0);
    setZoomLevel(19);
    // Cleanup map
    if (map.current) {
      map.current.remove();
      map.current = null;
      draw.current = null;
      setMapContainerNode(null);
      setMapInitialized(false);
    }
  };

  // Initialize map only when Draw tab is active AND container is ready
  useEffect(() => {
    if (step !== "draw" || !mapContainerNode || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainerNode,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: coordinates ? [coordinates.lng, coordinates.lat] : [-80.1918, 25.7617],
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
    map.current.on("draw.delete", () => setDrawSqft(0));

    map.current.on("load", () => {
      setMapInitialized(true);
      if (coordinates) {
        map.current?.flyTo({
          center: [coordinates.lng, coordinates.lat],
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
  }, [step, mapContainerNode, coordinates]);

  const updateDrawnArea = () => {
    if (!draw.current) return;
    const data = draw.current.getAll();
    if (data.features.length === 0) {
      setDrawSqft(0);
      return;
    }
    const polygon = data.features[0];
    const area = turf.area(polygon);
    const sqftCalc = Math.round(area * 10.764);
    setDrawSqft(sqftCalc);
  };

  const handleStartDrawing = () => {
    if (draw.current) {
      draw.current.changeMode("draw_polygon");
      setIsDrawing(true);
    }
  };

  const handleClearDraw = () => {
    if (draw.current) {
      draw.current.deleteAll();
      setDrawSqft(0);
      setIsDrawing(false);
    }
  };

  const handleUseDrawnMeasurement = () => {
    if (drawSqft > 0 && selectedPackage) {
      // Apply pitch factor for drawn area
      const { adjustedSqft } = applyPitchFactor(drawSqft, 'gable');
      const totalSquares = adjustedSqft / 100;
      const price = parsePrice(selectedPackage.pricePerSquare);
      
      setEstimate({
        address,
        totalSquares,
        confidence: 'high',
        estimateLow: price ? Math.round(price.low * totalSquares) : 0,
        estimateHigh: price ? Math.round(price.high * totalSquares) : 0,
        roofComplexity: 'gable',
        flatSqft: drawSqft,
        adjustedSqft,
      });
      setStep("results");
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
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
            const addr = data.features[0];
            setAddress(addr.place_name);
            setCoordinates({ lat: latitude, lng: longitude });
            toast.success("Location found");
          }
        } catch (error) {
          toast.error("Could not get address for your location");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        toast.error("Could not get your location");
      }
    );
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetFlow();
    }
    onOpenChange(open);
  };

  // Save manual adjustments to cache (debounced)
  useEffect(() => {
    if (manualSquares === null || !address) return;
    
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    
    saveDebounceRef.current = setTimeout(async () => {
      const normalizedAddr = normalizeAddress(address);
      const { error } = await supabase
        .from('roof_analysis_cache')
        .update({
          user_adjusted_sqft: manualSquares * 100,
          user_adjusted_squares: manualSquares,
          updated_at: new Date().toISOString()
        })
        .eq('normalized_address', normalizedAddr);
      
      if (!error) {
        console.log('Saved adjusted measurement:', manualSquares);
      }
    }, 1000);
    
    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
  }, [manualSquares, address]);

  // Address autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (address.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=US&types=address&limit=5`
        );
        const data = await response.json();
        if (data.features) {
          setSuggestions(data.features.map((f: any) => ({
            place_name: f.place_name,
            center: f.center
          })));
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [address]);

  const selectAddress = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.place_name);
    setCoordinates({ lng: suggestion.center[0], lat: suggestion.center[1] });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const verifyAddress = async () => {
    if (!address.trim()) {
      toast.error("Please enter your property address");
      return;
    }

    if (!coordinates) {
      try {
        const geocodeResponse = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=US&types=address`
        );
        const geocodeData = await geocodeResponse.json();

        if (!geocodeData.features || geocodeData.features.length === 0) {
          toast.error("Could not find that address. Please try a more specific address.");
          return;
        }

        const [longitude, latitude] = geocodeData.features[0].center;
        setCoordinates({ lat: latitude, lng: longitude });
        setAddress(geocodeData.features[0].place_name);
      } catch (error) {
        toast.error("Error finding address. Please try again.");
        return;
      }
    }

    setStep("verify");
  };

  const analyzeRoof = async () => {
    if (!coordinates || !selectedPackage) return;

    setStep("analyzing");
    setAnalyzing(true);

    const messages = [
      "Checking for cached measurements...",
      "Fetching satellite imagery...",
      "Detecting roof boundaries...",
      "Analyzing roof color and type...",
      "Estimating roof age...",
      "Calculating roof area...",
      "Generating estimate..."
    ];

    let messageIndex = 0;
    const interval = setInterval(() => {
      if (messageIndex < messages.length) {
        setProgressMessage(messages[messageIndex]);
        messageIndex++;
      }
    }, 700);

    try {
      const normalizedAddr = normalizeAddress(address);

      // Check cache first
      const { data: cached } = await supabase
        .from('roof_analysis_cache')
        .select('*')
        .eq('normalized_address', normalizedAddr)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      let flatSqft: number;
      let roofComplexity: string;
      let confidence: string;
      let hasMixedRoof = false;
      let shingleSection: { sqft: number; color: string } | undefined;
      let flatSection: { sqft: number; color: string } | undefined;
      let primaryRoofColor: string | undefined;
      let estimatedAgeYears: number | undefined;
      let ageConfidence: string | undefined;
      let degradationNotes: string | undefined;

      if (cached) {
        console.log("Using cached roof analysis:", cached);
        // Check if user previously adjusted
        if (cached.user_adjusted_squares) {
          setManualSquares(Number(cached.user_adjusted_squares));
        }
        flatSqft = Number(cached.flat_sqft);
        roofComplexity = cached.roof_complexity || 'gable';
        confidence = cached.confidence || 'medium';
        hasMixedRoof = cached.has_mixed_roof || false;
        if (cached.shingle_section_sqft) {
          shingleSection = { sqft: Number(cached.shingle_section_sqft), color: cached.shingle_section_color || 'unknown' };
        }
        if (cached.flat_section_sqft) {
          flatSection = { sqft: Number(cached.flat_section_sqft), color: cached.flat_section_color || 'unknown' };
        }
        estimatedAgeYears = cached.estimated_roof_age_years || undefined;
        ageConfidence = cached.roof_age_confidence || undefined;
        degradationNotes = cached.degradation_notes || undefined;
        setProgressMessage("Found cached measurement!");
      } else {
        // Call the AI vision function
        const { data, error } = await supabase.functions.invoke('roof-vision-ai', {
          body: { 
            latitude: coordinates.lat, 
            longitude: coordinates.lng, 
            address 
          }
        });

        if (error) throw error;

        const estimation = data.estimation;
        flatSqft = estimation.estimatedSqft;
        roofComplexity = estimation.roofComplexity || 'gable';
        confidence = estimation.confidence || 'medium';
        hasMixedRoof = estimation.hasMixedRoof || false;
        shingleSection = estimation.shingleSection || undefined;
        flatSection = estimation.flatSection || undefined;
        primaryRoofColor = estimation.primaryRoofColor || undefined;
        estimatedAgeYears = estimation.estimatedAgeYears || undefined;
        ageConfidence = estimation.ageConfidence || undefined;
        degradationNotes = estimation.degradationNotes || undefined;

        // Cache the result with new fields
        const { adjustedSqft, factor } = applyPitchFactor(flatSqft, roofComplexity);
        await supabase.from('roof_analysis_cache').insert({
          address,
          normalized_address: normalizedAddr,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          flat_sqft: flatSqft,
          adjusted_sqft: adjustedSqft,
          total_squares: adjustedSqft / 100,
          roof_complexity: roofComplexity,
          roof_shape: estimation.roofShape,
          confidence,
          methodology: estimation.methodology,
          satellite_image_url: estimation.satelliteImageUrl,
          pitch_factor: 1.1,
          complexity_factor: factor / 1.1,
          // New fields
          has_mixed_roof: hasMixedRoof,
          shingle_section_sqft: shingleSection?.sqft || null,
          shingle_section_color: shingleSection?.color || null,
          flat_section_sqft: flatSection?.sqft || null,
          flat_section_color: flatSection?.color || null,
          estimated_roof_age_years: estimatedAgeYears || null,
          roof_age_confidence: ageConfidence || null,
          degradation_notes: degradationNotes || null
        });
      }

      clearInterval(interval);

      // Apply pitch factor calculation
      const { adjustedSqft } = applyPitchFactor(flatSqft, roofComplexity);
      const totalSquares = adjustedSqft / 100;
      
      // Calculate price based on package
      const price = parsePrice(selectedPackage.pricePerSquare);
      const estimateLow = price ? Math.round(price.low * totalSquares) : 0;
      const estimateHigh = price ? Math.round(price.high * totalSquares) : 0;

      setEstimate({
        address,
        totalSquares,
        confidence,
        estimateLow,
        estimateHigh,
        roofComplexity,
        flatSqft,
        adjustedSqft,
        hasMixedRoof,
        shingleSection,
        flatSection,
        primaryRoofColor,
        estimatedAgeYears,
        ageConfidence,
        degradationNotes
      });

      setStep("results");
    } catch (error: any) {
      clearInterval(interval);
      console.error("Analysis error:", error);
      toast.error(error.message || "Failed to analyze property. Please try again.");
      setStep("verify");
    } finally {
      setAnalyzing(false);
    }
  };

  // Recalculate estimate when manual squares change
  const getDisplaySquares = () => manualSquares ?? estimate?.totalSquares ?? 0;
  
  const getDisplayEstimates = () => {
    if (!selectedPackage || !estimate) return { low: 0, high: 0 };
    const squares = getDisplaySquares();
    const price = parsePrice(selectedPackage.pricePerSquare);
    return {
      low: price ? Math.round(price.low * squares) : 0,
      high: price ? Math.round(price.high * squares) : 0
    };
  };

  const getComplexityLabel = (complexity: string) => {
    switch (complexity) {
      case 'flat': return 'Flat Roof';
      case 'gable': return 'Gable (2-sided)';
      case 'hip': return 'Hip (4-sided)';
      case 'complex': return 'Complex';
      default: return complexity;
    }
  };

  const getComplexityFactor = (complexity: string) => {
    switch (complexity) {
      case 'gable': return '+10%';
      case 'hip': return '+15%';
      case 'complex': return '+17%';
      default: return '';
    }
  };

  const getAgeLabel = (years: number) => {
    if (years <= 5) return 'New';
    if (years <= 12) return 'Good';
    if (years <= 20) return 'Aging';
    return 'End of Life';
  };

  const getAgeColor = (years: number) => {
    if (years <= 5) return 'bg-green-100 text-green-700';
    if (years <= 12) return 'bg-blue-100 text-blue-700';
    if (years <= 20) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  if (!selectedPackage) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {step === "address" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Get Your Instant Estimate
              </DialogTitle>
              <DialogDescription>
                <span className="font-medium text-foreground">{selectedPackage.name}</span>
                <span className="mx-2">•</span>
                <span className="text-primary font-medium">{selectedPackage.pricePerSquare}/sq</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
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
              <div className="space-y-2 relative">
                <Input
                  id="address"
                  placeholder="Start typing your address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onKeyDown={(e) => e.key === "Enter" && verifyAddress()}
                  autoComplete="off"
                />
                
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b last:border-b-0 text-sm"
                        onClick={() => selectAddress(suggestion)}
                      >
                        <MapPin className="h-4 w-4 inline mr-2 text-muted-foreground" />
                        {suggestion.place_name}
                      </button>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Enter your full street address for accurate satellite roof analysis
                </p>
              </div>

              <Button 
                onClick={verifyAddress} 
                className="w-full" 
                size="lg"
                disabled={!address.trim()}
              >
                Find My Property
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {step === "verify" && coordinates && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Verify Your Property
              </DialogTitle>
              <DialogDescription>
                Confirm this is the correct location, then choose how to measure
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Zoom Level Selector */}
              <div className="flex items-center gap-4">
                <Label className="whitespace-nowrap text-sm">Satellite Zoom:</Label>
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

              {/* Satellite Preview with Crosshair */}
              <div className="relative rounded-lg overflow-hidden border">
                <img 
                  src={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${coordinates.lng},${coordinates.lat},${zoomLevel},0/600x400@2x?access_token=${MAPBOX_TOKEN}`}
                  alt="Satellite view of property"
                  className="w-full h-[250px] object-cover"
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

              <p className="text-center font-medium text-sm">{address}</p>

              {/* Roof Analysis Note */}
              <RoofAnalysisNote variant="compact" />

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStep("address");
                    setCoordinates(null);
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Wrong Property
                </Button>
                <Button 
                  onClick={analyzeRoof}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Analyze Full Roof
                </Button>
              </div>
              
              <Button 
                variant="secondary"
                onClick={() => setStep("draw")}
                className="w-full"
              >
                <Map className="mr-2 h-4 w-4" />
                Draw Specific Section on Map
              </Button>
            </div>
          </>
        )}

        {/* Draw on Map Step */}
        {step === "draw" && coordinates && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                Draw Your Roof Section
              </DialogTitle>
              <DialogDescription>
                Trace the outline of the roof area you want to measure
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="relative">
                <div ref={mapContainerRef} className="w-full h-[350px] rounded-lg" />
                
                {/* Drawing Controls */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <Button
                    onClick={handleStartDrawing}
                    disabled={!mapInitialized}
                    size="sm"
                    variant={isDrawing ? "default" : "secondary"}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    {isDrawing ? "Drawing..." : "Draw Roof"}
                  </Button>
                  <Button
                    onClick={handleClearDraw}
                    size="sm"
                    variant="destructive"
                    disabled={drawSqft === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>

                {/* Measurement Display */}
                {drawSqft > 0 && (
                  <Card className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <Label className="text-xs text-muted-foreground">Drawn Area</Label>
                          <div className="text-lg font-bold">{drawSqft.toLocaleString()} sq ft</div>
                        </div>
                        <div className="text-center">
                          <Label className="text-xs text-muted-foreground">With Pitch (+10%)</Label>
                          <div className="text-lg font-bold text-primary">{Math.round(drawSqft * 1.1).toLocaleString()} sq ft</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep("verify")}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  onClick={handleUseDrawnMeasurement}
                  disabled={drawSqft === 0}
                  className="flex-1"
                >
                  Use This Measurement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "analyzing" && (
          <div className="py-12 text-center space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <Home className="absolute inset-0 m-auto h-8 w-8 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Analyzing Your Roof</h3>
              <p className="text-muted-foreground animate-pulse">{progressMessage}</p>
            </div>
          </div>
        )}

        {step === "results" && estimate && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Your Instant Estimate
              </DialogTitle>
              <DialogDescription>
                Based on AI analysis of satellite imagery
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Confidence Badge */}
              <div className="flex justify-center">
                <Badge variant="outline" className="bg-background">
                  {estimate.confidence} Confidence
                </Badge>
              </div>

              {/* Roof Age & Color Info */}
              {(estimate.estimatedAgeYears || estimate.primaryRoofColor) && (
                <div className="grid grid-cols-2 gap-3">
                  {estimate.estimatedAgeYears && (
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Roof Age</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">~{estimate.estimatedAgeYears} years</span>
                          <Badge className={`text-xs ${getAgeColor(estimate.estimatedAgeYears)}`}>
                            {getAgeLabel(estimate.estimatedAgeYears)}
                          </Badge>
                        </div>
                        {estimate.ageConfidence && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {estimate.ageConfidence} confidence
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  {estimate.primaryRoofColor && (
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Palette className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Roof Color</span>
                        </div>
                        <span className="font-semibold capitalize">{estimate.primaryRoofColor}</span>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Mixed Roof Detection */}
              {estimate.hasMixedRoof && (estimate.shingleSection || estimate.flatSection) && (
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Home className="h-5 w-5 text-amber-600" />
                      <span className="font-medium text-amber-800">Mixed Roof Detected</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {estimate.shingleSection && (
                        <div>
                          <p className="text-muted-foreground text-xs">Shingle Section</p>
                          <p className="font-medium">{Math.round(estimate.shingleSection.sqft).toLocaleString()} sq ft</p>
                          <p className="text-xs text-amber-700 capitalize">{estimate.shingleSection.color}</p>
                        </div>
                      )}
                      {estimate.flatSection && (
                        <div>
                          <p className="text-muted-foreground text-xs">Flat Section</p>
                          <p className="font-medium">{Math.round(estimate.flatSection.sqft).toLocaleString()} sq ft</p>
                          <p className="text-xs text-amber-700 capitalize">{estimate.flatSection.color}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Degradation Notes */}
              {estimate.degradationNotes && estimate.estimatedAgeYears && estimate.estimatedAgeYears > 15 && (
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">Condition Notes</p>
                        <p className="text-xs text-orange-700">{estimate.degradationNotes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Measurement with manual adjustment */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Ruler className="h-5 w-5 text-primary" />
                      <span className="font-medium">Roof Squares</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingSquares(!isEditingSquares)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      {isEditingSquares ? "Done" : "Adjust"}
                    </Button>
                  </div>
                  
                  <p className="text-3xl font-bold text-center">
                    {getDisplaySquares().toFixed(1)}
                  </p>
                  
                  {isEditingSquares && (
                    <div className="mt-4 space-y-3">
                      <Slider
                        value={[getDisplaySquares()]}
                        onValueChange={(v) => setManualSquares(v[0])}
                        min={10}
                        max={100}
                        step={0.5}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>10 sq</span>
                        <span>100 sq</span>
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        AI detected: {estimate.totalSquares.toFixed(1)} squares
                      </p>
                    </div>
                  )}
                  
                  {manualSquares && (
                    <Button
                      variant="link"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setManualSquares(null)}
                    >
                      Reset to AI measurement
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Price Estimate */}
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(getDisplayEstimates().low)} - {formatCurrency(getDisplayEstimates().high)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Estimated Total</p>
                </CardContent>
              </Card>

              {/* 3D Roof Visualization */}
              {estimate.roofComplexity && (
                <Roof3DVisualization
                  totalSqft={Math.round(getDisplaySquares() * 100)}
                  roofComplexity={estimate.roofComplexity as any}
                />
              )}

              {/* Photo Upload */}
              <RoofPhotoUpload
                address={address}
                normalizedAddress={normalizeAddress(address)}
                onAnalysisComplete={(analysis) => {
                  // Update estimate with photo analysis data
                  if (estimate) {
                    setEstimate({
                      ...estimate,
                      primaryRoofColor: analysis.detectedColor,
                      estimatedAgeYears: analysis.estimatedAgeYears,
                      ageConfidence: analysis.ageConfidence,
                      degradationNotes: analysis.analysisNotes
                    });
                  }
                }}
              />


              {/* Actions - Schedule Consultation */}
              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  onClick={() => {
                    setAppointmentType("zoom");
                    setShowScheduling(true);
                  }}
                  size="lg"
                  className="w-full"
                >
                  <Video className="mr-2 h-4 w-4" />
                  Schedule Zoom Call
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    setAppointmentType("in_person");
                    setShowScheduling(true);
                  }}
                  size="lg"
                  className="w-full"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Schedule In-Person Meeting
                </Button>
                
                <Button 
                  variant="ghost"
                  onClick={() => {
                    handleClose(false);
                    onCompareOthers();
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Compare Other Packages
                </Button>
              </div>
            </div>

            {/* Scheduling Dialog */}
            <SchedulingDialog
              open={showScheduling}
              onOpenChange={setShowScheduling}
              appointmentType={appointmentType}
              consultationData={{
                roofType: estimate?.roofComplexity || "unknown",
                priority: "contact",
                timeline: "asap",
                budget: selectedPackage.pricePerSquare,
                zipCode: address,
                sqft: Math.round(getDisplaySquares() * 100),
                recommendedPackage: selectedPackage.name,
                estimatedPrice: Math.round((getDisplayEstimates().low + getDisplayEstimates().high) / 2)
              }}
              onComplete={() => {
                handleClose(false);
              }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
