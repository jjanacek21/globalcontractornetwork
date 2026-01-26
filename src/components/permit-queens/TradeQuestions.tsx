import { RoofingQuestions, RoofingFormData } from './RoofingQuestions';
import { HVACQuestions, HVACFormData } from './HVACQuestions';
import { WindowDoorQuestions, WindowDoorFormData } from './WindowDoorQuestions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Wrench } from 'lucide-react';

export type TradeType = 'roofing' | 'hvac' | 'windows_doors' | 'electrical' | 'plumbing' | 'general_construction' | 'tree_removal' | 'fence';

export interface TradeQuestionsData {
  roofing?: RoofingFormData;
  hvac?: HVACFormData;
  windows_doors?: WindowDoorFormData;
  electrical?: ElectricalFormData;
  plumbing?: PlumbingFormData;
  general?: GeneralFormData;
}

export interface ElectricalFormData {
  workType: string;
  panelSize: string;
  description: string;
}

export interface PlumbingFormData {
  workType: string;
  fixtureCount: number;
  description: string;
}

export interface GeneralFormData {
  description: string;
  estimatedValue: number;
}

interface TradeQuestionsProps {
  trade: TradeType;
  isHVHZ: boolean;
  data: TradeQuestionsData;
  onChange: (data: TradeQuestionsData) => void;
  onComplete: (isComplete: boolean) => void;
}

// Default initial data for each trade
export const getDefaultTradeData = (trade: TradeType): TradeQuestionsData => {
  switch (trade) {
    case 'roofing':
      return {
        roofing: {
          workType: '',
          roofSize: 0,
          roofSizeUnit: 'sqft',
          pitch: '',
          stories: '',
          existingMaterial: '',
          newMaterial: '',
          obstacles: [],
          selectedUnderlayment: null,
          selectedCovering: null,
          selectedFasteners: null,
          // Section 1524 fields
          yearBuilt: null,
          buildingType: 'single_family',
          hasExposedCeilings: false,
          hasPondingWater: false,
          requiresOverflowScuppers: false,
          deckAttachmentConfirmed: false,
        },
      };
    case 'hvac':
      return {
        hvac: {
          workType: '',
          equipmentType: '',
          tonnage: '',
          location: '',
          ductworkIncluded: '',
          selectedUnit: null,
          selectedAirHandler: null,
          electricalUpgrade: false,
          seerRating: '',
        },
      };
    case 'windows_doors':
      return {
        windows_doors: {
          windowCount: 0,
          doorCount: 0,
          slidingDoorCount: 0,
          impactRequired: false,
          frameMaterial: '',
          selectedWindowProduct: null,
          selectedDoorProduct: null,
          selectedSlidingDoorProduct: null,
        },
      };
    case 'electrical':
      return {
        electrical: {
          workType: '',
          panelSize: '',
          description: '',
        },
      };
    case 'plumbing':
      return {
        plumbing: {
          workType: '',
          fixtureCount: 0,
          description: '',
        },
      };
    default:
      return {
        general: {
          description: '',
          estimatedValue: 0,
        },
      };
  }
};

export function TradeQuestions({
  trade,
  isHVHZ,
  data,
  onChange,
  onComplete,
}: TradeQuestionsProps) {
  // Render trade-specific questions
  switch (trade) {
    case 'roofing':
      return (
        <RoofingQuestions
          isHVHZ={isHVHZ}
          formData={data.roofing || getDefaultTradeData('roofing').roofing!}
          onChange={(roofingData) => onChange({ ...data, roofing: roofingData })}
          onComplete={onComplete}
        />
      );

    case 'hvac':
      return (
        <HVACQuestions
          isHVHZ={isHVHZ}
          formData={data.hvac || getDefaultTradeData('hvac').hvac!}
          onChange={(hvacData) => onChange({ ...data, hvac: hvacData })}
          onComplete={onComplete}
        />
      );

    case 'windows_doors':
      return (
        <WindowDoorQuestions
          isHVHZ={isHVHZ}
          formData={data.windows_doors || getDefaultTradeData('windows_doors').windows_doors!}
          onChange={(windowData) => onChange({ ...data, windows_doors: windowData })}
          onComplete={onComplete}
        />
      );

    case 'electrical':
      return (
        <ElectricalQuestions
          data={data.electrical || getDefaultTradeData('electrical').electrical!}
          onChange={(elecData) => onChange({ ...data, electrical: elecData })}
          onComplete={onComplete}
        />
      );

    case 'plumbing':
      return (
        <PlumbingQuestions
          data={data.plumbing || getDefaultTradeData('plumbing').plumbing!}
          onChange={(plumbData) => onChange({ ...data, plumbing: plumbData })}
          onComplete={onComplete}
        />
      );

    default:
      return (
        <GeneralQuestions
          data={data.general || getDefaultTradeData('general_construction').general!}
          onChange={(genData) => onChange({ ...data, general: genData })}
          onComplete={onComplete}
        />
      );
  }
}

