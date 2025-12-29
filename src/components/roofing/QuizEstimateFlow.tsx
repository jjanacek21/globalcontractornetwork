import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { MapPin, CheckCircle2, ArrowRight, ArrowLeft, Home, Sparkles, Crown, Star, Hammer, DollarSign, Eye, Edit2, Ruler } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RoofingPackage } from "./PackageBrowser";
import { SalesAvatar } from "./SalesAvatar";
import { cn } from "@/lib/utils";

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

type Step = "address" | "verify" | "quiz" | "analyzing" | "results";

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
  const debounceRef = useRef<NodeJS.Timeout>();

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

  const startQuiz = () => setStep("quiz");

  const getRecommendations = (squares: number, quizAnswers: QuizAnswers): TieredRecommendation[] => {
    let relevantPackages = [...packages];
    
    if (quizAnswers.roofType === "tile") {
      relevantPackages = packages.filter(p => 
        p.name.toLowerCase().includes("tile") || p.name.toLowerCase().includes("refresh")
      );
      if (relevantPackages.length < 3) relevantPackages = packages;
    } else if (quizAnswers.roofType === "metal") {
      relevantPackages = packages.filter(p => 
        p.name.toLowerCase().includes("metal") || p.name.toLowerCase().includes("collar") ||
        p.name.toLowerCase().includes("platinum") || p.name.toLowerCase().includes("ultimate")
      );
      if (relevantPackages.length < 3) relevantPackages = packages;
    }

    const sortedPackages = relevantPackages
      .filter(p => parsePrice(p.pricePerSquare) !== null)
      .sort((a, b) => (parsePrice(a.pricePerSquare)?.low || 0) - (parsePrice(b.pricePerSquare)?.low || 0));

    if (sortedPackages.length < 3) return [];

    let goodIdx = 0, betterIdx = Math.floor(sortedPackages.length / 2), bestIdx = sortedPackages.length - 1;

    if (quizAnswers.budget === "economy") {
      betterIdx = Math.min(2, sortedPackages.length - 1);
      bestIdx = Math.min(4, sortedPackages.length - 1);
    } else if (quizAnswers.budget === "premium") {
      goodIdx = Math.max(0, sortedPackages.length - 5);
      betterIdx = Math.max(0, sortedPackages.length - 3);
    }

    const createRec = (pkg: RoofingPackage, tier: "good" | "better" | "best"): TieredRecommendation => {
      const price = parsePrice(pkg.pricePerSquare)!;
      return {
        tier, package: pkg,
        estimateLow: Math.round(price.low * squares),
        estimateHigh: Math.round(price.high * squares),
        reason: tier === "good" ? "Best for budget-conscious homeowners"
          : tier === "better" ? "Recommended for best value"
          : "Premium protection and durability"
      };
    };

    return [
      createRec(sortedPackages[goodIdx], "good"),
      createRec(sortedPackages[betterIdx], "better"),
      createRec(sortedPackages[bestIdx], "best")
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
              <DialogDescription>Is this the correct location?</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg overflow-hidden border">
                <img 
                  src={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${coordinates.lng},${coordinates.lat},19,0/600x400@2x?access_token=${MAPBOX_TOKEN}`}
                  alt="Satellite view of property"
                  className="w-full"
                />
              </div>

              <p className="text-center font-medium text-sm">{address}</p>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setStep("address"); setCoordinates(null); }} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Wrong Property
                </Button>
                <Button onClick={startQuiz} className="flex-1">
                  Yes, Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
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
                      
                      <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-600">
                            {formatCurrency(estimateLow)} - {formatCurrency(estimateHigh)}
                          </span>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => onSelectPackage(rec.package, {
                            address,
                            totalSquares: displaySquares,
                            estimateLow,
                            estimateHigh,
                            confidence: "high",
                            roofComplexity
                          })}
                        >
                          Select Package
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
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
      </DialogContent>
    </Dialog>
  );
}