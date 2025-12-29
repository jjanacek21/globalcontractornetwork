import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, MapPin, CheckCircle2, ArrowRight, ArrowLeft, Home, Sparkles, Crown, Star, Hammer, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RoofingPackage } from "./PackageBrowser";

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

type Step = "address" | "quiz" | "analyzing" | "results";

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

const quizQuestions = [
  {
    id: "roofType",
    question: "What type of roof do you currently have?",
    options: [
      { value: "shingle", label: "Shingle (Asphalt)" },
      { value: "tile", label: "Tile (Clay/Concrete)" },
      { value: "metal", label: "Metal" },
      { value: "flat", label: "Flat Roof" },
      { value: "unknown", label: "Not Sure" }
    ]
  },
  {
    id: "priority",
    question: "What's most important to you?",
    options: [
      { value: "budget", label: "Staying within budget" },
      { value: "value", label: "Best value for money" },
      { value: "quality", label: "Premium quality & durability" },
      { value: "protection", label: "Maximum weather protection" }
    ]
  },
  {
    id: "timeline",
    question: "When do you need the work done?",
    options: [
      { value: "asap", label: "As soon as possible" },
      { value: "1-3months", label: "Within 1-3 months" },
      { value: "3-6months", label: "Within 3-6 months" },
      { value: "researching", label: "Just researching for now" }
    ]
  },
  {
    id: "budget",
    question: "What's your approximate budget?",
    options: [
      { value: "under10k", label: "Under $10,000" },
      { value: "10-20k", label: "$10,000 - $20,000" },
      { value: "20-30k", label: "$20,000 - $30,000" },
      { value: "over30k", label: "$30,000+" }
    ]
  }
];

