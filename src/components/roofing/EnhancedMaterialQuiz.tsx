import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Sparkles, AlertTriangle } from "lucide-react";
import { RoofTypeGraphic, ConditionGraphic, StoryGraphic, VentGraphic, UnderlaymentGraphic } from "./quiz-graphics";
import { QuizInputs, getRecommendations, expandedPackages } from "@/lib/roofingRecommendationEngine";
import { EnhancedInstantEstimate } from "./EnhancedInstantEstimate";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { 
  PackageConfig, 
  getPackageById, 
  getGoodBetterBest,
  calculateEstimate 
} from "@/lib/packagePricing";

interface MeasurementData {
  baseSqft: number;
  pitchMultiplier: number;
  trueSqft: number;
  wastePct: number;
  totalWithWaste: number;
  roofSquares: number;
  roofComplexity: string;
}

interface EnhancedMaterialQuizProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roofSquares: number;
  address: string;
  cityState: string;
  measurementData?: MeasurementData;
  onComplete: () => void;
}

type QuizStep = "current-roof" | "condition" | "stories" | "hoa" | "leak" | "concerns" | "desired-roof" | "underlayment" | "ventilation" | "gutters-current" | "gutters-want" | "timeline" | "notes" | "results";

const QUIZ_STEPS: QuizStep[] = [
  "current-roof", "condition", "stories", "hoa", "leak", "concerns", 
  "desired-roof", "underlayment", "ventilation", "gutters-current", 
  "gutters-want", "timeline", "notes"
];

// Map recommendation tier to PackageConfig
const getPackageConfigFromTier = (tier: string, desiredRoof: string): PackageConfig | undefined => {
  // Determine category based on desired roof type
  let category: "shingle" | "metal" | "tile" = "shingle";
  if (desiredRoof === "metal") category = "metal";
  else if (desiredRoof === "tile") category = "tile";
  
  const gbb = getGoodBetterBest(category);
  
  switch (tier) {
    case "good": return gbb.good;
    case "better": return gbb.better;
    case "best": return gbb.best;
    default: return gbb.better;
  }
};

