import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { SalesAvatar } from "./SalesAvatar";
import { SchedulingDialog } from "./SchedulingDialog";
import { cn } from "@/lib/utils";
import { ArrowRight, Video, Users, Ruler, CheckCircle2, Sparkles } from "lucide-react";

interface Question {
  id: string;
  question: string;
  options?: { label: string; value: string; icon: string }[];
  type?: "input";
  placeholder?: string;
  inputType?: string;
}

const questions: Question[] = [
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
  },
  {
    id: "zipCode",
    question: "Perfect! What's your zip code so we can connect you with a local contractor?",
    type: "input",
    placeholder: "Enter zip code (e.g., 33301)",
    inputType: "text"
  },
  {
    id: "sqft",
    question: "Last question! What's your home's approximate square footage?",
    type: "input",
    placeholder: "e.g., 2000",
    inputType: "number"
  }
];

// Package recommendation logic
const getRecommendedPackage = (answers: Record<string, string>) => {
  const { roofType, priority, timeline, budget } = answers;

  // Tile roof recommendations
  if (roofType === "tile") {
    return budget === "premium" 
      ? { name: "Tile+ Roof Package", pricePerSquare: 1050 }
      : { name: "Tile Roof Package", pricePerSquare: 950 };
  }

  // Metal roof recommendations
  if (roofType === "metal" || priority === "durability") {
    if (budget === "premium") {
      return { name: "Ultimate Roof Package", pricePerSquare: 1600 };
    } else if (budget === "mid") {
      return { name: "Platinum Roof Package", pricePerSquare: 1100 };
    } else {
      return { name: "The Blue Collar Special", pricePerSquare: 860 };
    }
  }

  // Flat roof
  if (roofType === "flat") {
    return { name: "Roof Refresh", pricePerSquare: 500 };
  }

  // Shingle recommendations based on budget and timeline
  if (budget === "premium" || timeline === "long") {
    return { name: "Gold Roof Package", pricePerSquare: 825 };
  } else if (budget === "mid" || timeline === "medium") {
    return { name: "Silver Roof Package", pricePerSquare: 712 };
  } else {
    return { name: "Bronze Roof Package", pricePerSquare: 612 };
  }
};

interface InteractiveSalesAssistantProps {
  onComplete: () => void;
  initialSqft?: number;
  initialAddress?: string;
}