// Simple electrical questions component
function ElectricalQuestions({
  data,
  onChange,
  onComplete,
}: {
  data: ElectricalFormData;
  onChange: (data: ElectricalFormData) => void;
  onComplete: (isComplete: boolean) => void;
}) {
  const updateField = (field: keyof ElectricalFormData, value: string) => {
    const newData = { ...data, [field]: value };
    onChange(newData);
    onComplete(newData.workType !== '' && newData.description.length > 10);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wrench className="h-5 w-5" />
          Electrical Project Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Type of Electrical Work</Label>
          <Input
            value={data.workType}
            onChange={(e) => updateField('workType', e.target.value)}
            placeholder="e.g., Panel upgrade, new circuits, service change"
          />
        </div>
        <div className="space-y-2">
          <Label>Panel Size (if applicable)</Label>
          <Input
            value={data.panelSize}
            onChange={(e) => updateField('panelSize', e.target.value)}
            placeholder="e.g., 200 amp"
          />
        </div>
        <div className="space-y-2">
          <Label>Description of Work</Label>
          <Textarea
            value={data.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Describe the electrical work in detail..."
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Simple plumbing questions component
function PlumbingQuestions({
  data,
  onChange,
  onComplete,
}: {
  data: PlumbingFormData;
  onChange: (data: PlumbingFormData) => void;
  onComplete: (isComplete: boolean) => void;
}) {
  const updateField = (field: keyof PlumbingFormData, value: string | number) => {
    const newData = { ...data, [field]: value };
    onChange(newData);
    onComplete(newData.workType !== '' && newData.description.length > 10);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wrench className="h-5 w-5" />
          Plumbing Project Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Type of Plumbing Work</Label>
          <Input
            value={data.workType}
            onChange={(e) => updateField('workType', e.target.value)}
            placeholder="e.g., Water heater replacement, repipe, new fixtures"
          />
        </div>
        <div className="space-y-2">
          <Label>Number of Fixtures</Label>
          <Input
            type="number"
            value={data.fixtureCount || ''}
            onChange={(e) => updateField('fixtureCount', parseInt(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label>Description of Work</Label>
          <Textarea
            value={data.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Describe the plumbing work in detail..."
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// General questions for other trades
function GeneralQuestions({
  data,
  onChange,
  onComplete,
}: {
  data: GeneralFormData;
  onChange: (data: GeneralFormData) => void;
  onComplete: (isComplete: boolean) => void;
}) {
  const updateField = (field: keyof GeneralFormData, value: string | number) => {
    const newData = { ...data, [field]: value };
    onChange(newData);
    onComplete(newData.description.length > 20);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wrench className="h-5 w-5" />
          Project Details
        </CardTitle>
        <CardDescription>
          Describe your project in detail
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Estimated Project Value ($)</Label>
          <Input
            type="number"
            value={data.estimatedValue || ''}
            onChange={(e) => updateField('estimatedValue', parseFloat(e.target.value) || 0)}
            placeholder="15000"
          />
        </div>
        <div className="space-y-2">
          <Label>Description of Work</Label>
          <Textarea
            value={data.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Describe the project in detail including materials, scope, and any special requirements..."
            rows={6}
          />
        </div>
      </CardContent>
    </Card>
  );
}
