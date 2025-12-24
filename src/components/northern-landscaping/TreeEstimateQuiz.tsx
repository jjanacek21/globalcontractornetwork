import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  TreeDeciduous,
  Scissors,
  CircleDot,
  HelpCircle,
  Home,
  Zap,
  MapPin,
  Truck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Phone,
  RotateCcw,
} from "lucide-react";

interface QuizState {
  serviceType: string;
  treeSize: string;
  obstacles: string[];
  addOns: string[];
}

const initialState: QuizState = {
  serviceType: "",
  treeSize: "",
  obstacles: [],
  addOns: [],
};

const serviceTypes = [
  {
    id: "removal",
    label: "Tree Removal",
    icon: TreeDeciduous,
    description: "Complete tree removal",
  },
  {
    id: "trimming",
    label: "Tree Trimming",
    icon: Scissors,
    description: "Pruning & shaping",
  },
  {
    id: "stump",
    label: "Stump Grinding",
    icon: CircleDot,
    description: "Remove existing stump",
  },
  {
    id: "other",
    label: "Other Service",
    icon: HelpCircle,
    description: "Landscaping, etc.",
  },
];

const treeSizes = [
  {
    id: "small",
    label: "Small",
    description: "Up to 30 ft (1-story height)",
    visual: "🏠 Tree at roof level",
  },
  {
    id: "medium",
    label: "Medium",
    description: "30-60 ft (2-story height)",
    visual: "🏢 Tree above roof",
  },
  {
    id: "large",
    label: "Large",
    description: "Over 60 ft (very tall)",
    visual: "🏗️ Towering tree",
  },
];

const obstacleOptions = [
  {
    id: "structure",
    label: "Near a Structure",
    icon: Home,
    description: "Close to house/building",
  },
  {
    id: "powerlines",
    label: "Near Power Lines",
    icon: Zap,
    description: "Utility lines nearby",
  },
  {
    id: "access",
    label: "Hard to Access",
    icon: MapPin,
    description: "Backyard, gate, etc.",
  },
  {
    id: "fallen",
    label: "Already Fallen",
    icon: AlertTriangle,
    description: "Tree is down",
  },
];

const addOnOptions = [
  {
    id: "stumpRemoval",
    label: "Stump Removal",
    icon: CircleDot,
    price: "+$150-$400",
  },
  {
    id: "debrisHauling",
    label: "Debris Hauling",
    icon: Truck,
    price: "+$75-$150",
  },
  {
    id: "emergency",
    label: "Emergency Service",
    icon: AlertTriangle,
    price: "+50%",
  },
];

