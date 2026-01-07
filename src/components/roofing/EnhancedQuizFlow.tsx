import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Sparkles, ArrowRight, CheckCircle2, Ruler, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EnhancedMaterialQuiz } from "./EnhancedMaterialQuiz";

interface EnhancedQuizFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

interface MeasurementResult {
  roofSquares: number;
  baseSqft: number;
  trueSqft: number;
  pitchMultiplier: number;
  confidence: string;
}

type FlowStep = "address" | "analyzing" | "measurements" | "quiz";

export function EnhancedQuizFlow({ open, onOpenChange, onComplete }: EnhancedQuizFlowProps) {
  const [step, setStep] = useState<FlowStep>("address");
  const [address, setAddress] = useState("");
  const [cityState, setCityState] = useState("");
  const [measurements, setMeasurements] = useState<MeasurementResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      toast.error("Please enter your property address");
      return;
    }

    setStep("analyzing");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('roof-vision-ai', {
        body: { address }
      });

      if (error) throw error;

      if (data?.roofSquares) {
        setMeasurements({
          roofSquares: data.roofSquares,
          baseSqft: data.baseSqft || data.roofSquares * 100,
          trueSqft: data.trueSqft || data.roofSquares * 100,
          pitchMultiplier: data.pitchMultiplier || 1.0,
          confidence: data.confidence || "high"
        });
        setCityState(data.cityState || "");
        setStep("measurements");
      } else {
        throw new Error("Could not analyze property");
      }
    } catch (error) {
      console.error("Measurement error:", error);
      toast.error("Could not analyze property. Please try again.");
      setStep("address");
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToQuiz = () => {
    setStep("quiz");
  };

  const handleQuizComplete = () => {
    onComplete?.();
    onOpenChange(false);
    // Reset for next use
    setStep("address");
    setAddress("");
    setMeasurements(null);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep("address");
      setAddress("");
      setMeasurements(null);
    }
    onOpenChange(isOpen);
  };

  // Render quiz directly when in quiz step
  if (step === "quiz" && measurements) {
    return (
      <EnhancedMaterialQuiz
        open={open}
        onOpenChange={handleClose}
        roofSquares={measurements.roofSquares}
        address={address}
        cityState={cityState}
        onComplete={handleQuizComplete}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Find Your Perfect Roofing Material
          </DialogTitle>
          <DialogDescription>
            {step === "address" && "Enter your property address to get started"}
            {step === "analyzing" && "Analyzing your roof with AI satellite imagery..."}
            {step === "measurements" && "Great! Here's what we found"}
          </DialogDescription>
        </DialogHeader>

        {step === "address" && (
          <form onSubmit={handleAddressSubmit} className="space-y-4">
            <div>
              <Label htmlFor="address">Property Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  placeholder="123 Main St, City, State ZIP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg">
              Analyze My Roof
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}

        {step === "analyzing" && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <p className="font-medium">Analyzing satellite imagery...</p>
              <p className="text-sm text-muted-foreground">This may take a few seconds</p>
            </div>
          </div>
        )}

        {step === "measurements" && measurements && (
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Home className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{address}</p>
                  {cityState && <p className="text-sm text-muted-foreground">{cityState}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-lg p-3 text-center">
                  <Ruler className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold text-primary">{measurements.roofSquares.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Roof Squares</p>
                </div>
                <div className="bg-background rounded-lg p-3 text-center">
                  <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold text-primary capitalize">{measurements.confidence}</p>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Based on satellite analysis of your property</p>
              <p>Final measurements will be verified during inspection</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("address")} className="flex-1">
                Different Address
              </Button>
              <Button onClick={handleProceedToQuiz} className="flex-1" size="lg">
                <Sparkles className="mr-2 h-4 w-4" />
                Continue to Quiz
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
