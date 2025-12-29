import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, CheckCircle2, ArrowRight, ArrowLeft, Home, Ruler, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RoofingPackage } from "./PackageBrowser";

interface InstantEstimateFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPackage: RoofingPackage | null;
  onRequestQuote: (pkg: RoofingPackage, estimate: EstimateResult) => void;
  onCompareOthers: () => void;
}

interface EstimateResult {
  address: string;
  totalSquares: number;
  confidence: string;
  estimateLow: number;
  estimateHigh: number;
}

type Step = "address" | "analyzing" | "results";

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

export function InstantEstimateFlow({ 
  open, 
  onOpenChange, 
  selectedPackage,
  onRequestQuote,
  onCompareOthers
}: InstantEstimateFlowProps) {
  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [progressMessage, setProgressMessage] = useState("");

  const resetFlow = () => {
    setStep("address");
    setAddress("");
    setEstimate(null);
    setProgressMessage("");
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetFlow();
    }
    onOpenChange(open);
  };

  const analyzeRoof = async () => {
    if (!address.trim() || !selectedPackage) {
      toast.error("Please enter your property address");
      return;
    }

    setStep("analyzing");
    setAnalyzing(true);

    const messages = [
      "Locating property...",
      "Fetching satellite imagery...",
      "Detecting roof boundaries...",
      "Calculating roof area...",
      "Applying pitch factor...",
      "Generating estimate..."
    ];

    let messageIndex = 0;
    const interval = setInterval(() => {
      if (messageIndex < messages.length) {
        setProgressMessage(messages[messageIndex]);
        messageIndex++;
      }
    }, 800);

    try {
      // First geocode the address
      const geocodeResponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=pk.eyJ1IjoiamphbmFjZWsyMSIsImEiOiJjbWdmNHg1YXowNHh1MmlxMmdubjdjdzUzIn0.JKeexzDNUQk8_5cItGJQ2g&country=US&types=address`
      );
      const geocodeData = await geocodeResponse.json();

      if (!geocodeData.features || geocodeData.features.length === 0) {
        throw new Error("Could not find that address. Please try a more specific address.");
      }

      const [longitude, latitude] = geocodeData.features[0].center;

      // Call the AI vision function
      const { data, error } = await supabase.functions.invoke('roof-vision-ai', {
        body: { latitude, longitude, address }
      });

      clearInterval(interval);

      if (error) throw error;

      const estimation = data.estimation;
      const totalSquares = estimation.estimatedSqft / 100;
      
      // Calculate price based on package
      const price = parsePrice(selectedPackage.pricePerSquare);
      const estimateLow = price ? Math.round(price.low * totalSquares) : 0;
      const estimateHigh = price ? Math.round(price.high * totalSquares) : 0;

      setEstimate({
        address,
        totalSquares,
        confidence: estimation.confidence,
        estimateLow,
        estimateHigh
      });

      setStep("results");
    } catch (error: any) {
      clearInterval(interval);
      console.error("Analysis error:", error);
      toast.error(error.message || "Failed to analyze property. Please try again.");
      setStep("address");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!selectedPackage) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        {step === "address" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Get Your Instant Estimate
              </DialogTitle>
              <DialogDescription>
                <span className="font-medium text-foreground">{selectedPackage.name}</span>
                <span className="mx-2">•</span>
                <span className="text-primary font-medium">{selectedPackage.pricePerSquare}/sq</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="address">Property Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street, Miami, FL 33101"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && analyzeRoof()}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your full street address for accurate satellite roof analysis
                </p>
              </div>

              <Button 
                onClick={analyzeRoof} 
                className="w-full" 
                size="lg"
                disabled={!address.trim()}
              >
                Analyze My Roof
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
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
              <h3 className="text-xl font-semibold">Analyzing Your Roof</h3>
              <p className="text-muted-foreground animate-pulse">{progressMessage}</p>
            </div>
          </div>
        )}

        {step === "results" && estimate && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Your Instant Estimate
              </DialogTitle>
              <DialogDescription>
                Based on AI analysis of satellite imagery
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Package Info */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{selectedPackage.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedPackage.pricePerSquare} per square</p>
                    </div>
                    <Badge variant="outline" className="bg-background">
                      {estimate.confidence} Confidence
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Measurement */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Ruler className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">{estimate.totalSquares.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Roof Squares</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <MapPin className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium truncate">{estimate.address}</p>
                    <p className="text-xs text-muted-foreground">Property</p>
                  </CardContent>
                </Card>
              </div>

              {/* Price Estimate */}
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(estimate.estimateLow)} - {formatCurrency(estimate.estimateHigh)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Estimated Total</p>
                </CardContent>
              </Card>

              {/* Key Features */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Package Includes:</p>
                <ul className="grid grid-cols-1 gap-1">
                  {selectedPackage.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  onClick={() => onRequestQuote(selectedPackage, estimate)}
                  size="lg"
                  className="w-full"
                >
                  Request Official Quote
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    handleClose(false);
                    onCompareOthers();
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Compare Other Packages
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
