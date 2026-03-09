import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEstimateBuilder } from "@/hooks/useEstimateBuilder";
import { StepIndicator } from "@/components/estimates/builder/StepIndicator";
import { CustomerStep } from "@/components/estimates/builder/CustomerStep";
import { MeasurementStep } from "@/components/estimates/builder/MeasurementStep";
import { LineItemsStep } from "@/components/estimates/builder/LineItemsStep";
import { ReviewStep } from "@/components/estimates/builder/ReviewStep";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CRMEstimateBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const builder = useEstimateBuilder();

  // Auto-select contact from URL params and skip to measurement step
  useEffect(() => {
    const contactId = searchParams.get("contact_id");
    if (contactId && builder.contacts.length > 0 && !builder.state.contact_id) {
      builder.setContact(contactId);
      builder.setStep(1); // Skip to measurement step
    }
  }, [searchParams, builder.contacts]);

  // Auto-select measurement from URL params
  useEffect(() => {
    const measurementId = searchParams.get("measurement_id");
    if (measurementId && builder.measurements.length > 0 && !builder.state.measurement_id) {
      builder.setMeasurement(measurementId);
      // Auto-advance to line items if both contact and measurement are set
      if (builder.state.contact_id) {
        builder.setStep(2);
      }
    }
  }, [searchParams, builder.measurements, builder.state.contact_id]);

  const handleSave = async () => {
    const result = await builder.saveEstimate();
    if (result) {
      navigate("/member/crm/estimates");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/member/crm/estimates")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estimate Builder</h1>
          <p className="text-sm text-muted-foreground">Create a detailed estimate with measurements and catalog pricing</p>
        </div>
      </div>

      <StepIndicator currentStep={builder.state.step} onStepClick={builder.setStep} />

      <div className="mt-8">
        {builder.state.step === 0 && (
          <CustomerStep
            contacts={builder.contacts}
            selectedContactId={builder.state.contact_id}
            onSelect={builder.setContact}
            onNext={() => builder.setStep(1)}
          />
        )}

        {builder.state.step === 1 && (
          <MeasurementStep
            measurements={builder.measurements}
            selectedMeasurementId={builder.state.measurement_id}
            onSelect={builder.setMeasurement}
            onNext={() => builder.setStep(2)}
            onBack={() => builder.setStep(0)}
          />
        )}

        {builder.state.step === 2 && (
          <LineItemsStep
            lineItems={builder.state.lineItems}
            catalogByTrade={builder.catalogByTrade}
            measurement={builder.state.measurement}
            onAddCatalogItem={builder.addCatalogItemToLineItems}
            onAddManualItem={builder.addManualLineItem}
            onUpdateItem={builder.updateLineItem}
            onRemoveItem={builder.removeLineItem}
            subtotal={builder.subtotal}
            onNext={() => builder.setStep(3)}
            onBack={() => builder.setStep(1)}
          />
        )}

        {builder.state.step === 3 && (
          <ReviewStep
            state={builder.state}
            subtotal={builder.subtotal}
            taxAmount={builder.taxAmount}
            grandTotal={builder.grandTotal}
            isSaving={builder.isSaving}
            onUpdateState={builder.updateState}
            onBack={() => builder.setStep(2)}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}
