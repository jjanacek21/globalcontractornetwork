import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Wrench, Phone, DollarSign, Clock, Hammer, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { PropertyType, ServiceType, TradeAnswers, PhotoAnalysisResult } from "./InstantQuoteWizard";

interface Props {
  propertyType: PropertyType;
  serviceType: ServiceType;
  tradeAnswers: TradeAnswers;
  photoResults: PhotoAnalysisResult[];
  onBack: () => void;
}

interface QuoteData {
  summary: string;
  estimatedCostLow: number;
  estimatedCostHigh: number;
  diy: {
    steps: string[];
    materialsCost: number;
    timeEstimate: string;
    toolsNeeded: string[];
  };
  professional: {
    scopeOfWork: string;
    timeline: string;
  };
}

export function ResultsStep({ propertyType, serviceType, tradeAnswers, photoResults, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"diy" | "professional">("diy");
  const navigate = useNavigate();

  useEffect(() => {
    generateQuote();
  }, []);

  const generateQuote = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("instant-quote-ai", {
        body: {
          action: "generate-quote",
          propertyType,
          serviceType,
          tradeAnswers,
          photoAnalysis: photoResults,
        },
      });

      if (fnError) throw new Error(fnError.message);
      setQuoteData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate quote");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto pt-20 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
        <h2 className="text-xl font-bold mb-2">Generating Your Instant Quote...</h2>
        <p className="text-muted-foreground">Our AI is analyzing your project details and photos to create a comprehensive estimate with DIY instructions.</p>
      </div>
    );
  }

  if (error || !quoteData) {
    return (
      <div className="max-w-3xl mx-auto pt-10 text-center">
        <p className="text-destructive mb-4">{error || "Something went wrong"}</p>
        <Button onClick={generateQuote}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Your Instant Quote</h1>
        <p className="text-muted-foreground capitalize">{propertyType} • {serviceType}</p>
      </div>

      {/* Estimate range */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Estimated Cost Range</p>
          <p className="text-3xl font-bold text-primary">
            ${quoteData.estimatedCostLow.toLocaleString()} — ${quoteData.estimatedCostHigh.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-lg">Project Summary</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground whitespace-pre-line">{quoteData.summary}</p></CardContent>
      </Card>

      {/* Photo analysis results */}
      {photoResults.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg">📸 Photo Analysis Report</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {photoResults.map((photo, i) => (
              <div key={i} className="flex gap-4 p-3 border rounded-xl">
                <img src={photo.photoUrl} alt={`Analysis ${i + 1}`} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Material:</span> {photo.material}</p>
                  <p><span className="font-medium">Condition:</span> {photo.condition}</p>
                  {photo.issues.length > 0 && <p className="text-destructive">⚠️ {photo.issues.join(", ")}</p>}
                  {photo.recommendations.length > 0 && <p className="text-muted-foreground">💡 {photo.recommendations.join(", ")}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* DIY vs Professional toggle */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={activeTab === "diy" ? "default" : "outline"}
          onClick={() => setActiveTab("diy")}
          className="flex-1 gap-2"
        >
          <Wrench className="h-4 w-4" /> DIY Path
        </Button>
        <Button
          variant={activeTab === "professional" ? "default" : "outline"}
          onClick={() => setActiveTab("professional")}
          className="flex-1 gap-2"
        >
          <Phone className="h-4 w-4" /> Call a Professional
        </Button>
      </div>

      {activeTab === "diy" && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wrench className="h-5 w-5" /> DIY Instructions</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {/* Materials cost */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Estimated Materials Cost</p>
                <p className="text-lg font-bold text-primary">${quoteData.diy.materialsCost.toLocaleString()}</p>
              </div>
            </div>

            {/* Time estimate */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Estimated Time</p>
                <p className="text-muted-foreground">{quoteData.diy.timeEstimate}</p>
              </div>
            </div>

            {/* Tools needed */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Hammer className="h-5 w-5 text-primary" />
                <p className="font-medium">Tools Needed</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {quoteData.diy.toolsNeeded.map((tool, i) => (
                  <span key={i} className="px-3 py-1 bg-muted rounded-full text-sm">{tool}</span>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div>
              <p className="font-medium mb-3">Step-by-Step Instructions</p>
              <ol className="space-y-3">
                {quoteData.diy.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">{i + 1}</span>
                    <p className="text-sm text-muted-foreground pt-1">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "professional" && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Phone className="h-5 w-5" /> Professional Service</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="font-medium mb-1">Scope of Work</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{quoteData.professional.scopeOfWork}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="font-medium mb-1">Estimated Timeline</p>
              <p className="text-sm text-muted-foreground">{quoteData.professional.timeline}</p>
            </div>
            <Button onClick={() => navigate("/directory")} className="w-full h-12 gap-2">
              <CheckCircle2 className="h-4 w-4" /> Find a Contractor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
