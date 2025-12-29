import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Loader2, MapPin, CheckCircle2, ArrowRight, ArrowLeft, Home, Ruler, DollarSign, Edit2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RoofingPackage } from "./PackageBrowser";

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
}

interface AddressSuggestion {
  place_name: string;
  center: [number, number];
}

type Step = "address" | "verify" | "analyzing" | "results";

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
  // Step 1: Apply 1.1x for true sqft from flat satellite image
  const trueSqft = flatSqft * 1.1;
  
  // Step 2: Apply complexity factor
  let complexityFactor = 1.0;
  switch (complexity) {
    case 'gable':
      complexityFactor = 1.10; // +10% for 2-sided roofs
      break;
    case 'hip':
      complexityFactor = 1.15; // +15% for 4-sided roofs
      break;
    case 'complex':
      complexityFactor = 1.17; // +17% for complex cut-up roofs
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
  const debounceRef = useRef<NodeJS.Timeout>();

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
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetFlow();
    }
    onOpenChange(open);
  };

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

    // If we don't have coordinates yet, geocode the address
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
      "Calculating roof area...",
      "Applying pitch factor...",
      "Generating estimate..."
    ];

    let messageIndex = 0;
    const interval = setInterval(() => {
      if (messageIndex < messages.length) {
        setProgressMessage(messages[messageIndex]);
        messageIndex++;
      }
    }, 800);

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

      if (cached) {
        console.log("Using cached roof analysis:", cached);
        flatSqft = Number(cached.flat_sqft);
        roofComplexity = cached.roof_complexity || 'gable';
        confidence = cached.confidence || 'medium';
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

        flatSqft = data.estimation.estimatedSqft;
        roofComplexity = data.estimation.roofComplexity || 'gable';
        confidence = data.estimation.confidence || 'medium';

        // Cache the result
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
          roof_shape: data.estimation.roofShape,
          confidence,
          methodology: data.estimation.methodology,
          satellite_image_url: data.estimation.satelliteImageUrl,
          pitch_factor: 1.1,
          complexity_factor: factor / 1.1
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
        adjustedSqft
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

  if (!selectedPackage) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
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
              <div className="space-y-2 relative">
                <Label htmlFor="address">Property Address</Label>
                <Input
                  id="address"
                  placeholder="Start typing your address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onKeyDown={(e) => e.key === "Enter" && verifyAddress()}
                  autoComplete="off"
                />
                
                {/* Autocomplete dropdown */}
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
                Is this the correct location?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Satellite preview */}
              <div className="rounded-lg overflow-hidden border">
                <img 
                  src={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${coordinates.lng},${coordinates.lat},19,0/600x400@2x?access_token=${MAPBOX_TOKEN}`}
                  alt="Satellite view of property"
                  className="w-full"
                />
              </div>

              <p className="text-center font-medium text-sm">{address}</p>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStep("address");
                    setCoordinates(null);
                  }}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Wrong Property
                </Button>
                <Button 
                  onClick={analyzeRoof}
                  className="flex-1"
                >
                  Yes, Analyze Roof
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
              {/* Package Info */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{selectedPackage.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedPackage.pricePerSquare} per square</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="bg-background">
                        {estimate.confidence} Confidence
                      </Badge>
                      {estimate.roofComplexity && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {getComplexityLabel(estimate.roofComplexity)} {getComplexityFactor(estimate.roofComplexity)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

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

              {/* Key Features */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Package Includes:</p>
                <ul className="grid grid-cols-1 gap-1">
                  {selectedPackage.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  onClick={() => onRequestQuote(selectedPackage, {
                    ...estimate,
                    totalSquares: getDisplaySquares(),
                    estimateLow: getDisplayEstimates().low,
                    estimateHigh: getDisplayEstimates().high
                  })}
                  size="lg"
                  className="w-full"
                >
                  Request Official Quote
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <Button 
                  variant="outline"
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}