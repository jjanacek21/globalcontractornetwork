import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Sparkles } from "lucide-react";
import { SpinWheel } from "./SpinWheel";
import { DiscountClaimForm } from "./DiscountClaimForm";
import { ThankYouScreen } from "./ThankYouScreen";
import { MeasurementWizard } from "@/components/shared/MeasurementWizard";
import { MeasurementResult } from "@/lib/roofMeasurements";

const COATING_PRICES = {
  acrylic: { low: 2.0, high: 3.0, name: "Acrylic" },
  "acrylic-base": { low: 3.25, high: 4.0, name: "Acrylic + Base" },
  elastomeric: { low: 3.0, high: 4.0, name: "Elastomeric" },
  silicone: { low: 3.75, high: 4.5, name: "Silicone" },
  "silicone-base": { low: 4.5, high: 7.0, name: "Silicone + Base" },
  polyurethane: { low: 4.5, high: 7.0, name: "Polyurethane" },
  rubber: { low: 6.0, high: 8.0, name: "Rubber" },
};

interface InstantQuoteToolProps {
  selectedCoatingType?: string;
  propertyType?: string;
}

export const InstantQuoteTool = ({ selectedCoatingType, propertyType }: InstantQuoteToolProps) => {
  // Coating selection state
  const [roofType, setRoofType] = useState<string>("");
  const [coatingType, setCoatingType] = useState<string>("");
  
  // Measurement state
  const [measurementResult, setMeasurementResult] = useState<MeasurementResult | null>(null);
  const [estimateLow, setEstimateLow] = useState<number>(0);
  const [estimateHigh, setEstimateHigh] = useState<number>(0);
  const [showEstimate, setShowEstimate] = useState(false);
  
  // SpinWheel and discount state
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [submittedLead, setSubmittedLead] = useState<any>(null);

  // Update coating type when selectedCoatingType prop changes
  useEffect(() => {
    if (selectedCoatingType) {
      setCoatingType(selectedCoatingType);
    }
  }, [selectedCoatingType]);

  // Calculate estimate when measurement or coating changes
  useEffect(() => {
    if (measurementResult && coatingType) {
      const pricing = COATING_PRICES[coatingType as keyof typeof COATING_PRICES];
      if (pricing) {
        const totalSqft = measurementResult.totalWithWaste;
        setEstimateLow(Math.round(totalSqft * pricing.low));
        setEstimateHigh(Math.round(totalSqft * pricing.high));
        setShowEstimate(true);
      }
    } else {
      setShowEstimate(false);
    }
  }, [measurementResult, coatingType]);

  const handleMeasurementComplete = (result: MeasurementResult) => {
    setMeasurementResult(result);
  };

  return (
    <section id="quote-tool" className="py-20 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Get Your <span className="text-primary">Instant Quote</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enter your address and our AI will analyze satellite imagery to measure your roof
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Measurement Wizard - Unified Component */}
          <MeasurementWizard
            serviceType="coating"
            onMeasurementComplete={handleMeasurementComplete}
            propertyType={propertyType}
          />

          {/* Property Details Card - Only show after measurement */}
          {measurementResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  Coating Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Roof Type</Label>
                    <Select value={roofType} onValueChange={setRoofType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select roof type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat">Flat Roof</SelectItem>
                        <SelectItem value="metal">Metal Roof</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Coating Type</Label>
                    <Select value={coatingType} onValueChange={setCoatingType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select coating type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(COATING_PRICES).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.name} (${value.low} - ${value.high}/SF)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Measurement Summary */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">True Sq Ft</p>
                    <p className="text-xl font-bold">{measurementResult.trueSqft.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total with Waste</p>
                    <p className="text-xl font-bold text-primary">{measurementResult.totalWithWaste.toLocaleString()}</p>
                  </div>
                </div>

                {/* Results */}
                {showEstimate && estimateLow > 0 && (
                  <div className="pt-6 space-y-4 border-t">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">Estimated Cost Range</p>
                      <div className="text-3xl font-bold text-primary">
                        ${estimateLow.toLocaleString()} - ${estimateHigh.toLocaleString()}
                      </div>
                    </div>
                    
                    {/* Spin to Win CTA */}
                    <Button
                      size="lg"
                      className="w-full text-lg py-6 bg-gradient-to-r from-primary via-yellow-500 to-primary animate-pulse"
                      onClick={() => setShowSpinWheel(true)}
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      🎰 TODAY ONLY! Spin to Win Up to 90% OFF!
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Spin Wheel Modal */}
      <SpinWheel
        open={showSpinWheel}
        onClose={() => setShowSpinWheel(false)}
        onResult={(percent) => {
          setDiscountPercent(percent);
          setShowSpinWheel(false);
          setShowClaimForm(true);
        }}
      />

      {/* Discount Claim Form Modal */}
      <DiscountClaimForm
        open={showClaimForm}
        onClose={() => setShowClaimForm(false)}
        onSuccess={(leadData) => {
          setSubmittedLead(leadData);
          setShowClaimForm(false);
          setShowThankYou(true);
        }}
        discountPercent={discountPercent}
        estimateLow={estimateLow}
        estimateHigh={estimateHigh}
        sqft={measurementResult?.totalWithWaste || 0}
        coatingType={coatingType}
        propertyAddress={measurementResult?.address || ""}
      />

      {/* Thank You Screen Modal */}
      {submittedLead && (
        <ThankYouScreen
          open={showThankYou}
          onClose={() => setShowThankYou(false)}
          leadData={submittedLead}
        />
      )}
    </section>
  );
};
