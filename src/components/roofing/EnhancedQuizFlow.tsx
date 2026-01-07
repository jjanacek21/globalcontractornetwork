import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Sparkles, ArrowRight, CheckCircle2, Ruler, Home, Navigation, Satellite, ZoomIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EnhancedMaterialQuiz } from "./EnhancedMaterialQuiz";

const MAPBOX_TOKEN = "pk.eyJ1IjoiamphbmFjZWsyMSIsImEiOiJjbWdmNHg1YXowNHh1MmlxMmdubjdjdzUzIn0.JKeexzDNUQk8_5cItGJQ2g";

interface EnhancedQuizFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

interface MeasurementResult {
  roofSquares: number;
  baseSqft: number;
  trueSqft: number;
  pitchMultiplier: number;
  confidence: string;
}

type FlowStep = "address" | "analyzing" | "measurements" | "quiz";

export function EnhancedQuizFlow({ open, onOpenChange, onComplete }: EnhancedQuizFlowProps) {
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

  const handleAnalyzeRoof = async () => {
    if (!selectedCoords || !selectedAddress) {
      toast.error("Please select an address first");
      return;
    }

    setStep("analyzing");
    setLoading(true);

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

      if (data?.roofSquares) {
        setMeasurements({
          roofSquares: data.roofSquares,
          baseSqft: data.baseSqft || data.roofSquares * 100,
          trueSqft: data.trueSqft || data.roofSquares * 100,
          pitchMultiplier: data.pitchMultiplier || 1.0,
          confidence: data.confidence || "high"
        });
        setStep("measurements");
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
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  };

  // Render quiz directly when in quiz step
  if (step === "quiz" && measurements) {
    return (
      <EnhancedMaterialQuiz
        open={open}
        onOpenChange={handleClose}
        roofSquares={measurements.roofSquares}
        address={selectedAddress}
        cityState={cityState}
        onComplete={handleQuizComplete}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Find Your Perfect Roofing Material
          </DialogTitle>
          <DialogDescription>
            {step === "address" && "Enter your property address to get started"}
            {step === "analyzing" && "Analyzing your roof with AI satellite imagery..."}
            {step === "measurements" && "Great! Here's what we found"}
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
                        <span className="text-sm">{result.place_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Address Confirmation */}
              {selectedAddress && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 p-2 rounded-md">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{selectedAddress}</span>
                </div>
              )}
            </div>

            {/* Satellite Preview Section - only show after address selected */}
            {selectedCoords && (
              <div className="space-y-3">
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

                <div className="relative rounded-lg overflow-hidden border max-h-[200px]">
                  {/* Satellite Image */}
                  <img
                    src={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${selectedCoords.lng},${selectedCoords.lat},${zoomLevel},0/600x300@2x?access_token=${MAPBOX_TOKEN}`}
                    alt="Satellite view of property"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Center Crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
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
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Based on satellite analysis of your property</p>
              <p>Final measurements will be verified during inspection</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("address")} className="flex-1">
                Different Address
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
