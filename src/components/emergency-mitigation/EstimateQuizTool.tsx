import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Droplets, 
  Wind, 
  Home, 
  FlaskConical,
  ArrowRight,
  ArrowLeft,
  Calculator,
  Phone,
  CheckCircle2
} from "lucide-react";

type ServiceType = "mold" | "water" | "storm" | "roof" | "testing";
type AreaSize = "small" | "medium" | "large";
type Severity = "light" | "moderate" | "severe";
type PropertyType = "residential" | "commercial";

interface QuizState {
  step: number;
  serviceType: ServiceType | null;
  areaSize: AreaSize | null;
  severity: Severity | null;
  propertyType: PropertyType | null;
}

export const EstimateQuizTool = () => {
  const [quiz, setQuiz] = useState<QuizState>({
    step: 1,
    serviceType: null,
    areaSize: null,
    severity: null,
    propertyType: null
  });
  const [showResult, setShowResult] = useState(false);

  const services = [
    { id: "mold" as ServiceType, icon: AlertTriangle, label: "Mold Remediation", color: "bg-red-600" },
    { id: "testing" as ServiceType, icon: FlaskConical, label: "Mold Testing", color: "bg-purple-600" },
    { id: "water" as ServiceType, icon: Droplets, label: "Water/Flood Cleanup", color: "bg-blue-600" },
    { id: "storm" as ServiceType, icon: Wind, label: "Storm Damage", color: "bg-slate-700" },
    { id: "roof" as ServiceType, icon: Home, label: "Roof Tarping/Leak", color: "bg-amber-600" }
  ];

  const areaSizes = [
    { id: "small" as AreaSize, label: "Small", description: "< 100 sq ft (bathroom, closet)" },
    { id: "medium" as AreaSize, label: "Medium", description: "100-500 sq ft (1-2 rooms)" },
    { id: "large" as AreaSize, label: "Large", description: "500+ sq ft (large area/whole home)" }
  ];

  const severities = [
    { id: "light" as Severity, label: "Light", description: "Surface mold in spots, minor leaks" },
    { id: "moderate" as Severity, label: "Moderate", description: "Patches of mold, moderate water damage" },
    { id: "severe" as Severity, label: "Severe", description: "Widespread, black mold, major flooding" }
  ];

  const propertyTypes = [
    { id: "residential" as PropertyType, label: "Residential", description: "Home, condo, townhouse" },
    { id: "commercial" as PropertyType, label: "Commercial", description: "Office, retail, warehouse" }
  ];

  const calculateEstimate = () => {
    let low = 0;
    let high = 0;

    // Base calculations by service type
    switch (quiz.serviceType) {
      case "testing":
        low = 300;
        high = 600;
        break;
      case "mold":
        const moldSqFt = quiz.areaSize === "small" ? 50 : quiz.areaSize === "medium" ? 300 : 800;
        const moldRate = quiz.severity === "light" ? 10 : quiz.severity === "moderate" ? 17 : 25;
        low = moldSqFt * (moldRate - 3);
        high = moldSqFt * (moldRate + 3);
        break;
      case "water":
        const waterSqFt = quiz.areaSize === "small" ? 100 : quiz.areaSize === "medium" ? 400 : 1000;
        const waterRate = quiz.severity === "light" ? 3 : quiz.severity === "moderate" ? 5 : 7;
        low = waterSqFt * (waterRate - 1);
        high = waterSqFt * (waterRate + 1);
        break;
      case "storm":
        low = quiz.areaSize === "small" ? 2000 : quiz.areaSize === "medium" ? 5000 : 10000;
        high = quiz.areaSize === "small" ? 5000 : quiz.areaSize === "medium" ? 10000 : 25000;
        if (quiz.severity === "severe") {
          low *= 1.5;
          high *= 1.5;
        }
        break;
      case "roof":
        const roofSqFt = quiz.areaSize === "small" ? 200 : quiz.areaSize === "medium" ? 600 : 1200;
        const roofRate = quiz.severity === "light" ? 0.70 : quiz.severity === "moderate" ? 1.50 : 2.50;
        low = roofSqFt * (roofRate - 0.3);
        high = roofSqFt * (roofRate + 0.5);
        break;
    }

    // Commercial markup
    if (quiz.propertyType === "commercial") {
      low *= 1.2;
      high *= 1.3;
    }

    return {
      low: Math.round(low / 100) * 100,
      high: Math.round(high / 100) * 100
    };
  };

  const handleNext = () => {
    if (quiz.step < 4) {
      setQuiz(prev => ({ ...prev, step: prev.step + 1 }));
    } else {
      setShowResult(true);
    }
  };

  const handleBack = () => {
    if (quiz.step > 1) {
      setQuiz(prev => ({ ...prev, step: prev.step - 1 }));
    }
  };

  const resetQuiz = () => {
    setQuiz({
      step: 1,
      serviceType: null,
      areaSize: null,
      severity: null,
      propertyType: null
    });
    setShowResult(false);
  };

  const canProceed = () => {
    switch (quiz.step) {
      case 1: return quiz.serviceType !== null;
      case 2: return quiz.areaSize !== null || quiz.serviceType === "testing";
      case 3: return quiz.severity !== null || quiz.serviceType === "testing";
      case 4: return quiz.propertyType !== null;
      default: return false;
    }
  };

  const progress = (quiz.step / 4) * 100;

  if (showResult) {
    const estimate = calculateEstimate();
    return (
      <section id="estimate" className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="container max-w-2xl">
          <div className="bg-white text-slate-900 rounded-2xl p-8 md:p-12 text-center shadow-2xl">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Your Estimated Cost
            </h3>
            
            <div className="text-4xl md:text-5xl font-bold text-green-600 mb-4">
              ${estimate.low.toLocaleString()} - ${estimate.high.toLocaleString()}
            </div>
            
            <p className="text-slate-600 mb-6">
              This is a preliminary ballpark based on your input. A free on-site inspection 
              will provide a detailed, written estimate.
            </p>

            {quiz.serviceType !== "testing" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Good news:</strong> Events like yours are often covered by insurance. 
                  We'll help you through the claims process.
                </p>
              </div>
            )}

            {quiz.severity === "severe" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  <strong>Urgent:</strong> This level of damage can worsen quickly. 
                  We recommend immediate emergency service.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:2149982879"
                className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold transition-colors"
              >
                <Phone className="h-5 w-5" />
                Call Now
              </a>
              <Button
                onClick={resetQuiz}
                variant="outline"
                size="lg"
                className="px-8"
              >
                Start Over
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="estimate" className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="container max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Calculator className="h-4 w-4" />
            Interactive Estimate Tool
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Will It Cost?
          </h2>
          <p className="text-slate-400">
            Use our quick 1-minute quiz to get an instant ballpark estimate
          </p>
        </div>

        <div className="bg-white text-slate-900 rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="mb-6">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Step {quiz.step} of 4</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step 1: Service Type */}
          {quiz.step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold">What issue do you need help with?</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setQuiz(prev => ({ ...prev, serviceType: service.id }))}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      quiz.serviceType === service.id
                        ? "border-red-600 bg-red-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className={`${service.color} inline-flex p-2 rounded-lg mb-2`}>
                      <service.icon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm font-medium">{service.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Area Size */}
          {quiz.step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold">
                {quiz.serviceType === "testing" 
                  ? "What size is the property?" 
                  : "How large is the affected area?"}
              </h3>
              <div className="space-y-3">
                {areaSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setQuiz(prev => ({ ...prev, areaSize: size.id }))}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      quiz.areaSize === size.id
                        ? "border-red-600 bg-red-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className="font-semibold">{size.label}</p>
                    <p className="text-sm text-slate-600">{size.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Severity */}
          {quiz.step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold">How severe is the damage?</h3>
              <div className="space-y-3">
                {severities.map((sev) => (
                  <button
                    key={sev.id}
                    onClick={() => setQuiz(prev => ({ ...prev, severity: sev.id }))}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      quiz.severity === sev.id
                        ? "border-red-600 bg-red-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className="font-semibold">{sev.label}</p>
                    <p className="text-sm text-slate-600">{sev.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Property Type */}
          {quiz.step === 4 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Is this a home or commercial building?</h3>
              <div className="grid grid-cols-2 gap-4">
                {propertyTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setQuiz(prev => ({ ...prev, propertyType: type.id }))}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      quiz.propertyType === type.id
                        ? "border-red-600 bg-red-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className="font-semibold">{type.label}</p>
                    <p className="text-sm text-slate-600">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              onClick={handleBack}
              variant="outline"
              disabled={quiz.step === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-red-600 hover:bg-red-700 gap-2"
            >
              {quiz.step === 4 ? "Get Estimate" : "Next"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