export function EnhancedMaterialQuiz({
  open, onOpenChange, roofSquares, address, cityState, measurementData, onComplete
}: EnhancedMaterialQuizProps) {
  const [step, setStep] = useState<QuizStep>("current-roof");
  const [answers, setAnswers] = useState<Partial<QuizInputs>>({
    cityState,
    roofSquares,
    concerns: []
  });
  const [showEnhancedEstimate, setShowEnhancedEstimate] = useState(false);
  const quizResponseIdRef = useRef<string | null>(null);
  const [estimatePackages, setEstimatePackages] = useState<Array<{
    package: PackageConfig;
    estimateLow: number;
    estimateHigh: number;
    tier: "good" | "better" | "best";
    isRecommended?: boolean;
  }>>([]);

  const currentStepIndex = QUIZ_STEPS.indexOf(step as any);
  const progress = step === "results" ? 100 : ((currentStepIndex + 1) / QUIZ_STEPS.length) * 100;

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < QUIZ_STEPS.length) {
      setStep(QUIZ_STEPS[nextIndex]);
    } else {
      generateRecommendations();
    }
  };

  const goBack = () => {
    if (step === "results") {
      setStep("notes");
    } else if (currentStepIndex > 0) {
      setStep(QUIZ_STEPS[currentStepIndex - 1]);
    }
  };

  const generateRecommendations = async () => {
    const fullInputs: QuizInputs = {
      cityState: answers.cityState || cityState,
      currentRoof: answers.currentRoof || "shingle",
      condition: (answers.condition as any) || "needs-work",
      stories: (answers.stories as any) || 1,
      hasHOA: answers.hasHOA || false,
      hasLeak: answers.hasLeak || false,
      concerns: answers.concerns || [],
      desiredRoof: answers.desiredRoof || "shingle",
      underlayment: answers.underlayment || "synthetic",
      ventilation: answers.ventilation || "ridge",
      hasGutters: answers.hasGutters || false,
      wantsGutters: (answers.wantsGutters as any) || "unsure",
      timeInHome: (answers.timeInHome as any) || "medium",
      roofSquares,
      notes: answers.notes
    };
    
    const recs = getRecommendations(fullInputs, expandedPackages);
    
    // Build the packages array for EnhancedInstantEstimate
    // Determine category based on desired roof
    let category: "shingle" | "metal" | "tile" = "shingle";
    if (answers.desiredRoof === "metal") category = "metal";
    else if (answers.desiredRoof === "tile") category = "tile";
    
    const gbb = getGoodBetterBest(category);
    
    const goodEst = calculateEstimate(gbb.good, roofSquares);
    const betterEst = calculateEstimate(gbb.better, roofSquares);
    const bestEst = calculateEstimate(gbb.best, roofSquares);
    
    const pkgOptions = [
      {
        package: gbb.good,
        estimateLow: goodEst.low,
        estimateHigh: goodEst.high,
        tier: "good" as const,
        isRecommended: false
      },
      {
        package: gbb.better,
        estimateLow: betterEst.low,
        estimateHigh: betterEst.high,
        tier: "better" as const,
        isRecommended: true // Default to "better" as recommended
      },
      {
        package: gbb.best,
        estimateLow: bestEst.low,
        estimateHigh: bestEst.high,
        tier: "best" as const,
        isRecommended: false
      }
    ];
    
    setEstimatePackages(pkgOptions);
    setStep("results");
    
    // Show the enhanced estimate dialog
    setShowEnhancedEstimate(true);

    // Log to database for analytics
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await (supabase
        .from("roofing_quiz_responses" as any)
        .insert({
          user_id: session?.user?.id || null,
          address,
          city_state: cityState,
          roof_squares: roofSquares,
          answers: fullInputs as any,
          recommendations: recs.map(r => ({
            tier: r.tier,
            packageName: r.package.name,
            estimateLow: r.estimateLow,
            estimateHigh: r.estimateHigh,
            reason: r.reason
          })) as any
        })
        .select("id")
        .single() as any);

      if (!error && data) {
        quizResponseIdRef.current = data.id;
        console.log("Quiz response logged:", data.id);
      }
    } catch (err) {
      console.error("Failed to log quiz response:", err);
    }
  };

  const handleSelect = (value: string, field: keyof QuizInputs) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
    setTimeout(goNext, 200);
  };

  const handleConcernToggle = (concern: string) => {
    setAnswers(prev => {
      const current = prev.concerns || [];
      const updated = current.includes(concern)
        ? current.filter(c => c !== concern)
        : [...current, concern];
      return { ...prev, concerns: updated };
    });
  };

  const handleEstimateComplete = () => {
    setShowEnhancedEstimate(false);
    onComplete();
    onOpenChange(false);
  };

  // Get default measurement data
  const effectiveMeasurementData: MeasurementData = measurementData || {
    baseSqft: roofSquares * 100,
    pitchMultiplier: 1.0,
    trueSqft: roofSquares * 100,
    wastePct: 0.10,
    totalWithWaste: roofSquares * 110,
    roofSquares: roofSquares,
    roofComplexity: "moderate"
  };

  const renderQuestionContent = () => {
    switch (step) {
      case "current-roof":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What kind of roof do you currently have?</h3>
            <p className="text-sm text-muted-foreground">Tearing off certain materials can add or lessen the overall cost</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { value: "shingle", label: "Shingle", type: "shingle" as const },
                { value: "metal", label: "Metal", type: "metal" as const },
                { value: "tile", label: "Tile", type: "tile" as const },
                { value: "flat", label: "Flat/TPO", type: "flat" as const },
                { value: "stone-coated", label: "Stone Coated", type: "stone-coated" as const },
                { value: "unknown", label: "Not Sure", type: "shingle" as const }
              ].map(opt => (
                <button key={opt.value} onClick={() => handleSelect(opt.value, "currentRoof")}
                  className={cn("flex flex-col items-center gap-2 p-3 rounded-lg border transition-all hover:border-primary",
                    answers.currentRoof === opt.value && "border-primary bg-primary/5")}>
                  <RoofTypeGraphic type={opt.type} selected={answers.currentRoof === opt.value} />
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case "condition":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What condition is your roof and fascia in?</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "solid", label: "Solid", desc: "No missing shingles, no leaks, minor granule loss" },
                { value: "needs-work", label: "Needs Work", desc: "Cracked tiles, severe granule loss, small bad wood patches" },
                { value: "urgent", label: "Getting Urgent", desc: "Missing tiles, 20+ years old, small leak starting" },
                { value: "emergency", label: "Emergency", desc: "Water coming in, rotted wood, possible mold" }
              ].map(opt => (
                <button key={opt.value} onClick={() => handleSelect(opt.value, "condition")}
                  className={cn("flex flex-col items-center gap-2 p-3 rounded-lg border transition-all hover:border-primary text-center",
                    answers.condition === opt.value && "border-primary bg-primary/5")}>
                  <ConditionGraphic condition={opt.value as any} selected={answers.condition === opt.value} />
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-xs text-muted-foreground">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case "stories":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Is your house 1, 2, or 3 stories?</h3>
            <p className="text-sm text-muted-foreground">Higher roofs require more safety measures and labor time</p>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(num => (
                <button key={num} onClick={() => handleSelect(String(num), "stories" as any)}
                  className={cn("flex flex-col items-center gap-2 p-4 rounded-lg border transition-all hover:border-primary",
                    answers.stories === num && "border-primary bg-primary/5")}>
                  <StoryGraphic stories={num as 1|2|3} selected={answers.stories === num} />
                  <span className="text-lg font-medium">{num} Story</span>
                </button>
              ))}
            </div>
          </div>
        );

      case "hoa":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Do you live in an HOA?</h3>
            <div className="grid grid-cols-2 gap-4">
              {[{ value: true, label: "Yes" }, { value: false, label: "No" }].map(opt => (
                <Button key={String(opt.value)} variant={answers.hasHOA === opt.value ? "default" : "outline"}
                  size="lg" className="h-20 text-lg" onClick={() => { setAnswers(prev => ({ ...prev, hasHOA: opt.value })); goNext(); }}>
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        );

      case "leak":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Do you currently have an active leak?
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[{ value: true, label: "Yes, Need Help!" }, { value: false, label: "No Active Leak" }].map(opt => (
                <Button key={String(opt.value)} variant={answers.hasLeak === opt.value ? (opt.value ? "destructive" : "default") : "outline"}
                  size="lg" className="h-20 text-lg" onClick={() => { setAnswers(prev => ({ ...prev, hasLeak: opt.value })); goNext(); }}>
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        );

      case "concerns":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What is your biggest concern? (Check all that apply)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { value: "insurance", label: "Lower insurance premiums" },
                { value: "storms", label: "Protect house from storms" },
                { value: "appearance", label: "Change appearance" },
                { value: "age-drop", label: "Worried about insurance drop due to age" },
                { value: "value", label: "Increase home value" },
                { value: "cheapest", label: "Cheapest price" }
              ].map(opt => (
                <div key={opt.value} className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                  onClick={() => handleConcernToggle(opt.value)}>
                  <Checkbox checked={answers.concerns?.includes(opt.value)} />
                  <span>{opt.label}</span>
                </div>
              ))}
            </div>
            <Button onClick={goNext} className="w-full mt-4">Continue</Button>
          </div>
        );

      case "desired-roof":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What type of roof are you looking for?</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { value: "shingle", label: "Shingle", type: "shingle" as const },
                { value: "metal", label: "Metal", type: "metal" as const },
                { value: "tile", label: "Tile", type: "tile" as const },
                { value: "stone-coated", label: "Stone Coated", type: "stone-coated" as const },
                { value: "flat", label: "TPO/EPDM/Rubber", type: "flat" as const },
                { value: "cheapest", label: "Whatever is Cheapest", type: "shingle" as const }
              ].map(opt => (
                <button key={opt.value} onClick={() => handleSelect(opt.value, "desiredRoof")}
                  className={cn("flex flex-col items-center gap-2 p-3 rounded-lg border transition-all hover:border-primary",
                    answers.desiredRoof === opt.value && "border-primary bg-primary/5")}>
                  <RoofTypeGraphic type={opt.type} selected={answers.desiredRoof === opt.value} />
                  <span className="text-sm font-medium text-center">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case "underlayment":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What type of underlayment?</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "synthetic", label: "Double Synthetic", type: "synthetic" as const },
                { value: "ice-water", label: "Ice & Water Shield", type: "ice-water" as const },
                { value: "high-temp", label: "High-Temp Shield", type: "high-temp" as const },
                { value: "fire-barrier", label: "Fire Barrier", type: "fire-barrier" as const }
              ].map(opt => (
                <button key={opt.value} onClick={() => handleSelect(opt.value, "underlayment")}
                  className={cn("flex flex-col items-center gap-2 p-3 rounded-lg border transition-all hover:border-primary",
                    answers.underlayment === opt.value && "border-primary bg-primary/5")}>
                  <UnderlaymentGraphic type={opt.type} selected={answers.underlayment === opt.value} />
                  <span className="text-sm font-medium text-center">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case "ventilation":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Ventilation type?</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "ridge", label: "Ridge Vents", desc: "Subtle, good for gable roofs", type: "ridge" as const },
                { value: "off-ridge", label: "Off-Ridge Vents", desc: "Good for hip roofs", type: "off-ridge" as const },
                { value: "solar", label: "Solar Attic Fan", desc: "Better ventilation", type: "solar" as const },
                { value: "attic-breeze", label: "Attic Breeze", desc: "Best, lifetime warranty", type: "attic-breeze" as const }
              ].map(opt => (
                <button key={opt.value} onClick={() => handleSelect(opt.value, "ventilation")}
                  className={cn("flex flex-col items-center gap-2 p-3 rounded-lg border transition-all hover:border-primary",
                    answers.ventilation === opt.value && "border-primary bg-primary/5")}>
                  <VentGraphic type={opt.type} selected={answers.ventilation === opt.value} />
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-xs text-muted-foreground text-center">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case "gutters-current":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Do you currently have gutters?</h3>
            <p className="text-sm text-muted-foreground">If spiked through, they cannot be reattached</p>
            <div className="grid grid-cols-2 gap-4">
              {[{ value: true, label: "Yes" }, { value: false, label: "No" }].map(opt => (
                <Button key={String(opt.value)} variant={answers.hasGutters === opt.value ? "default" : "outline"}
                  size="lg" className="h-20 text-lg" onClick={() => { setAnswers(prev => ({ ...prev, hasGutters: opt.value })); goNext(); }}>
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        );

      case "gutters-want":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Do you want new gutters?</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "unsure", label: "Unsure" }
              ].map(opt => (
                <Button key={opt.value} variant={answers.wantsGutters === opt.value ? "default" : "outline"}
                  size="lg" className="h-16" onClick={() => handleSelect(opt.value, "wantsGutters" as any)}>
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        );

      case "timeline":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">How long do you plan on living in this house?</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "short", label: "1-7 years" },
                { value: "medium", label: "7-15 years" },
                { value: "forever", label: "Forever Home" }
              ].map(opt => (
                <Button key={opt.value} variant={answers.timeInHome === opt.value ? "default" : "outline"}
                  size="lg" className="h-16" onClick={() => handleSelect(opt.value, "timeInHome" as any)}>
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        );

      case "notes":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Any additional notes? (Optional)</h3>
            <Textarea placeholder="Describe any specific concerns, current issues, or questions..."
              value={answers.notes || ""} onChange={(e) => setAnswers(prev => ({ ...prev, notes: e.target.value }))}
              rows={4} />
            <Button onClick={generateRecommendations} className="w-full" size="lg">
              <Sparkles className="mr-2 h-5 w-5" /> Get My Recommendations
            </Button>
          </div>
        );

      case "results":
        // The EnhancedInstantEstimate dialog will be shown instead
        return (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Your Recommendations Are Ready!</h3>
            <p className="text-muted-foreground mb-4">
              View your personalized estimate with Good/Better/Best options
            </p>
            <Button onClick={() => setShowEnhancedEstimate(true)}>
              View Your Estimate
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={open && !showEnhancedEstimate} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Find Your Perfect Roofing Package
            </DialogTitle>
            <DialogDescription>
              {step === "results" ? "Here are your personalized recommendations" : `Question ${currentStepIndex + 1} of ${QUIZ_STEPS.length}`}
            </DialogDescription>
          </DialogHeader>

          {step !== "results" && <Progress value={progress} className="h-2" />}

          <div className="py-4">{renderQuestionContent()}</div>

          {step !== "results" && step !== "concerns" && step !== "notes" && (
            <div className="flex justify-between">
              <Button variant="ghost" onClick={goBack} disabled={currentStepIndex === 0}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            </div>
          )}

          {step === "results" && (
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Adjust Answers
            </Button>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Instant Estimate Dialog */}
      {estimatePackages.length > 0 && (
        <EnhancedInstantEstimate
          open={showEnhancedEstimate}
          onOpenChange={(open) => {
            setShowEnhancedEstimate(open);
            if (!open) {
              // If they close the estimate, go back to results step
              setStep("results");
            }
          }}
          measurements={effectiveMeasurementData}
          propertyAddress={address}
          cityState={cityState}
          packages={estimatePackages}
          quizResponseId={quizResponseIdRef.current}
          onComplete={handleEstimateComplete}
        />
      )}
    </>
  );
}
