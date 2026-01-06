import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Building2, Home, Layers, Shield, Palette, Sun, Clock, 
  DollarSign, CloudRain, ArrowLeft, ArrowRight, Sparkles,
  Check, Star, Scale, Eye
} from "lucide-react";
import { RoofingPackage } from "./PackageBrowser";
import { SalesAvatar } from "./SalesAvatar";
import { InstantEstimateFlow } from "./InstantEstimateFlow";

interface MaterialRecommendationQuizProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packages: RoofingPackage[];
  onSelectPackage: (pkg: RoofingPackage, estimate: any) => void;
}

interface QuizAnswers {
  propertyType: string;
  currentRoof: string;
  topPriority: string;
  aesthetic: string;
  colorPreference: string;
  timeInHome: string;
  budgetRange: string;
  climateConcern: string;
}

interface QuizQuestion {
  id: keyof QuizAnswers;
  question: string;
  subtitle: string;
  icon: React.ReactNode;
  options: { value: string; label: string; icon?: React.ReactNode; description?: string }[];
}

const quizQuestions: QuizQuestion[] = [
  {
    id: "propertyType",
    question: "What type of property is this?",
    subtitle: "This helps us recommend the right roofing system",
    icon: <Building2 className="h-6 w-6" />,
    options: [
      { value: "residential", label: "Residential", icon: <Home className="h-5 w-5" />, description: "Single family, townhouse, or multi-family home" },
      { value: "commercial", label: "Commercial", icon: <Building2 className="h-5 w-5" />, description: "Office, warehouse, retail, or industrial building" }
    ]
  },
  {
    id: "currentRoof",
    question: "What's your current roof material?",
    subtitle: "Understanding your existing roof helps with recommendations",
    icon: <Layers className="h-6 w-6" />,
    options: [
      { value: "shingle", label: "Asphalt Shingles", description: "Most common residential roofing" },
      { value: "metal", label: "Metal Roof", description: "Standing seam or 5V crimp panels" },
      { value: "tile", label: "Tile (Clay/Concrete)", description: "Mediterranean or barrel tile" },
      { value: "flat", label: "Flat Roof", description: "TPO, EPDM, or modified bitumen" },
      { value: "unknown", label: "Not Sure", description: "We'll help you identify it" }
    ]
  },
  {
    id: "topPriority",
    question: "What matters most to you?",
    subtitle: "We'll prioritize your top concern in our recommendations",
    icon: <Shield className="h-6 w-6" />,
    options: [
      { value: "durability", label: "Maximum Durability", icon: <Shield className="h-5 w-5" />, description: "50+ year lifespan, storm-ready" },
      { value: "appearance", label: "Beautiful Appearance", icon: <Eye className="h-5 w-5" />, description: "Curb appeal and aesthetics" },
      { value: "efficiency", label: "Energy Efficiency", icon: <Sun className="h-5 w-5" />, description: "Lower utility bills, cooler home" },
      { value: "value", label: "Best Value", icon: <Scale className="h-5 w-5" />, description: "Balance of quality and price" }
    ]
  },
  {
    id: "aesthetic",
    question: "What aesthetic style do you prefer?",
    subtitle: "Your roof should complement your home's character",
    icon: <Palette className="h-6 w-6" />,
    options: [
      { value: "modern", label: "Modern", description: "Clean lines, contemporary look" },
      { value: "traditional", label: "Traditional", description: "Classic, timeless appearance" },
      { value: "rustic", label: "Rustic", description: "Natural textures, earthy feel" },
      { value: "match", label: "Match Neighborhood", description: "Blend in with surrounding homes" }
    ]
  },
  {
    id: "colorPreference",
    question: "What color family appeals to you?",
    subtitle: "We'll suggest materials available in your preferred colors",
    icon: <Palette className="h-6 w-6" />,
    options: [
      { value: "dark", label: "Dark Tones", description: "Black, charcoal, deep gray" },
      { value: "light", label: "Light Tones", description: "White, beige, light gray" },
      { value: "earth", label: "Earth Tones", description: "Brown, tan, terracotta" },
      { value: "bold", label: "Bold Colors", description: "Blue, green, red accents" }
    ]
  },
  {
    id: "timeInHome",
    question: "How long do you plan to stay in this home?",
    subtitle: "This affects warranty and material recommendations",
    icon: <Clock className="h-6 w-6" />,
    options: [
      { value: "short", label: "1-5 Years", description: "Planning to sell soon" },
      { value: "medium", label: "5-15 Years", description: "Medium-term investment" },
      { value: "forever", label: "Forever Home", description: "Lifetime investment" }
    ]
  },
  {
    id: "budgetRange",
    question: "What's your budget priority?",
    subtitle: "All our packages deliver quality, but at different price points",
    icon: <DollarSign className="h-6 w-6" />,
    options: [
      { value: "economy", label: "Economy", description: "$575-$700 per square" },
      { value: "midrange", label: "Mid-Range", description: "$700-$950 per square" },
      { value: "premium", label: "Premium", description: "$1,000+ per square" }
    ]
  },
  {
    id: "climateConcern",
    question: "What's your biggest climate concern?",
    subtitle: "Florida weather demands specific roofing features",
    icon: <CloudRain className="h-6 w-6" />,
    options: [
      { value: "heat", label: "Extreme Heat", description: "Need reflective, cooling options" },
      { value: "storms", label: "Hurricanes & Storms", description: "Maximum wind resistance" },
      { value: "humidity", label: "High Humidity", description: "Mold and algae resistance" },
      { value: "all", label: "All of the Above", description: "Complete Florida protection" }
    ]
  }
];

