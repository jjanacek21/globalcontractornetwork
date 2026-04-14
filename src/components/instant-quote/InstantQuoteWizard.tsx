import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import gcnLogo from "@/assets/gcn-logo.jpg";
import { PropertyTypeStep } from "./PropertyTypeStep";
import { ServiceTypeStep } from "./ServiceTypeStep";
import { RoofingWizardSteps } from "./RoofingWizardSteps";
import { WindowsWizardSteps } from "./WindowsWizardSteps";
import { EmergencyWizardSteps } from "./EmergencyWizardSteps";
import { LandscapingWizardSteps } from "./LandscapingWizardSteps";
import { CleaningWizardSteps } from "./CleaningWizardSteps";
import { PhotoAnalysisStep } from "./PhotoAnalysisStep";
import { ResultsStep } from "./ResultsStep";

export type PropertyType = "residential" | "commercial";
export type ServiceType = "roofing" | "windows" | "emergency" | "landscaping" | "cleaning";
export type WizardStep = "property-type" | "service-type" | "trade-wizard" | "photo-analysis" | "results";

export interface TradeAnswers {
  [key: string]: string | number | boolean | string[];
}

export interface PhotoAnalysisResult {
  photoUrl: string;
  material: string;
  condition: string;
  issues: string[];
  recommendations: string[];
}




export function InstantQuoteWizard() {
  const [step, setStep] = useState<WizardStep>("property-type");
  const [propertyType, setPropertyType] = useState<PropertyType | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [tradeAnswers, setTradeAnswers] = useState<TradeAnswers>({});
  const [photoResults, setPhotoResults] = useState<PhotoAnalysisResult[]>([]);
  

  const handlePropertyTypeSelect = (type: PropertyType) => {
    setPropertyType(type);
    setStep("service-type");
  };

  const handleServiceTypeSelect = (type: ServiceType) => {
    setServiceType(type);
    setStep("trade-wizard");
  };

  const handleTradeComplete = (answers: TradeAnswers) => {
    setTradeAnswers(answers);
    setStep("photo-analysis");
  };

  const handlePhotosComplete = (results: PhotoAnalysisResult[]) => {
    setPhotoResults(results);
    setStep("results");
  };

  const handleBack = () => {
    switch (step) {
      case "service-type":
        setStep("property-type");
        break;
      case "trade-wizard":
        setStep("service-type");
        break;
      case "photo-analysis":
        setStep("trade-wizard");
        break;
      case "results":
        setStep("photo-analysis");
        break;
    }
  };

  const renderTradeWizard = () => {
    const props = {
      propertyType: propertyType!,
      onComplete: handleTradeComplete,
      onBack: () => setStep("service-type"),
    };

    switch (serviceType) {
      case "roofing":
        return <RoofingWizardSteps {...props} />;
      case "windows":
        return <WindowsWizardSteps {...props} />;
      case "emergency":
        return <EmergencyWizardSteps {...props} />;
      case "landscaping":
        return <LandscapingWizardSteps {...props} />;
      case "cleaning":
        return <CleaningWizardSteps {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={gcnLogo} alt="GCN" className="h-8 w-8 rounded-lg" />
            <span className="font-bold text-lg">Instant Quote</span>
          </div>
          <Link
            to="/member/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </header>

      {/* Progress indicator */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <span className={step === "property-type" ? "text-primary font-medium" : ""}>Property Type</span>
          <span>→</span>
          <span className={step === "service-type" ? "text-primary font-medium" : ""}>Service</span>
          <span>→</span>
          <span className={step === "trade-wizard" ? "text-primary font-medium" : ""}>Details</span>
          <span>→</span>
          <span className={step === "photo-analysis" ? "text-primary font-medium" : ""}>Photo Analysis</span>
          <span>→</span>
          <span className={step === "results" ? "text-primary font-medium" : ""}>Results</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {step === "property-type" && (
          <PropertyTypeStep onSelect={handlePropertyTypeSelect} />
        )}
        {step === "service-type" && propertyType && (
          <ServiceTypeStep
            propertyType={propertyType}
            onSelect={handleServiceTypeSelect}
            onBack={() => setStep("property-type")}
          />
        )}
        {step === "trade-wizard" && renderTradeWizard()}
        {step === "photo-analysis" && (
          <PhotoAnalysisStep
            serviceType={serviceType!}
            propertyType={propertyType!}
            tradeAnswers={tradeAnswers}
            onComplete={handlePhotosComplete}
            onSkip={() => setStep("results")}
            onBack={handleBack}
          />
        )}
        {step === "results" && (
          <ResultsStep
            propertyType={propertyType!}
            serviceType={serviceType!}
            tradeAnswers={tradeAnswers}
            photoResults={photoResults}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}