const TreeEstimateQuiz = () => {
  const [step, setStep] = useState(1);
  const [quiz, setQuiz] = useState<QuizState>(initialState);
  const [showResult, setShowResult] = useState(false);

  const calculateEstimate = (): { low: number; high: number } => {
    let baseLow = 0;
    let baseHigh = 0;

    // Base pricing by service type and size
    if (quiz.serviceType === "removal") {
      if (quiz.treeSize === "small") {
        baseLow = 300;
        baseHigh = 600;
      } else if (quiz.treeSize === "medium") {
        baseLow = 600;
        baseHigh = 1200;
      } else {
        baseLow = 1200;
        baseHigh = 3000;
      }
    } else if (quiz.serviceType === "trimming") {
      if (quiz.treeSize === "small") {
        baseLow = 100;
        baseHigh = 300;
      } else if (quiz.treeSize === "medium") {
        baseLow = 250;
        baseHigh = 600;
      } else {
        baseLow = 500;
        baseHigh = 1500;
      }
    } else if (quiz.serviceType === "stump") {
      if (quiz.treeSize === "small") {
        baseLow = 75;
        baseHigh = 200;
      } else if (quiz.treeSize === "medium") {
        baseLow = 150;
        baseHigh = 350;
      } else {
        baseLow = 300;
        baseHigh = 500;
      }
    } else {
      // Other services - request consultation
      baseLow = 200;
      baseHigh = 1000;
    }

    // Apply obstacle multipliers
    let multiplier = 1;
    if (quiz.obstacles.includes("structure")) multiplier += 0.2;
    if (quiz.obstacles.includes("powerlines")) multiplier += 0.25;
    if (quiz.obstacles.includes("access")) multiplier += 0.15;
    if (quiz.obstacles.includes("fallen")) multiplier -= 0.3; // Discount for fallen

    baseLow = Math.round(baseLow * multiplier);
    baseHigh = Math.round(baseHigh * multiplier);

    // Add-ons
    if (quiz.addOns.includes("stumpRemoval") && quiz.serviceType !== "stump") {
      baseLow += 150;
      baseHigh += 400;
    }
    if (quiz.addOns.includes("debrisHauling")) {
      baseLow += 75;
      baseHigh += 150;
    }
    if (quiz.addOns.includes("emergency")) {
      baseLow = Math.round(baseLow * 1.5);
      baseHigh = Math.round(baseHigh * 1.5);
    }

    return { low: baseLow, high: baseHigh };
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const resetQuiz = () => {
    setQuiz(initialState);
    setStep(1);
    setShowResult(false);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return quiz.serviceType !== "";
      case 2:
        return quiz.treeSize !== "" || quiz.serviceType === "other";
      case 3:
        return true; // Obstacles are optional
      case 4:
        return true; // Add-ons are optional
      default:
        return false;
    }
  };

  const toggleObstacle = (id: string) => {
    setQuiz((prev) => ({
      ...prev,
      obstacles: prev.obstacles.includes(id)
        ? prev.obstacles.filter((o) => o !== id)
        : [...prev.obstacles, id],
    }));
  };

  const toggleAddOn = (id: string) => {
    setQuiz((prev) => ({
      ...prev,
      addOns: prev.addOns.includes(id)
        ? prev.addOns.filter((a) => a !== id)
        : [...prev.addOns, id],
    }));
  };

  const estimate = calculateEstimate();

  if (showResult) {
    return (
      <section id="estimate" className="py-20 bg-green-900">
        <div className="container max-w-2xl">
          <Card className="p-8 md:p-12 bg-white shadow-2xl">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mx-auto">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-green-900">
                Your Estimated Price Range
              </h2>

              <div className="bg-green-50 rounded-2xl p-8">
                <p className="text-5xl md:text-6xl font-bold text-green-700">
                  ${estimate.low.toLocaleString()} – {estimate.high.toLocaleString()}
                </p>
                <p className="text-muted-foreground mt-2">
                  Based on your selections
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
                <p className="font-semibold text-green-900">Estimate includes:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Fully insured, licensed professionals</li>
                  <li>• ISA Certified Arborist consultation</li>
                  {quiz.addOns.includes("debrisHauling") && (
                    <li>• Complete debris removal & cleanup</li>
                  )}
                  {quiz.addOns.includes("stumpRemoval") && (
                    <li>• Stump grinding included</li>
                  )}
                  {quiz.addOns.includes("emergency") && (
                    <li>• Priority emergency response</li>
                  )}
                </ul>
              </div>

              <p className="text-sm text-muted-foreground">
                *Final pricing confirmed with free on-site consultation. No
                obligation.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <a href="tel:+12149982879">
                  <Button size="lg" className="bg-green-700 hover:bg-green-800 gap-2 w-full sm:w-auto">
                    <Phone className="h-5 w-5" />
                    Call Now: (214) 998-2879
                  </Button>
                </a>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={resetQuiz}
                  className="gap-2 border-green-700 text-green-700 hover:bg-green-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Start Over
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="estimate" className="py-20 bg-green-900">
      <div className="container max-w-3xl">
        <div className="text-center mb-10">
          <span className="text-green-400 font-semibold text-sm uppercase tracking-wide">
            Instant Estimate
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">
            Get Your Price in 60 Seconds
          </h2>
          <p className="text-green-200">
            Answer 4 quick questions for a ballpark estimate – no contact info
            required.
          </p>
        </div>

        <Card className="p-6 md:p-10 bg-white shadow-2xl">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {step} of 4</span>
              <span>{Math.round((step / 4) * 100)}% Complete</span>
            </div>
            <Progress value={(step / 4) * 100} className="h-2" />
          </div>

          {/* Step 1: Service Type */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-green-900">
                What tree service do you need?
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {serviceTypes.map((service) => (
                  <button
                    key={service.id}
                    onClick={() =>
                      setQuiz((prev) => ({ ...prev, serviceType: service.id }))
                    }
                    className={`p-5 rounded-xl border-2 text-left transition-all ${
                      quiz.serviceType === service.id
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <service.icon
                      className={`h-8 w-8 mb-3 ${
                        quiz.serviceType === service.id
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    />
                    <p className="font-semibold text-green-900">{service.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {service.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Tree Size */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-green-900">
                How large is the tree?
              </h3>
              {quiz.serviceType === "other" ? (
                <div className="bg-green-50 rounded-lg p-6 text-center">
                  <p className="text-green-800">
                    For landscaping and other services, we'll provide a custom quote
                    based on your specific needs. Skip to the next step!
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {treeSizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() =>
                        setQuiz((prev) => ({ ...prev, treeSize: size.id }))
                      }
                      className={`p-5 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                        quiz.treeSize === size.id
                          ? "border-green-600 bg-green-50"
                          : "border-gray-200 hover:border-green-300"
                      }`}
                    >
                      <div className="text-4xl">{size.visual.split(" ")[0]}</div>
                      <div>
                        <p className="font-semibold text-green-900 text-lg">
                          {size.label}
                        </p>
                        <p className="text-muted-foreground">{size.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Obstacles */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-green-900">
                Any obstacles or challenges? (Select all that apply)
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {obstacleOptions.map((obstacle) => (
                  <button
                    key={obstacle.id}
                    onClick={() => toggleObstacle(obstacle.id)}
                    className={`p-5 rounded-xl border-2 text-left transition-all ${
                      quiz.obstacles.includes(obstacle.id)
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <obstacle.icon
                      className={`h-6 w-6 mb-2 ${
                        quiz.obstacles.includes(obstacle.id)
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    />
                    <p className="font-semibold text-green-900">{obstacle.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {obstacle.description}
                    </p>
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground text-center">
                If none apply, just click "Next" to continue.
              </p>
            </div>
          )}

          {/* Step 4: Add-ons */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-green-900">
                Any additional services? (Optional)
              </h3>
              <div className="space-y-4">
                {addOnOptions.map((addon) => {
                  // Hide stump removal if they're already getting stump service
                  if (addon.id === "stumpRemoval" && quiz.serviceType === "stump") {
                    return null;
                  }
                  return (
                    <button
                      key={addon.id}
                      onClick={() => toggleAddOn(addon.id)}
                      className={`w-full p-5 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                        quiz.addOns.includes(addon.id)
                          ? "border-green-600 bg-green-50"
                          : "border-gray-200 hover:border-green-300"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <addon.icon
                          className={`h-6 w-6 ${
                            quiz.addOns.includes(addon.id)
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        />
                        <span className="font-semibold text-green-900">
                          {addon.label}
                        </span>
                      </div>
                      <span className="text-green-600 font-medium">
                        {addon.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-10">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <div />
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-green-700 hover:bg-green-800 gap-2"
            >
              {step === 4 ? "Get Estimate" : "Next"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default TreeEstimateQuiz;
