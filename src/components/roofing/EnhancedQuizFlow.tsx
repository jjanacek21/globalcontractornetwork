import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Sparkles, ArrowRight, CheckCircle2, Ruler, Home, Navigation, Satellite, ZoomIn, Calculator, Move, Save, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EnhancedMaterialQuiz } from "./EnhancedMaterialQuiz";
import { PitchSelector } from "@/components/shared/PitchSelector";
import { ComplexitySelector } from "@/components/shared/ComplexitySelector";
import { 
  PitchBucket, 
  ComplexityLevel, 
  calculateMeasurement,
  getDefaultPitch,
  getDefaultComplexity,
  getPitchMultiplier,
  getWastePct
} from "@/lib/roofMeasurements";

// Helper to normalize addresses for cache lookup
const normalizeAddress = (addr: string): string => {
  return addr.toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9\s]/g, '').trim();
};

const MAPBOX_TOKEN = "pk.eyJ1IjoiamphbmFjZWsyMSIsImEiOiJjbWdmNHg1YXowNHh1MmlxMmdubjdjdzUzIn0.JKeexzDNUQk8_5cItGJQ2g";

interface EnhancedQuizFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  propertyType?: string | null;
}

interface MeasurementResult {
  roofSquares: number;
  baseSqft: number;
  trueSqft: number;
  pitchMultiplier: number;
  wastePct: number;
  confidence: string;
  roofComplexity?: string;
  roofShape?: string;
  satelliteImageUrl?: string;
}

type FlowStep = "address" | "analyzing" | "adjustments" | "measurements" | "quiz";

