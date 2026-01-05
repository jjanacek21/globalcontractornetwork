import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, CheckCircle2, ArrowRight, ArrowLeft, Home, Sparkles, Crown, Star, Hammer, DollarSign, Eye, Edit2, Ruler, Video, Users, Satellite, Zap, Map, Pencil, Trash2, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RoofingPackage } from "./PackageBrowser";
import { SalesAvatar } from "./SalesAvatar";
import { SchedulingDialog } from "./SchedulingDialog";
import { RoofAnalysisNote } from "@/components/shared/RoofAnalysisNote";
import { cn } from "@/lib/utils";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

const MAPBOX_TOKEN = "pk.eyJ1IjoiamphbmFjZWsyMSIsImEiOiJjbWdmNHg1YXowNHh1MmlxMmdubjdjdzUzIn0.JKeexzDNUQk8_5cItGJQ2g";

interface QuizEstimateFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packages: RoofingPackage[];
  onSelectPackage: (pkg: RoofingPackage, estimate: any) => void;
}

interface QuizAnswers {
  roofType: string;
  priority: string;
  timeline: string;
  budget: string;
}

interface TieredRecommendation {
  tier: "good" | "better" | "best";
  package: RoofingPackage;
  estimateLow: number;
  estimateHigh: number;
  reason: string;
}

interface AddressSuggestion {
  place_name: string;
  center: [number, number];
}

type Step = "address" | "verify" | "draw" | "quiz" | "analyzing" | "results";

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

// Original quiz questions with emoji icons
const quizQuestions = [
  {
    id: "roofType",
    question: "Hi! I'm here to help you find the perfect roof. First, what type of roof do you currently have?",
    options: [
      { label: "Shingle Roof", value: "shingle", icon: "🏠" },
      { label: "Metal Roof", value: "metal", icon: "🔧" },
      { label: "Tile Roof", value: "tile", icon: "🏛️" },
      { label: "Flat Roof", value: "flat", icon: "📦" },
      { label: "Not Sure", value: "unknown", icon: "❓" }
    ]
  },
  {
    id: "priority",
    question: "Great choice! What matters most to you in a new roof?",
    options: [
      { label: "Best Price", value: "budget", icon: "💰" },
      { label: "Maximum Durability", value: "durability", icon: "💪" },
      { label: "Beautiful Appearance", value: "appearance", icon: "✨" },
      { label: "Energy Efficiency", value: "efficiency", icon: "⚡" }
    ]
  },
  {
    id: "timeline",
    question: "How long do you plan to stay in this home?",
    options: [
      { label: "1-5 Years", value: "short", icon: "📅" },
      { label: "5-15 Years", value: "medium", icon: "🏡" },
      { label: "Forever Home", value: "long", icon: "🏰" }
    ]
  },
  {
    id: "budget",
    question: "What's your budget range per roofing square (100 sq ft)?",
    options: [
      { label: "Economy ($575-$700)", value: "economy", icon: "💵" },
      { label: "Mid-Range ($700-$950)", value: "mid", icon: "💳" },
      { label: "Premium ($1,000+)", value: "premium", icon: "💎" }
    ]
  }
];

// Apply pitch factors based on roof complexity
const applyPitchFactor = (flatSqft: number, complexity: string): { adjustedSqft: number; factor: number } => {
  const trueSqft = flatSqft * 1.1;
  let complexityFactor = 1.0;
  switch (complexity) {
    case 'gable': complexityFactor = 1.10; break;
    case 'hip': complexityFactor = 1.15; break;
    case 'complex': complexityFactor = 1.17; break;
    default: complexityFactor = 1.0;
  }
  return { adjustedSqft: trueSqft * complexityFactor, factor: 1.1 * complexityFactor };
};

const normalizeAddress = (addr: string): string => {
  return addr.toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9\s]/g, '').trim();
};