export const InteractiveSalesAssistant = ({ onComplete, initialSqft, initialAddress }: InteractiveSalesAssistantProps) => {
  // Filter out sqft question if we already have the measurement
  const filteredQuestions = initialSqft 
    ? questions.filter(q => q.id !== "sqft")
    : questions;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(
    initialSqft ? { sqft: initialSqft.toString() } : {}
  );
  const [inputValue, setInputValue] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [schedulingOpen, setSchedulingOpen] = useState(false);
  const [appointmentType, setAppointmentType] = useState<"zoom" | "in_person">("zoom");
  const [appointmentScheduled, setAppointmentScheduled] = useState(false);

  const currentQuestion = filteredQuestions[currentStep];
  const progress = ((currentStep) / filteredQuestions.length) * 100;

  useEffect(() => {
    // Simulate speaking animation
    setIsSpeaking(true);
    const timer = setTimeout(() => setIsSpeaking(false), 2000);
    return () => clearTimeout(timer);
  }, [currentStep, showResult]);

  const handleOptionClick = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
    
    if (currentStep < filteredQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleInputSubmit = () => {
    if (!inputValue.trim()) return;
    
    setAnswers({ ...answers, [currentQuestion.id]: inputValue });
    setInputValue("");
    
    if (currentStep < filteredQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleSchedule = (type: "zoom" | "in_person") => {
    setAppointmentType(type);
    setSchedulingOpen(true);
  };

  const recommendedPackage = getRecommendedPackage(answers);
  const sqft = parseInt(answers.sqft) || 2000;
  const estimatedSquares = sqft / 100;
  const estimatedPrice = Math.round(estimatedSquares * recommendedPackage.pricePerSquare);

  if (showResult) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            {/* Avatar and Result Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <SalesAvatar speaking={isSpeaking} className="mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                {appointmentScheduled ? "You're All Set!" : "Perfect Match Found!"}
              </h2>
              <p className="text-muted-foreground">
                {appointmentScheduled 
                  ? "Your consultation is scheduled. Now get your detailed measurement!"
                  : "Based on your answers, here's my recommendation:"
                }
              </p>
            </div>

            {/* Recommended Package */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">Recommended Package</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">{recommendedPackage.name}</h3>
              <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Estimated Cost</span>
                  <p className="text-3xl font-bold text-primary">${estimatedPrice.toLocaleString()}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  ({estimatedSquares.toFixed(1)} squares × ${recommendedPackage.pricePerSquare}/sq)
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * Final price may vary based on inspection and site conditions
              </p>
            </div>

            {!appointmentScheduled ? (
              <>
                {/* Scheduling Options */}
                <div className="space-y-3 mb-6">
                  <p className="font-medium text-center">Schedule a consultation with our expert:</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Button
                      size="lg"
                      onClick={() => handleSchedule("zoom")}
                      className="h-auto py-4 flex-col gap-2"
                    >
                      <Video className="h-6 w-6" />
                      <span>Zoom Consultation</span>
                      <span className="text-xs opacity-80">Virtual meeting from home</span>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => handleSchedule("in_person")}
                      className="h-auto py-4 flex-col gap-2"
                    >
                      <Users className="h-6 w-6" />
                      <span>In-Person Visit</span>
                      <span className="text-xs opacity-80">Expert visits your property</span>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-700">Appointment Confirmed!</p>
                  <p className="text-sm text-green-600">Check your email for details</p>
                </div>
              </div>
            )}

            {/* Measurement Tool CTA */}
            <Button
              size="lg"
              variant={appointmentScheduled ? "default" : "secondary"}
              onClick={onComplete}
              className="w-full"
            >
              <Ruler className="mr-2 h-5 w-5" />
              Get Your Detailed Roof Measurement
            </Button>
          </CardContent>
        </Card>

        {/* Scheduling Dialog */}
        <SchedulingDialog
          open={schedulingOpen}
          onOpenChange={setSchedulingOpen}
          appointmentType={appointmentType}
          consultationData={{
            roofType: answers.roofType || "",
            priority: answers.priority || "",
            timeline: answers.timeline || "",
            budget: answers.budget || "",
            zipCode: answers.zipCode || "",
            sqft: parseInt(answers.sqft) || 0,
            recommendedPackage: recommendedPackage.name,
            estimatedPrice
          }}
          onComplete={() => setAppointmentScheduled(true)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep + 1} of {filteredQuestions.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            {initialSqft && (
              <div className="mt-2 text-xs text-primary flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Using AI measurement: {initialSqft.toLocaleString()} sq ft
              </div>
            )}
          </div>

          {/* Avatar and Question */}
          <div className="flex flex-col items-center text-center mb-8">
            <SalesAvatar speaking={isSpeaking} className="mb-6" />
            
            <div className="bg-muted/50 rounded-2xl rounded-tl-sm p-4 max-w-md">
              <p className="text-lg">{currentQuestion.question}</p>
            </div>
          </div>

          {/* Options or Input */}
          {currentQuestion.type === "input" ? (
            <div className="space-y-4">
              <Input
                type={currentQuestion.inputType}
                placeholder={currentQuestion.placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInputSubmit()}
                className="text-lg h-12 text-center"
                autoFocus
              />
              <Button
                onClick={handleInputSubmit}
                disabled={!inputValue.trim()}
                className="w-full h-12"
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currentQuestion.options?.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  onClick={() => handleOptionClick(option.value)}
                  className={cn(
                    "h-auto py-4 flex-col gap-2 hover:border-primary hover:bg-primary/5 transition-all",
                    answers[currentQuestion.id] === option.value && "border-primary bg-primary/10"
                  )}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