export function QuizEstimateFlow({ 
  open, 
  onOpenChange, 
  packages,
  onSelectPackage
}: QuizEstimateFlowProps) {
  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState("");
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({
    roofType: "",
    priority: "",
    timeline: "",
    budget: ""
  });
  const [progressMessage, setProgressMessage] = useState("");
  const [totalSquares, setTotalSquares] = useState(0);
  const [recommendations, setRecommendations] = useState<TieredRecommendation[]>([]);

  const resetFlow = () => {
    setStep("address");
    setAddress("");
    setQuizStep(0);
    setAnswers({ roofType: "", priority: "", timeline: "", budget: "" });
    setProgressMessage("");
    setTotalSquares(0);
    setRecommendations([]);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetFlow();
    }
    onOpenChange(open);
  };

  const getRecommendations = (squares: number, quizAnswers: QuizAnswers): TieredRecommendation[] => {
    // Filter packages based on roof type preference
    let relevantPackages = [...packages];
    
    if (quizAnswers.roofType === "tile") {
      relevantPackages = packages.filter(p => 
        p.name.toLowerCase().includes("tile") || 
        p.name.toLowerCase().includes("refresh")
      );
      // If no tile packages, fall back to all
      if (relevantPackages.length < 3) {
        relevantPackages = packages;
      }
    } else if (quizAnswers.roofType === "metal") {
      relevantPackages = packages.filter(p => 
        p.name.toLowerCase().includes("metal") || 
        p.name.toLowerCase().includes("collar") ||
        p.name.toLowerCase().includes("platinum") ||
        p.name.toLowerCase().includes("ultimate")
      );
      if (relevantPackages.length < 3) {
        relevantPackages = packages;
      }
    }

    // Sort by price
    const sortedPackages = relevantPackages
      .filter(p => parsePrice(p.pricePerSquare) !== null)
      .sort((a, b) => {
        const priceA = parsePrice(a.pricePerSquare)?.low || 0;
        const priceB = parsePrice(b.pricePerSquare)?.low || 0;
        return priceA - priceB;
      });

    if (sortedPackages.length < 3) {
      return [];
    }

    // Select good, better, best based on priority
    let goodIdx = 0;
    let betterIdx = Math.floor(sortedPackages.length / 2);
    let bestIdx = sortedPackages.length - 1;

    // Adjust based on budget
    if (quizAnswers.budget === "under10k") {
      betterIdx = Math.min(2, sortedPackages.length - 1);
      bestIdx = Math.min(4, sortedPackages.length - 1);
    } else if (quizAnswers.budget === "over30k") {
      goodIdx = Math.max(0, sortedPackages.length - 5);
      betterIdx = Math.max(0, sortedPackages.length - 3);
    }

    const createRec = (pkg: RoofingPackage, tier: "good" | "better" | "best"): TieredRecommendation => {
      const price = parsePrice(pkg.pricePerSquare)!;
      return {
        tier,
        package: pkg,
        estimateLow: Math.round(price.low * squares),
        estimateHigh: Math.round(price.high * squares),
        reason: tier === "good" 
          ? "Best for budget-conscious homeowners"
          : tier === "better"
          ? "Recommended for best value"
          : "Premium protection and durability"
      };
    };

    return [
      createRec(sortedPackages[goodIdx], "good"),
      createRec(sortedPackages[betterIdx], "better"),
      createRec(sortedPackages[bestIdx], "best")
    ];
  };

  const startQuiz = () => {
    if (!address.trim()) {
      toast.error("Please enter your property address");
      return;
    }
    setStep("quiz");
  };

  const handleQuizAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const nextQuizStep = () => {
    const currentQuestion = quizQuestions[quizStep];
    if (!answers[currentQuestion.id as keyof QuizAnswers]) {
      toast.error("Please select an option");
      return;
    }

    if (quizStep < quizQuestions.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      analyzeAndRecommend();
    }
  };

  const prevQuizStep = () => {
    if (quizStep > 0) {
      setQuizStep(quizStep - 1);
    } else {
      setStep("address");
    }
  };

  const analyzeAndRecommend = async () => {
    setStep("analyzing");

    const messages = [
      "Locating property...",
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
      // Geocode the address
      const geocodeResponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=pk.eyJ1IjoibG92YWJsZWRldiIsImEiOiJjbHJldzlhOHUwNXViMmlxdWxhbHY3bDd4In0.9y4oBFKQqWftXXF4YcLisA&country=US&types=address`
      );
      const geocodeData = await geocodeResponse.json();

      if (!geocodeData.features || geocodeData.features.length === 0) {
        throw new Error("Could not find that address");
      }

      const [longitude, latitude] = geocodeData.features[0].center;

      // Call AI vision
      const { data, error } = await supabase.functions.invoke('roof-vision-ai', {
        body: { latitude, longitude, address }
      });

      clearInterval(interval);

      if (error) throw error;

      const squares = data.estimation.estimatedSqft / 100;
      setTotalSquares(squares);

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
              <div className="space-y-2">
                <Label htmlFor="quiz-address">Property Address</Label>
                <Input
                  id="quiz-address"
                  placeholder="123 Main Street, Miami, FL 33101"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startQuiz()}
                />
              </div>

              <Button 
                onClick={startQuiz} 
                className="w-full" 
                size="lg"
                disabled={!address.trim()}
              >
                Continue to Questions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {step === "quiz" && (
          <>
            <DialogHeader>
              <DialogTitle>
                Question {quizStep + 1} of {quizQuestions.length}
              </DialogTitle>
              <DialogDescription>
                {quizQuestions[quizStep].question}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-2 mb-6">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((quizStep + 1) / quizQuestions.length) * 100}%` }}
                />
              </div>

              <RadioGroup
                value={answers[quizQuestions[quizStep].id as keyof QuizAnswers]}
                onValueChange={(value) => handleQuizAnswer(quizQuestions[quizStep].id, value)}
                className="space-y-3"
              >
                {quizQuestions[quizStep].options.map((option) => (
                  <div 
                    key={option.value}
                    className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      answers[quizQuestions[quizStep].id as keyof QuizAnswers] === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handleQuizAnswer(quizQuestions[quizStep].id, option.value)}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="cursor-pointer flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={prevQuizStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={nextQuizStep} className="flex-1">
                  {quizStep === quizQuestions.length - 1 ? "Get Recommendations" : "Next"}
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
                Based on your {totalSquares.toFixed(1)} square roof and preferences
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {recommendations.map((rec) => {
                const TierIcon = getTierIcon(rec.tier);
                const isRecommended = rec.tier === "better";

                return (
                  <Card 
                    key={rec.tier}
                    className={`relative transition-all hover:shadow-md ${
                      isRecommended ? "ring-2 ring-primary" : ""
                    }`}
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
                        <span className="text-sm text-muted-foreground">
                          {rec.package.pricePerSquare}/sq
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{rec.reason}</p>
                      
                      <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-600">
                            {formatCurrency(rec.estimateLow)} - {formatCurrency(rec.estimateHigh)}
                          </span>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => onSelectPackage(rec.package, {
                            address,
                            totalSquares,
                            estimateLow: rec.estimateLow,
                            estimateHigh: rec.estimateHigh
                          })}
                        >
                          Select
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>

                      <ul className="grid grid-cols-1 gap-1">
                        {rec.package.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}

              <Button 
                variant="outline" 
                onClick={() => {
                  handleClose(false);
                }}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse All Packages
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