export function QuizEstimateFlow({ 
  open, 
  onOpenChange, 
  packages,
  onSelectPackage
}: QuizEstimateFlowProps) {
  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({
    roofType: "",
    priority: "",
    timeline: "",
    budget: ""
  });
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [progressMessage, setProgressMessage] = useState("");
  const [totalSquares, setTotalSquares] = useState(0);
  const [roofComplexity, setRoofComplexity] = useState("gable");
  const [recommendations, setRecommendations] = useState<TieredRecommendation[]>([]);
  const [manualSquares, setManualSquares] = useState<number | null>(null);
  const [isEditingSquares, setIsEditingSquares] = useState(false);
  const [showScheduling, setShowScheduling] = useState(false);
  const [appointmentType, setAppointmentType] = useState<"zoom" | "in_person">("zoom");
  const [selectedRec, setSelectedRec] = useState<TieredRecommendation | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  
  // New state for matching InstantEstimateFlow UI
  const [zoomLevel, setZoomLevel] = useState(19);
  const [isLocating, setIsLocating] = useState(false);
  const [mapContainerNode, setMapContainerNode] = useState<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [drawnSqft, setDrawnSqft] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cachedMeasurement, setCachedMeasurement] = useState<any>(null);
  const [isSkippingQuiz, setIsSkippingQuiz] = useState(false);
  const mapContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) setMapContainerNode(node);
  }, []);

  const resetFlow = () => {
    setStep("address");
    setAddress("");
    setSuggestions([]);
    setShowSuggestions(false);
    setCoordinates(null);
    setQuizStep(0);
    setAnswers({ roofType: "", priority: "", timeline: "", budget: "" });
    setProgressMessage("");
    setTotalSquares(0);
    setRoofComplexity("gable");
    setRecommendations([]);
    setManualSquares(null);
    setIsEditingSquares(false);
    setZoomLevel(19);
    setDrawnSqft(0);
    setIsDrawing(false);
    setCachedMeasurement(null);
    setIsSkippingQuiz(false);
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    if (drawRef.current) drawRef.current = null;
  };

  const handleClose = (open: boolean) => {
    if (!open) resetFlow();
    onOpenChange(open);
  };

  // Speaking animation
  useEffect(() => {
    setIsSpeaking(true);
    const timer = setTimeout(() => setIsSpeaking(false), 2000);
    return () => clearTimeout(timer);
  }, [quizStep, step]);

  // Address autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (address.length < 3) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=US&types=address&limit=5`
        );
        const data = await response.json();
        if (data.features) {
          setSuggestions(data.features.map((f: any) => ({ place_name: f.place_name, center: f.center })));
          setShowSuggestions(true);
        }
      } catch (error) { console.error("Geocoding error:", error); }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [address]);

  const selectAddress = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.place_name);
    setCoordinates({ lng: suggestion.center[0], lat: suggestion.center[1] });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const verifyAddress = async () => {
    if (!address.trim()) { toast.error("Please enter your property address"); return; }

    if (!coordinates) {
      try {
        const geocodeResponse = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=US&types=address`
        );
        const geocodeData = await geocodeResponse.json();
        if (!geocodeData.features || geocodeData.features.length === 0) {
          toast.error("Could not find that address."); return;
        }
        const [longitude, latitude] = geocodeData.features[0].center;
        setCoordinates({ lat: latitude, lng: longitude });
        setAddress(geocodeData.features[0].place_name);
      } catch (error) { toast.error("Error finding address."); return; }
    }
    setStep("verify");
  };

  // Check for cached measurement when address is verified
  useEffect(() => {
    if (step !== "verify" || !coordinates || !address) return;
    
    const checkCache = async () => {
      const normalizedAddr = normalizeAddress(address);
      const { data } = await supabase
        .from('roof_analysis_cache')
        .select('*')
        .eq('normalized_address', normalizedAddr)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      
      if (data) setCachedMeasurement(data);
    };
    
    checkCache();
  }, [step, coordinates, address]);

  const startQuiz = () => setStep("quiz");

  // Skip quiz - use AI defaults based on roof analysis
  const handleSkipQuiz = async () => {
    if (!coordinates) return;
    setIsSkippingQuiz(true);
    setStep("analyzing");

    const messages = [
      "Checking for cached measurements...",
      "Analyzing satellite imagery...",
      "Detecting roof characteristics...",
      "Generating smart recommendations..."
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
      let complexity: string;
      let estimatedAge: number | null = null;

      if (cached) {
        flatSqft = Number(cached.flat_sqft);
        complexity = cached.roof_complexity || 'gable';
        estimatedAge = cached.estimated_roof_age_years || null;
        setProgressMessage("Found cached measurement!");
      } else {
        const { data, error } = await supabase.functions.invoke('roof-vision-ai', {
          body: { latitude: coordinates.lat, longitude: coordinates.lng, address }
        });

        if (error) throw error;

        flatSqft = data.estimation.estimatedSqft;
        complexity = data.estimation.roofComplexity || 'gable';
        estimatedAge = data.estimation.estimatedAgeYears || null;

        // Cache the result
        const { adjustedSqft, factor } = applyPitchFactor(flatSqft, complexity);
        await supabase.from('roof_analysis_cache').insert({
          address, normalized_address: normalizedAddr,
          latitude: coordinates.lat, longitude: coordinates.lng,
          flat_sqft: flatSqft, adjusted_sqft: adjustedSqft,
          total_squares: adjustedSqft / 100, roof_complexity: complexity,
          roof_shape: data.estimation.roofShape,
          confidence: data.estimation.confidence,
          methodology: data.estimation.methodology,
          satellite_image_url: data.estimation.satelliteImageUrl,
          pitch_factor: 1.1, complexity_factor: factor / 1.1,
          estimated_roof_age_years: estimatedAge
        });
      }

      clearInterval(interval);

      const { adjustedSqft } = applyPitchFactor(flatSqft, complexity);
      const squares = adjustedSqft / 100;
      setTotalSquares(squares);
      setRoofComplexity(complexity);

      // AI-driven defaults based on roof characteristics
      const smartAnswers: QuizAnswers = {
        roofType: complexity === 'flat' ? 'flat' : 'shingle',
        priority: estimatedAge && estimatedAge > 15 ? 'durability' : 'budget',
        timeline: estimatedAge && estimatedAge > 20 ? 'short' : 'medium',
        budget: 'mid'
      };

      setAnswers(smartAnswers);
      const recs = getRecommendations(squares, smartAnswers);
      setRecommendations(recs);
      setStep("results");

    } catch (error: any) {
      clearInterval(interval);
      console.error("Analysis error:", error);
      toast.error(error.message || "Failed to analyze. Please try again.");
      setStep("verify");
    } finally {
      setIsSkippingQuiz(false);
    }
  };

  // Map initialization for draw step
  useEffect(() => {
    if (step !== "draw" || !mapContainerNode || !coordinates) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    mapRef.current = new mapboxgl.Map({
      container: mapContainerNode,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: [coordinates.lng, coordinates.lat],
      zoom: 19,
    });

    drawRef.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: "simple_select",
    });

    mapRef.current.addControl(drawRef.current);
    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    mapRef.current.on("draw.create", updateDrawnArea);
    mapRef.current.on("draw.update", updateDrawnArea);
    mapRef.current.on("draw.delete", () => {
      setDrawnSqft(0);
      setIsDrawing(false);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [step, mapContainerNode, coordinates]);

  const updateDrawnArea = () => {
    if (!drawRef.current) return;
    const data = drawRef.current.getAll();
    if (data.features.length > 0) {
      const polygon = data.features[0];
      const area = turf.area(polygon);
      const sqft = Math.round(area * 10.764);
      setDrawnSqft(sqft);
      setIsDrawing(false);
    }
  };

  const handleStartDrawing = () => {
    if (drawRef.current) {
      drawRef.current.deleteAll();
      drawRef.current.changeMode("draw_polygon");
      setIsDrawing(true);
    }
  };

  const handleClearDraw = () => {
    if (drawRef.current) {
      drawRef.current.deleteAll();
      setDrawnSqft(0);
      setIsDrawing(false);
    }
  };

  const handleUseDrawnMeasurement = () => {
    const squares = drawnSqft / 100;
    setManualSquares(squares);
    setTotalSquares(squares);
    setStep("quiz");
  };

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`
          );
          const data = await response.json();
          if (data.features?.[0]) {
            setAddress(data.features[0].place_name);
          }
          setStep("verify");
        } catch (error) {
          toast.error("Could not get address from location");
        }
        setIsLocating(false);
      },
      (error) => {
        toast.error("Could not get your location");
        setIsLocating(false);
      }
    );
  };

  const getRecommendations = (squares: number, quizAnswers: QuizAnswers): TieredRecommendation[] => {
    const findPackage = (name: string) => packages.find(p => 
      p.name.toLowerCase().includes(name.toLowerCase())
    );

    let good: RoofingPackage | undefined;
    let better: RoofingPackage | undefined;
    let best: RoofingPackage | undefined;

    if (quizAnswers.roofType === "tile") {
      // Tile roofs can ONLY go back with tile packages
      good = findPackage("Tile Roof Package") || findPackage("Tile");
      better = findPackage("Tile+");
      best = findPackage("Ultimate Roof");
    } else if (quizAnswers.roofType === "metal") {
      // Metal roof options
      good = findPackage("Blue Collar Special");
      better = findPackage("Blue Collar+");
      best = findPackage("Platinum");
    } else if (quizAnswers.roofType === "flat") {
      // Flat roof options
      good = findPackage("Roof Refresh");
      better = findPackage("Bronze");
      best = findPackage("Silver");
    } else {
      // Shingle roofs (or unknown) - logic based on timeline and budget
      if (quizAnswers.timeline === "long") {
        // Forever home - premium options
        if (quizAnswers.budget === "economy") {
          good = findPackage("Silver");
          better = findPackage("Gold");
          best = findPackage("Blue Collar+");
        } else if (quizAnswers.budget === "premium") {
          good = findPackage("Gold");
          better = findPackage("Platinum");
          best = findPackage("Ultimate Roof");
        } else {
          // Mid-range forever home
          good = findPackage("Silver");
          better = findPackage("Blue Collar+");
          best = findPackage("Platinum");
        }
      } else {
        // Short/medium term - economy options
        good = findPackage("Bronze");
        better = findPackage("Silver");
        best = findPackage("Gold");
      }
    }

    // Fallback if packages not found
    if (!good || !better || !best) {
      const sorted = packages
        .filter(p => parsePrice(p.pricePerSquare) !== null)
        .sort((a, b) => (parsePrice(a.pricePerSquare)?.low || 0) - (parsePrice(b.pricePerSquare)?.low || 0));
      good = good || sorted[1];
      better = better || sorted[Math.floor(sorted.length / 2)];
      best = best || sorted[sorted.length - 1];
    }

    const createRec = (pkg: RoofingPackage, tier: "good" | "better" | "best"): TieredRecommendation => {
      const price = parsePrice(pkg.pricePerSquare)!;
      const reasons = {
        good: quizAnswers.timeline === "long" 
          ? "Quality protection for your forever home" 
          : "Best value for budget-conscious homeowners",
        better: "Recommended for best balance of price and quality",
        best: "Premium protection and maximum durability"
      };
      return {
        tier,
        package: pkg,
        estimateLow: Math.round(price.low * squares),
        estimateHigh: Math.round(price.high * squares),
        reason: reasons[tier]
      };
    };

    return [
      createRec(good!, "good"),
      createRec(better!, "better"),
      createRec(best!, "best")
    ];
  };

  const handleQuizAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    // Auto-advance to next question
    setTimeout(() => {
      if (quizStep < quizQuestions.length - 1) {
        setQuizStep(quizStep + 1);
      } else {
        analyzeAndRecommend();
      }
    }, 300);
  };

  const prevQuizStep = () => {
    if (quizStep > 0) setQuizStep(quizStep - 1);
    else setStep("verify");
  };

  const analyzeAndRecommend = async () => {
    if (!coordinates) return;
    setStep("analyzing");

    const messages = [
      "Checking for cached measurements...",
      "Analyzing satellite imagery...",
      "Measuring roof area...",
      "Matching your preferences...",
      "Generating recommendations..."
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
      let complexity: string;

      if (cached) {
        flatSqft = Number(cached.flat_sqft);
        complexity = cached.roof_complexity || 'gable';
        setProgressMessage("Found cached measurement!");
      } else {
        const { data, error } = await supabase.functions.invoke('roof-vision-ai', {
          body: { latitude: coordinates.lat, longitude: coordinates.lng, address }
        });

        if (error) throw error;

        flatSqft = data.estimation.estimatedSqft;
        complexity = data.estimation.roofComplexity || 'gable';

        // Cache the result
        const { adjustedSqft, factor } = applyPitchFactor(flatSqft, complexity);
        await supabase.from('roof_analysis_cache').insert({
          address, normalized_address: normalizedAddr,
          latitude: coordinates.lat, longitude: coordinates.lng,
          flat_sqft: flatSqft, adjusted_sqft: adjustedSqft,
          total_squares: adjustedSqft / 100, roof_complexity: complexity,
          roof_shape: data.estimation.roofShape,
          confidence: data.estimation.confidence,
          methodology: data.estimation.methodology,
          satellite_image_url: data.estimation.satelliteImageUrl,
          pitch_factor: 1.1, complexity_factor: factor / 1.1
        });
      }

      clearInterval(interval);

      const { adjustedSqft } = applyPitchFactor(flatSqft, complexity);
      const squares = adjustedSqft / 100;
      setTotalSquares(squares);
      setRoofComplexity(complexity);

      const recs = getRecommendations(squares, answers);
      setRecommendations(recs);
      setStep("results");

    } catch (error: any) {
      clearInterval(interval);
      console.error("Analysis error:", error);
      toast.error(error.message || "Failed to analyze. Please try again.");
      setStep("quiz");
      setQuizStep(quizQuestions.length - 1);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "good": return Hammer;
      case "better": return Star;
      case "best": return Crown;
      default: return Star;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "good": return "bg-amber-500";
      case "better": return "bg-blue-500";
      case "best": return "bg-purple-500";
      default: return "bg-slate-500";
    }
  };

  const getDisplaySquares = () => manualSquares ?? totalSquares;
  
  const currentQuestion = quizQuestions[quizStep];
  const progress = ((quizStep + 1) / quizQuestions.length) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === "address" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Find Your Perfect Roofing Package
              </DialogTitle>
              <DialogDescription>
                Let's start by entering your property address for an accurate AI measurement
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2 relative">
                <Label htmlFor="quiz-address">Property Address</Label>
                <Input
                  id="quiz-address"
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
              </div>

              <Button onClick={verifyAddress} className="w-full" size="lg" disabled={!address.trim()}>
                Find My Property
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={handleUseCurrentLocation} 
                disabled={isLocating}
                className="w-full"
              >
                <Navigation className="mr-2 h-4 w-4" />
                {isLocating ? "Getting location..." : "Use Current Location"}
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
                <Label className="text-sm font-medium">Satellite Zoom:</Label>
                <Select value={zoomLevel.toString()} onValueChange={(v) => setZoomLevel(parseInt(v))}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18">Zoom 18 - Wide View</SelectItem>
                    <SelectItem value="19">Zoom 19 - Standard</SelectItem>
                    <SelectItem value="20">Zoom 20 - Close-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Satellite Preview with Crosshair */}
              <div className="relative rounded-lg overflow-hidden border">
                <Badge className="absolute top-2 left-2 z-10 bg-background/80 backdrop-blur-sm">
                  <Satellite className="h-3 w-3 mr-1" /> Satellite Preview (Zoom {zoomLevel})
                </Badge>
                <img
                  src={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${coordinates.lng},${coordinates.lat},${zoomLevel},0/600x400@2x?access_token=${MAPBOX_TOKEN}`}
                  alt="Satellite view"
                  className="w-full h-48 object-cover"
                />
                {/* Crosshair Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-primary bg-primary/10" />
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary transform -translate-y-1/2" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary transform -translate-x-1/2" />
                  </div>
                </div>
              </div>

              <p className="text-sm text-center font-medium">{address}</p>

              {/* RoofAnalysisNote Component */}
              <RoofAnalysisNote />

              {/* Cached Measurement Notice */}
              {cachedMeasurement && (
                <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Previous Measurement Found</p>
                          <p className="text-xs text-muted-foreground">
                            {cachedMeasurement.total_squares?.toFixed(1)} squares • {new Date(cachedMeasurement.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">Saved</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setStep("address"); setCoordinates(null); setCachedMeasurement(null); }} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Wrong Property
                  </Button>
                  <Button onClick={startQuiz} className="flex-1">
                    <Zap className="h-4 w-4 mr-1" />
                    Answer Quiz
                  </Button>
                </div>
                <Button onClick={handleSkipQuiz} disabled={isSkippingQuiz} className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Skip Quiz – Let AI Decide
                </Button>
                <Button variant="outline" onClick={() => setStep("draw")} className="w-full">
                  <Map className="h-4 w-4 mr-2" />
                  Draw Specific Section on Map
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "draw" && coordinates && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                Draw Roof Section
              </DialogTitle>
              <DialogDescription>
                Use the polygon tool to trace the specific roof section you want measured
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Map Container */}
              <div
                ref={mapContainerRef}
                className="w-full h-64 rounded-lg overflow-hidden border"
              />

              {/* Drawing Controls */}
              <div className="flex gap-2">
                <Button
                  variant={isDrawing ? "default" : "outline"}
                  onClick={handleStartDrawing}
                  disabled={isDrawing}
                  className="flex-1"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  {isDrawing ? "Drawing..." : "Start Drawing"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearDraw}
                  disabled={drawnSqft === 0}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>

              {/* Drawn Area Display */}
              {drawnSqft > 0 && (
                <div className="p-4 bg-primary/10 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Measured Area</p>
                  <p className="text-2xl font-bold text-primary">
                    {drawnSqft.toLocaleString()} sq ft
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ({(drawnSqft / 100).toFixed(1)} squares)
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("verify")} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button
                  onClick={handleUseDrawnMeasurement}
                  disabled={drawnSqft === 0}
                  className="flex-1"
                >
                  Use This Measurement
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "quiz" && (
          <div className="py-4">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Step {quizStep + 1} of {quizQuestions.length}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Avatar and Question */}
            <div className="flex flex-col items-center text-center mb-8">
              <SalesAvatar speaking={isSpeaking} className="mb-6" />
              
              <div className="bg-muted/50 rounded-2xl rounded-tl-sm p-4 max-w-md">
                <p className="text-lg">{currentQuestion.question}</p>
              </div>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currentQuestion.options.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  onClick={() => handleQuizAnswer(currentQuestion.id, option.value)}
                  className={cn(
                    "h-auto py-4 flex-col gap-2 hover:border-primary hover:bg-primary/5 transition-all",
                    answers[currentQuestion.id as keyof QuizAnswers] === option.value && "border-primary bg-primary/10"
                  )}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </Button>
              ))}
            </div>

            {/* Back button */}
            <Button variant="ghost" onClick={prevQuizStep} className="mt-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        )}

        {step === "analyzing" && (
          <div className="py-12 text-center space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <Home className="absolute inset-0 m-auto h-8 w-8 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Finding Your Perfect Match</h3>
              <p className="text-muted-foreground animate-pulse">{progressMessage}</p>
            </div>
          </div>
        )}

        {step === "results" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Your Personalized Recommendations
              </DialogTitle>
              <DialogDescription>
                Based on your {getDisplaySquares().toFixed(1)} square {roofComplexity} roof
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Manual adjustment */}
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Roof Size: {getDisplaySquares().toFixed(1)} squares</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingSquares(!isEditingSquares)}>
                      <Edit2 className="h-4 w-4 mr-1" />
                      {isEditingSquares ? "Done" : "Adjust"}
                    </Button>
                  </div>
                  
                  {isEditingSquares && (
                    <div className="space-y-2">
                      <Slider
                        value={[getDisplaySquares()]}
                        onValueChange={(v) => {
                          setManualSquares(v[0]);
                          setRecommendations(getRecommendations(v[0], answers));
                        }}
                        min={10}
                        max={100}
                        step={0.5}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>10 sq</span>
                        <span>100 sq</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {recommendations.map((rec) => {
                const TierIcon = getTierIcon(rec.tier);
                const isRecommended = rec.tier === "better";
                const displaySquares = getDisplaySquares();
                const price = parsePrice(rec.package.pricePerSquare);
                const estimateLow = price ? Math.round(price.low * displaySquares) : rec.estimateLow;
                const estimateHigh = price ? Math.round(price.high * displaySquares) : rec.estimateHigh;

                return (
                  <Card 
                    key={rec.tier}
                    className={`relative transition-all hover:shadow-md ${isRecommended ? "ring-2 ring-primary" : ""}`}
                  >
                    {isRecommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getTierColor(rec.tier)} text-white`}>
                            <TierIcon className="h-3 w-3 mr-1" />
                            {rec.tier.charAt(0).toUpperCase() + rec.tier.slice(1)}
                          </Badge>
                          <CardTitle className="text-lg">{rec.package.name}</CardTitle>
                        </div>
                        <span className="text-sm text-muted-foreground">{rec.package.pricePerSquare}/sq</span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{rec.reason}</p>
                      
                      <div className="p-3 bg-green-500/10 rounded-lg space-y-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-600">
                            {formatCurrency(estimateLow)} - {formatCurrency(estimateHigh)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedRec(rec);
                              setAppointmentType("zoom");
                              setShowScheduling(true);
                            }}
                            className="flex-1"
                          >
                            <Video className="mr-1 h-3 w-3" />
                            Zoom Call
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRec(rec);
                              setAppointmentType("in_person");
                              setShowScheduling(true);
                            }}
                            className="flex-1"
                          >
                            <Users className="mr-1 h-3 w-3" />
                            In-Person
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <Button variant="outline" onClick={() => setStep("quiz")} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retake Quiz
              </Button>
            </div>
          </>
        )}

        {/* Scheduling Dialog */}
        {selectedRec && (
          <SchedulingDialog
            open={showScheduling}
            onOpenChange={setShowScheduling}
            appointmentType={appointmentType}
            consultationData={{
              roofType: answers.roofType || "unknown",
              priority: answers.priority || "contact",
              timeline: answers.timeline || "asap",
              budget: answers.budget || selectedRec.package.pricePerSquare,
              zipCode: address,
              sqft: Math.round(getDisplaySquares() * 100),
              recommendedPackage: selectedRec.package.name,
              estimatedPrice: Math.round((selectedRec.estimateLow + selectedRec.estimateHigh) / 2)
            }}
            onComplete={() => {
              handleClose(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}