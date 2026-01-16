import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  PenTool, 
  User, 
  Building2, 
  Stamp, 
  Mail, 
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';

interface SignatureRequirement {
  id: string;
  documentName: string;
  signerType: 'owner' | 'contractor' | 'notary';
  required: boolean;
  completed: boolean;
  notes?: string;
}

interface SignatureTrackerProps {
  permitType: string;
  isHVHZ: boolean;
  ownerName: string;
  ownerEmail?: string;
  onSendSignatureRequest?: (documentIds: string[]) => void;
}

export function SignatureTracker({
  permitType,
  isHVHZ,
  ownerName,
  ownerEmail,
  onSendSignatureRequest,
}: SignatureTrackerProps) {
  // Generate signature requirements based on permit type
  const getSignatureRequirements = (): SignatureRequirement[] => {
    const requirements: SignatureRequirement[] = [
      {
        id: 'permit_app_owner',
        documentName: 'Building Permit Application - Owner Affidavit',
        signerType: 'owner',
        required: true,
        completed: false,
        notes: 'Owner must sign attesting to property ownership',
      },
      {
        id: 'permit_app_contractor',
        documentName: 'Building Permit Application - Contractor Section',
        signerType: 'contractor',
        required: true,
        completed: false,
      },
      {
        id: 'noc',
        documentName: 'Notice of Commencement',
        signerType: 'owner',
        required: true,
        completed: false,
        notes: 'Must be notarized before recording',
      },
      {
        id: 'noc_notary',
        documentName: 'Notice of Commencement - Notarization',
        signerType: 'notary',
        required: true,
        completed: false,
        notes: 'Required for recording with county clerk',
      },
    ];

    if (isHVHZ) {
      requirements.push(
        {
          id: 'hvhz_disclosure',
          documentName: 'HVHZ Roofing Disclosure (Section 1524)',
          signerType: 'contractor',
          required: true,
          completed: false,
        },
        {
          id: 'roof_wall',
          documentName: 'Roof-to-Wall Connection Affidavit',
          signerType: 'contractor',
          required: true,
          completed: false,
        }
      );
    }

    // HOA Affidavit for Broward areas
    requirements.push({
      id: 'hoa_affidavit',
      documentName: 'HOA Awareness Affidavit',
      signerType: 'owner',
      required: true,
      completed: false,
      notes: 'Owner acknowledges responsibility to notify HOA',
    });

    return requirements;
  };

  const requirements = getSignatureRequirements();
  const ownerSignatures = requirements.filter(r => r.signerType === 'owner');
  const contractorSignatures = requirements.filter(r => r.signerType === 'contractor');
  const notaryRequired = requirements.filter(r => r.signerType === 'notary');

  const completedCount = requirements.filter(r => r.completed).length;
  const totalRequired = requirements.filter(r => r.required).length;
  const completionPercentage = Math.round((completedCount / totalRequired) * 100);

  const getSignerIcon = (type: 'owner' | 'contractor' | 'notary') => {
    switch (type) {
      case 'owner':
        return <User className="h-4 w-4" />;
      case 'contractor':
        return <Building2 className="h-4 w-4" />;
      case 'notary':
        return <Stamp className="h-4 w-4" />;
    }
  };

  const renderSignatureGroup = (
    signatures: SignatureRequirement[],
    title: string,
    description: string,
    icon: React.ReactNode
  ) => {
    const groupCompleted = signatures.filter(s => s.completed).length;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
          </div>
          <Badge variant={groupCompleted === signatures.length ? 'default' : 'secondary'}>
            {groupCompleted}/{signatures.length}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="space-y-2">
          {signatures.map(sig => (
            <div
              key={sig.id}
              className={`flex items-start gap-3 p-3 border rounded-lg ${
                sig.completed ? 'bg-green-500/5 border-green-500/20' : 'bg-background'
              }`}
            >
              <Checkbox
                checked={sig.completed}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{sig.documentName}</p>
                {sig.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{sig.notes}</p>
                )}
              </div>
              {sig.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : (
                <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Signature Tracker
            </CardTitle>
            <CardDescription>
              Track required signatures for your permit packet
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{completedCount}/{totalRequired}</div>
            <p className="text-xs text-muted-foreground">Signatures</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Signature Progress</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Owner Signatures */}
        {renderSignatureGroup(
          ownerSignatures,
          'Property Owner Signatures',
          ownerName ? `Required from: ${ownerName}` : 'Property owner must sign these documents',
          <User className="h-5 w-5 text-blue-500" />
        )}

        {/* Send to Owner for Signature */}
        {ownerEmail && ownerSignatures.some(s => !s.completed) && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onSendSignatureRequest?.(ownerSignatures.filter(s => !s.completed).map(s => s.id))}
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Signature Request to {ownerName}
          </Button>
        )}

        {/* Contractor Signatures */}
        {renderSignatureGroup(
          contractorSignatures,
          'Contractor Signatures',
          'You (the contractor) must sign these documents',
          <Building2 className="h-5 w-5 text-green-500" />
        )}

        {/* Notarization */}
        {notaryRequired.length > 0 && renderSignatureGroup(
          notaryRequired,
          'Notarization Required',
          'These documents must be notarized',
          <Stamp className="h-5 w-5 text-purple-500" />
        )}

        {/* E-Signature Option */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-start gap-3">
            <PenTool className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">E-Signature Available</p>
              <p className="text-xs text-muted-foreground mt-1">
                Use our e-signature integration to collect signatures digitally. 
                NOC notarization can be done through remote online notarization (RON).
              </p>
              <Button variant="link" className="h-auto p-0 mt-2 text-primary">
                Set up E-Signatures <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Print for Wet Signature */}
        <Button variant="outline" className="w-full">
          <PenTool className="h-4 w-4 mr-2" />
          Download Documents for Wet Signature
        </Button>
      </CardContent>
    </Card>
  );
}
