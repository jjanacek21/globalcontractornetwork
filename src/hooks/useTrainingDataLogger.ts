import { supabase } from "@/integrations/supabase/client";

interface TrainingSessionData {
  sessionId?: string;
  address: string;
  latitude: number;
  longitude: number;
  serviceType: string;
  propertyType?: string;
  aiEstimatedSqft?: number;
  aiConfidence?: string;
  aiBuildingType?: string;
  aiRoofShape?: string;
  aiRoofComplexity?: string;
  userSelectedPitch?: string;
  userSelectedComplexity?: string;
  calculatedTrueSqft?: number;
  calculatedTotalWithWaste?: number;
  calculatedSquares?: number;
  userAdjustedSqft?: number;
  userAdjustedSquares?: number;
  userUsedManualDrawing?: boolean;
  manualDrawingSqft?: number;
  finalAcceptedSqft?: number;
  finalAcceptedSquares?: number;
  measurementMethod?: string;
  sourceComponent?: string;
}

const normalizeAddress = (addr: string): string => {
  return addr.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
};

export const logTrainingSession = async (data: TrainingSessionData): Promise<void> => {
  try {
    const sessionId = data.sessionId || crypto.randomUUID();
    const normalizedAddress = normalizeAddress(data.address);

    const { error } = await supabase.functions.invoke('log-training-session', {
      body: {
        sessionId,
        address: data.address,
        normalizedAddress,
        latitude: data.latitude,
        longitude: data.longitude,
        serviceType: data.serviceType,
        propertyType: data.propertyType,
        aiEstimatedSqft: data.aiEstimatedSqft,
        aiConfidence: data.aiConfidence,
        aiBuildingType: data.aiBuildingType,
        aiRoofShape: data.aiRoofShape,
        aiRoofComplexity: data.aiRoofComplexity,
        userSelectedPitch: data.userSelectedPitch,
        userSelectedComplexity: data.userSelectedComplexity,
        calculatedTrueSqft: data.calculatedTrueSqft,
        calculatedTotalWithWaste: data.calculatedTotalWithWaste,
        calculatedSquares: data.calculatedSquares,
        userAdjustedSqft: data.userAdjustedSqft,
        userAdjustedSquares: data.userAdjustedSquares,
        userUsedManualDrawing: data.userUsedManualDrawing || false,
        manualDrawingSqft: data.manualDrawingSqft,
        finalAcceptedSqft: data.finalAcceptedSqft,
        finalAcceptedSquares: data.finalAcceptedSquares,
        measurementMethod: data.measurementMethod,
        sourceComponent: data.sourceComponent,
        userAgent: navigator.userAgent
      }
    });

    if (error) {
      console.error("Error logging training session:", error);
    } else {
      console.log("Training session logged successfully");
    }
  } catch (error) {
    console.error("Error logging training session:", error);
  }
};