export function EnhancedQuizFlow({ open, onOpenChange, onComplete, propertyType }: EnhancedQuizFlowProps) {
  const [step, setStep] = useState<FlowStep>("address");
  const [measurements, setMeasurements] = useState<MeasurementResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Address search state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cityState, setCityState] = useState("");

  // Satellite preview
  const [zoomLevel, setZoomLevel] = useState(19);
  const [isLocating, setIsLocating] = useState(false);

  // Draggable marker state
  const [markerOffset, setMarkerOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const markerStartOffset = useRef({ x: 0, y: 0 });

  // AI analysis results (flat footprint)
  const [baseFlatSqft, setBaseFlatSqft] = useState<number>(0);
  const [aiConfidence, setAiConfidence] = useState<string>("high");
  const [satelliteImageUrl, setSatelliteImageUrl] = useState<string>("");

  // User-selected pitch and complexity
  const [pitchBucket, setPitchBucket] = useState<PitchBucket>(getDefaultPitch('reroof'));
  const [complexity, setComplexity] = useState<ComplexityLevel>(getDefaultComplexity('reroof'));

  // Debounced address search
  useEffect(() => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5&types=address&country=US`
        );
        const data = await response.json();
        setSearchResults(data.features || []);
        setShowResults(true);
      } catch (error) {
        console.error("Geocoding error:", error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelectResult = (result: any) => {
    setQuery(result.place_name);
    setSelectedAddress(result.place_name);
    setSelectedCoords({
      lat: result.center[1],
      lng: result.center[0]
    });
    // Extract city/state from context
    const context = result.context || [];
    const place = context.find((c: any) => c.id.startsWith("place"));
    const region = context.find((c: any) => c.id.startsWith("region"));
    if (place && region) {
      setCityState(`${place.text}, ${region.short_code?.replace("US-", "") || region.text}`);
    }
    setShowResults(false);
    setSearchResults([]);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setSelectedCoords({ lat: latitude, lng: longitude });

        try {
          // Reverse geocode to get address
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&types=address`
          );
          const data = await response.json();
          if (data.features?.[0]) {
            const result = data.features[0];
            setQuery(result.place_name);
            setSelectedAddress(result.place_name);
            // Extract city/state
            const context = result.context || [];
            const place = context.find((c: any) => c.id.startsWith("place"));
            const region = context.find((c: any) => c.id.startsWith("region"));
            if (place && region) {
              setCityState(`${place.text}, ${region.short_code?.replace("US-", "") || region.text}`);
            }
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
        }
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Could not get your location. Please enter an address manually.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Drag handlers for the marker
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    dragStartPos.current = { x: clientX, y: clientY };
    markerStartOffset.current = { ...markerOffset };
  }, [markerOffset]);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragStartPos.current.x;
    const deltaY = clientY - dragStartPos.current.y;
    
    // Constrain to container bounds (roughly half the container size)
    const container = containerRef.current;
    const maxOffset = Math.min(container.offsetWidth, container.offsetHeight) / 2 - 30;
    
    const newX = Math.max(-maxOffset, Math.min(maxOffset, markerStartOffset.current.x + deltaX));
    const newY = Math.max(-maxOffset, Math.min(maxOffset, markerStartOffset.current.y + deltaY));
    
    setMarkerOffset({ x: newX, y: newY });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Attach/detach global drag listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Calculate adjusted coordinates based on marker offset
  const getAdjustedCoords = useCallback(() => {
    if (!selectedCoords || !containerRef.current) return selectedCoords;
    
    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    
    // Meters per pixel at the given zoom level (Mapbox formula)
    const metersPerPixel = 156543.03392 * Math.cos(selectedCoords.lat * Math.PI / 180) / Math.pow(2, zoomLevel);
    
    // Convert pixel offset to coordinate offset
    // Note: The satellite image is 600px wide but displayed at container width, so we need to scale
    const scaleFactor = 600 / containerWidth;
    const lngOffset = (markerOffset.x * scaleFactor * metersPerPixel) / 111320;
    const latOffset = -(markerOffset.y * scaleFactor * metersPerPixel) / 110540;
    
    return {
      lat: selectedCoords.lat + latOffset,
      lng: selectedCoords.lng + lngOffset
    };
  }, [selectedCoords, markerOffset, zoomLevel]);

  const handleAnalyzeRoof = async () => {
    if (!selectedCoords || !selectedAddress) {
      toast.error("Please select an address first");
      return;
    }

    const adjustedCoords = getAdjustedCoords();
    if (!adjustedCoords) {
      toast.error("Could not calculate coordinates");
      return;
    }

    setStep("analyzing");
    setLoading(true);

    try {
      // Check for cached/user-adjusted measurements first
      const normalizedAddr = normalizeAddress(selectedAddress);
      const { data: cached } = await supabase
        .from('roof_analysis_cache')
        .select('*')
        .eq('normalized_address', normalizedAddr)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (cached) {
        // Prefer user-adjusted values if available
        const cachedSqft = cached.user_adjusted_sqft 
          ? Number(cached.user_adjusted_sqft) 
          : Number(cached.flat_sqft);
        
        setBaseFlatSqft(cachedSqft);
        setAiConfidence(cached.confidence || "high");
        setSatelliteImageUrl(cached.satellite_image_url || "");
        
        toast.success(cached.user_adjusted_sqft 
          ? "Using your saved measurements!" 
          : "Found cached measurement!");
        
        setStep("adjustments");
        setLoading(false);
        return;
      }

      // No cache found, analyze with AI
      const { data, error } = await supabase.functions.invoke('roof-vision-ai', {
        body: {
          latitude: adjustedCoords.lat,
          longitude: adjustedCoords.lng,
          address: selectedAddress,
          zoomLevel: zoomLevel,
          context: 'roofing'
        }
      });

      if (error) throw error;

      const estimation = data?.estimation;
      if (estimation?.estimatedSqft) {
        // Add 4% buffer (3-5% range) to account for AI vision errors from shadows, 
        // secondary structures, or hidden areas not clearly visible in satellite imagery
        const AI_VISION_BUFFER = 1.04; // 4% buffer
        const bufferedSqft = Math.round(estimation.estimatedSqft * AI_VISION_BUFFER);
        
        setBaseFlatSqft(bufferedSqft);
        setAiConfidence(estimation.confidence || "high");
        setSatelliteImageUrl(estimation.satelliteImageUrl || "");
        
        // Go to adjustments step where user selects pitch & complexity
        setStep("adjustments");
      } else {
        throw new Error("Could not analyze property");
      }
    } catch (error) {
      console.error("Measurement error:", error);
      toast.error("Could not analyze property. Please try again.");
      setStep("address");
    } finally {
      setLoading(false);
    }
  };

  // Calculate final measurements based on user selections
  const handleCalculateMeasurements = () => {
    if (!baseFlatSqft) return;

    const result = calculateMeasurement({
      baseSqFt: baseFlatSqft,
      serviceType: 'reroof',
      pitchBucket: pitchBucket,
      complexity: complexity
    });

    setMeasurements({
      roofSquares: result.squares,
      baseSqft: result.baseSqFt,
      trueSqft: result.totalWithWaste,
      pitchMultiplier: result.pitchMultiplier,
      wastePct: result.wastePct,
      confidence: aiConfidence,
      satelliteImageUrl: satelliteImageUrl
    });

    setStep("measurements");
  };

  const handleProceedToQuiz = () => {
    setStep("quiz");
  };

  const handleQuizComplete = () => {
    onComplete?.();
    onOpenChange(false);
    // Reset for next use
    resetState();
  };

  const resetState = () => {
    setStep("address");
    setQuery("");
    setSelectedAddress("");
    setSelectedCoords(null);
    setCityState("");
    setMeasurements(null);
    setSearchResults([]);
    setShowResults(false);
    setBaseFlatSqft(0);
    setAiConfidence("high");
    setMarkerOffset({ x: 0, y: 0 });
    setSatelliteImageUrl("");
    setPitchBucket(getDefaultPitch('reroof'));
    setComplexity(getDefaultComplexity('reroof'));
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  };

  // Live calculation preview for adjustments step
  const liveCalc = baseFlatSqft ? calculateMeasurement({
    baseSqFt: baseFlatSqft,
    serviceType: 'reroof',
    pitchBucket,
    complexity
  }) : null;

  // Render quiz directly when in quiz step
  if (step === "quiz" && measurements) {
    return (
      <EnhancedMaterialQuiz
        open={open}
        onOpenChange={handleClose}
        roofSquares={measurements.roofSquares}
        address={selectedAddress}
        cityState={cityState}
        measurementData={{
          baseSqft: measurements.baseSqft,
          pitchMultiplier: measurements.pitchMultiplier,
          trueSqft: measurements.trueSqft,
          wastePct: measurements.wastePct,
          totalWithWaste: measurements.trueSqft,
          roofSquares: measurements.roofSquares,
          roofComplexity: complexity
        }}
        onComplete={handleQuizComplete}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto !top-[5%] !translate-y-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Find Your Perfect Roofing Material
          </DialogTitle>
          {/* Property Type Badge */}
          {propertyType && (
            <Badge variant="outline" className="w-fit">
              {propertyType === 'commercial' ? <Building2 className="h-3 w-3 mr-1" /> : <Home className="h-3 w-3 mr-1" />}
              {propertyType === 'commercial' ? 'Commercial' : 'Residential'}
            </Badge>
          )}
          <DialogDescription>
            {step === "address" && "Enter your property address to get started"}
            {step === "analyzing" && "Analyzing your roof with AI satellite imagery..."}
            {step === "adjustments" && "Adjust your roof pitch and complexity"}
            {step === "measurements" && "Great! Here's your final measurements"}
          </DialogDescription>
        </DialogHeader>

        {step === "address" && (
          <div className="space-y-5">
            {/* Property Location Card */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-base font-medium">
                  <MapPin className="h-4 w-4 text-primary" />
                  Property Location
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="gap-2"
                >
                  {isLocating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                  {isLocating ? "Locating..." : "Use Current Location"}
                </Button>
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter property address..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                />

                {/* Autocomplete Dropdown */}
                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-start gap-3 border-b last:border-b-0"
                        onClick={() => handleSelectResult(result)}
                      >
                      <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm break-words whitespace-normal">{result.place_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Address Confirmation */}
              {selectedAddress && (
                <div className="flex items-start gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 p-2 rounded-md">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="break-words">{selectedAddress}</span>
                </div>
              )}
            </div>

            {/* Satellite Preview Section - only show after address selected */}
            {selectedCoords && (
              <div className="space-y-3">
                {/* Instruction Banner */}
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
                  <Move className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <p className="text-amber-700 dark:text-amber-300">
                    <span className="font-semibold">Drag the circle</span> to the center of your roof for the most accurate measurements
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm">
                    <ZoomIn className="h-4 w-4" />
                    Satellite Zoom
                  </Label>
                  <Select value={zoomLevel.toString()} onValueChange={(v) => setZoomLevel(parseInt(v))}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="18">Zoom 18 - Wide View</SelectItem>
                      <SelectItem value="19">Zoom 19 - Standard</SelectItem>
                      <SelectItem value="20">Zoom 20 - Close Up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div 
                  ref={containerRef}
                  className="relative rounded-lg overflow-hidden border max-h-[200px] select-none"
                >
                  {/* Satellite Image */}
                  <img
                    src={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${selectedCoords.lng},${selectedCoords.lat},${zoomLevel},0/600x300@2x?access_token=${MAPBOX_TOKEN}`}
                    alt="Satellite view of property"
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                  
                  {/* Draggable Marker */}
                  <div 
                    className={`absolute cursor-move touch-none transition-transform ${isDragging ? 'scale-110' : ''}`}
                    style={{
                      left: `calc(50% + ${markerOffset.x}px)`,
                      top: `calc(50% + ${markerOffset.y}px)`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                  >
                    <div className={`w-12 h-12 border-3 border-primary rounded-full shadow-lg bg-primary/20 flex items-center justify-center ${!isDragging ? 'animate-pulse' : ''}`}>
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                    </div>
                    {/* Drag hint text */}
                    {markerOffset.x === 0 && markerOffset.y === 0 && !isDragging && (
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/70 text-white text-[10px] px-2 py-0.5 rounded">
                        Drag me
                      </div>
                    )}
                  </div>

                  {/* Badge */}
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Satellite className="h-3 w-3" />
                    Satellite Preview (Zoom {zoomLevel})
                  </div>
                </div>
              </div>
            )}

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyzeRoof}
              className="w-full"
              size="lg"
              disabled={!selectedCoords || !selectedAddress}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze My Roof with AI
            </Button>
          </div>
        )}

        {step === "analyzing" && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <p className="font-medium">Analyzing satellite imagery...</p>
              <p className="text-sm text-muted-foreground">This may take a few seconds</p>
            </div>
          </div>
        )}

        {step === "adjustments" && baseFlatSqft > 0 && (
          <div className="space-y-5">
            {/* Satellite Image Preview */}
            {selectedCoords && (
              <div className="relative rounded-lg overflow-hidden border h-32">
                <img
                  src={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${selectedCoords.lng},${selectedCoords.lat},${zoomLevel},0/600x200@2x?access_token=${MAPBOX_TOKEN}`}
                  alt="Satellite view"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  AI Detected: {baseFlatSqft.toLocaleString()} sq ft flat footprint
                </div>
              </div>
            )}

            {/* Pitch Selector */}
            <PitchSelector
              value={pitchBucket}
              onChange={setPitchBucket}
              serviceType="reroof"
            />

            {/* Complexity Selector */}
            <ComplexitySelector
              value={complexity}
              onChange={setComplexity}
              serviceType="reroof"
            />

            {/* Live Calculation Preview */}
            {liveCalc && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Roof Calculation</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Area Off</span>
                    <span className="text-lg font-semibold">{liveCalc.trueSqft.toLocaleString()} sq ft</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Area On</span>
                    <span className="text-lg font-semibold">{liveCalc.totalWithWaste.toLocaleString()} sq ft</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t text-center">
                  <p className="text-2xl font-bold text-primary">{liveCalc.squares.toFixed(1)} Squares</p>
                </div>
              </div>
            )}

            {/* Calculate Button */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("address")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleCalculateMeasurements} className="flex-1" size="lg">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate My Roof
              </Button>
            </div>
          </div>
        )}

        {step === "measurements" && measurements && (
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Home className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedAddress}</p>
                  {cityState && <p className="text-sm text-muted-foreground">{cityState}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-lg p-3 text-center">
                  <Ruler className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold text-primary">{measurements.roofSquares.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Roof Squares</p>
                </div>
                <div className="bg-background rounded-lg p-3 text-center">
                  <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold text-primary capitalize">{measurements.confidence}</p>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                </div>
              </div>

              {/* Simplified Breakdown */}
              <div className="mt-4 pt-4 border-t text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Area Off:</span>
                  <span className="font-medium">{Math.round(measurements.baseSqft * measurements.pitchMultiplier).toLocaleString()} sq ft</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">Area On:</span>
                  <span className="font-medium">{measurements.trueSqft.toLocaleString()} sq ft</span>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Based on satellite analysis + your selections</p>
              <p>Final measurements will be verified during inspection</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("adjustments")} className="flex-1">
                Adjust Settings
              </Button>
              <Button onClick={handleProceedToQuiz} className="flex-1" size="lg">
                <Sparkles className="mr-2 h-4 w-4" />
                Continue to Quiz
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