type RecommendationTier = "good" | "better" | "best";

interface Recommendation {
  tier: RecommendationTier;
  package: RoofingPackage;
  matchScore: number;
  reasons: string[];
}

export const MaterialRecommendationQuiz = ({
  open,
  onOpenChange,
  packages,
  onSelectPackage
}: MaterialRecommendationQuizProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [showResults, setShowResults] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [comparisonItems, setComparisonItems] = useState<RoofingPackage[]>([]);
  const [selectedForEstimate, setSelectedForEstimate] = useState<RoofingPackage | null>(null);
  const [estimateFlowOpen, setEstimateFlowOpen] = useState(false);
  const [showAllPackages, setShowAllPackages] = useState(false);

  const currentQuestion = quizQuestions[currentStep];
  const progress = ((currentStep + 1) / quizQuestions.length) * 100;

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
    setRecommendations([]);
    setComparisonItems([]);
    setSelectedForEstimate(null);
    setShowAllPackages(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetQuiz, 300);
  };

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    if (currentStep < quizQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      generateRecommendations(newAnswers as QuizAnswers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateRecommendations = (finalAnswers: QuizAnswers) => {
    const recs: Recommendation[] = [];

    // Map answers to package recommendations
    const isShingle = finalAnswers.currentRoof === "shingle" || finalAnswers.currentRoof === "unknown";
    const isMetal = finalAnswers.currentRoof === "metal";
    const isTile = finalAnswers.currentRoof === "tile";
    const isFlat = finalAnswers.currentRoof === "flat";
    const isEconomy = finalAnswers.budgetRange === "economy";
    const isMidRange = finalAnswers.budgetRange === "midrange";
    const isPremium = finalAnswers.budgetRange === "premium";
    const wantsDurability = finalAnswers.topPriority === "durability";
    const wantsAppearance = finalAnswers.topPriority === "appearance";
    const isForeverHome = finalAnswers.timeInHome === "forever";

    // Find packages
    const bronze = packages.find(p => p.name.includes("Bronze"));
    const silver = packages.find(p => p.name.includes("Silver"));
    const gold = packages.find(p => p.name.includes("Gold") && !p.name.includes("Blue"));
    const blueCollar = packages.find(p => p.name === "The Blue Collar Special");
    const blueCollarPlus = packages.find(p => p.name === "Blue Collar+");
    const platinum = packages.find(p => p.name.includes("Platinum"));
    const tile = packages.find(p => p.name === "Tile Roof Package");
    const tilePlus = packages.find(p => p.name === "Tile+ Roof Package");
    const roofRefresh = packages.find(p => p.name.includes("Refresh"));
    const ultimate = packages.find(p => p.name.includes("Ultimate"));

    if (isShingle) {
      if (isEconomy) {
        if (bronze) recs.push({ tier: "good", package: bronze, matchScore: 85, reasons: ["Budget-friendly option", "5-year warranty", "Quality materials"] });
        if (silver) recs.push({ tier: "better", package: silver, matchScore: 92, reasons: ["10-year warranty", "Better underlayment", "More included materials"] });
        if (gold) recs.push({ tier: "best", package: gold, matchScore: 88, reasons: ["Lifetime warranty", "Solar attic fan", "Premium underlayment"] });
      } else if (isMidRange) {
        if (silver) recs.push({ tier: "good", package: silver, matchScore: 80, reasons: ["Solid mid-range value", "10-year warranty"] });
        if (gold) recs.push({ tier: "better", package: gold, matchScore: 95, reasons: ["Lifetime warranty", "Premium features", "Best value for quality"] });
        if (platinum) recs.push({ tier: "best", package: platinum, matchScore: 90, reasons: ["Standing seam metal upgrade", "Maximum durability"] });
      } else {
        if (gold) recs.push({ tier: "good", package: gold, matchScore: 82, reasons: ["Premium shingle package", "Lifetime warranty"] });
        if (platinum) recs.push({ tier: "better", package: platinum, matchScore: 94, reasons: ["Standing seam metal", "Kynar coating", "Lifetime warranty"] });
        if (ultimate) recs.push({ tier: "best", package: ultimate, matchScore: 98, reasons: ["Top-tier materials", "Fire-rated underlayment", "Complete package"] });
      }
    } else if (isMetal) {
      if (isEconomy || isMidRange) {
        if (blueCollar) recs.push({ tier: "good", package: blueCollar, matchScore: 88, reasons: ["Affordable metal option", "5V crimp profile", "10-year warranty"] });
        if (blueCollarPlus) recs.push({ tier: "better", package: blueCollarPlus, matchScore: 94, reasons: ["Kynar coating", "Lifetime warranty", "Solar ventilation"] });
        if (platinum) recs.push({ tier: "best", package: platinum, matchScore: 90, reasons: ["Premium standing seam", "Maximum durability"] });
      } else {
        if (blueCollarPlus) recs.push({ tier: "good", package: blueCollarPlus, matchScore: 85, reasons: ["Quality metal package", "Kynar finish"] });
        if (platinum) recs.push({ tier: "better", package: platinum, matchScore: 96, reasons: ["Standing seam metal", "Premium underlayment", "Lifetime warranty"] });
        if (ultimate) recs.push({ tier: "best", package: ultimate, matchScore: 99, reasons: ["Stone-coated steel option", "Fire-rated", "Complete premium package"] });
      }
    } else if (isTile) {
      if (tile) recs.push({ tier: "good", package: tile, matchScore: 85, reasons: ["Standard tile replacement", "10-year warranty"] });
      if (tilePlus) recs.push({ tier: "better", package: tilePlus, matchScore: 94, reasons: ["Premium underlayment", "Glued and screwed", "Enhanced durability"] });
      if (ultimate) recs.push({ tier: "best", package: ultimate, matchScore: 88, reasons: ["Metal alternative", "Longer lifespan", "Lower maintenance"] });
    } else if (isFlat) {
      if (roofRefresh) recs.push({ tier: "good", package: roofRefresh, matchScore: 80, reasons: ["Coating refresh", "Budget-friendly", "5-year warranty"] });
      if (bronze) recs.push({ tier: "better", package: bronze, matchScore: 75, reasons: ["Full replacement option", "Better long-term value"] });
      if (silver) recs.push({ tier: "best", package: silver, matchScore: 70, reasons: ["Upgraded materials", "10-year warranty"] });
    }

    // Sort by tier
    const tierOrder = { good: 1, better: 2, best: 3 };
    recs.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);

    setRecommendations(recs);
    setShowResults(true);
  };

  const toggleComparison = (pkg: RoofingPackage) => {
    setComparisonItems(prev => {
      const exists = prev.some(p => p.name === pkg.name);
      if (exists) {
        return prev.filter(p => p.name !== pkg.name);
      }
      if (prev.length >= 3) return prev;
      return [...prev, pkg];
    });
  };

  const handleSelectPackage = (pkg: RoofingPackage) => {
    setSelectedForEstimate(pkg);
    setEstimateFlowOpen(true);
  };

  const handleEstimateComplete = (pkg: RoofingPackage, estimate: any) => {
    setEstimateFlowOpen(false);
    handleClose();
    onSelectPackage(pkg, estimate);
  };

  const getTierBadge = (tier: RecommendationTier) => {
    switch (tier) {
      case "good":
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/30">Good</Badge>;
      case "better":
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Better</Badge>;
      case "best":
        return <Badge className="bg-emerald-500 text-white">Best</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Material Recommendation Quiz
            </DialogTitle>
          </DialogHeader>

          {!showResults ? (
            <div className="space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Question {currentStep + 1} of {quizQuestions.length}</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <SalesAvatar speaking={true} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    {currentQuestion.icon}
                    <span className="font-medium">{currentQuestion.question}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{currentQuestion.subtitle}</p>
                </div>
              </div>

              {/* Options */}
              <div className="grid gap-3">
                {currentQuestion.options.map((option) => (
                  <Card
                    key={option.value}
                    className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                      answers[currentQuestion.id] === option.value ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleAnswer(option.value)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      {option.icon && (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          {option.icon}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{option.label}</div>
                        {option.description && (
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        )}
                      </div>
                      {answers[currentQuestion.id] === option.value && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : !showAllPackages ? (
            <div className="space-y-6">
              {/* Results Header */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Your Personalized Recommendations</h3>
                <p className="text-muted-foreground">Based on your preferences and property details</p>
              </div>

              {/* Recommendations */}
              <div className="grid gap-4">
                {recommendations.map((rec, idx) => (
                  <Card 
                    key={rec.package.name}
                    className={`relative overflow-hidden ${rec.tier === 'better' ? 'border-primary ring-2 ring-primary/20' : ''}`}
                  >
                    {rec.tier === 'better' && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Recommended
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getTierBadge(rec.tier)}
                            <span className="font-semibold">{rec.package.name}</span>
                          </div>
                          <div className="text-lg font-bold text-primary">{rec.package.pricePerSquare}/sq</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={comparisonItems.some(p => p.name === rec.package.name)}
                            onCheckedChange={() => toggleComparison(rec.package)}
                            disabled={comparisonItems.length >= 3 && !comparisonItems.some(p => p.name === rec.package.name)}
                          />
                          <span className="text-xs text-muted-foreground">Compare</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {rec.reasons.map((reason, i) => (
                          <Badge key={i} variant="outline" className="text-xs font-normal">
                            <Check className="h-3 w-3 mr-1" />
                            {reason}
                          </Badge>
                        ))}
                      </div>

                      <Button 
                        className="w-full" 
                        variant={rec.tier === 'better' ? 'default' : 'outline'}
                        onClick={() => handleSelectPackage(rec.package)}
                      >
                        Get Instant Estimate
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowAllPackages(true)}
                >
                  View All Packages
                </Button>
                {comparisonItems.length >= 2 && (
                  <Button variant="secondary" className="flex-1">
                    Compare ({comparisonItems.length})
                  </Button>
                )}
              </div>

              <Button variant="ghost" onClick={resetQuiz} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button variant="ghost" onClick={() => setShowAllPackages(false)} className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Recommendations
              </Button>

              <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
                {packages.map((pkg) => (
                  <Card key={pkg.name} className="hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold">{pkg.name}</div>
                          <div className="text-primary font-medium">{pkg.pricePerSquare}/sq</div>
                        </div>
                        <div className="flex gap-2">
                          <Checkbox
                            checked={comparisonItems.some(p => p.name === pkg.name)}
                            onCheckedChange={() => toggleComparison(pkg)}
                            disabled={comparisonItems.length >= 3 && !comparisonItems.some(p => p.name === pkg.name)}
                          />
                          <Button size="sm" onClick={() => handleSelectPackage(pkg)}>
                            Select
                          </Button>
                        </div>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {pkg.features.slice(0, 3).map((f, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <Check className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Instant Estimate Flow */}
      <InstantEstimateFlow
        open={estimateFlowOpen}
        onOpenChange={setEstimateFlowOpen}
        selectedPackage={selectedForEstimate}
        onRequestQuote={handleEstimateComplete}
        onCompareOthers={() => {
          setEstimateFlowOpen(false);
          setShowAllPackages(true);
        }}
      />
    </>
  );
};
