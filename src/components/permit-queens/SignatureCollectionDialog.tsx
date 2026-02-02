import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { 
  PenTool, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  User,
  Building2,
  Shield,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { SignatureCapture } from './SignatureCapture';
import { SignatureRequirement } from './SignatureChecklist';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CollectedSignature {
  requirementId: string;
  signerType: string;
  signatureDataUrl: string;
  signedAt: string;
}

interface SignatureCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirements: SignatureRequirement[];
  ownerName: string;
  contractorName?: string;
  onComplete: (signatures: CollectedSignature[]) => void;
  onSignatureCollected?: (signature: CollectedSignature) => void;
}

const SIGNER_ICONS = {
  owner: User,
  qualifier: Building2,
  notary: Shield,
};

export function SignatureCollectionDialog({
  open,
  onOpenChange,
  requirements,
  ownerName,
  contractorName = 'Contractor',
  onComplete,
  onSignatureCollected,
}: SignatureCollectionDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [collectedSignatures, setCollectedSignatures] = useState<CollectedSignature[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter to only include requirements that need signatures (not notary for now)
  const signatureRequirements = requirements.filter(
    r => (r.signerType === 'owner' || r.signerType === 'qualifier') && !r.isCompleted
  );

  const currentRequirement = signatureRequirements[currentIndex];
  const progress = signatureRequirements.length > 0 
    ? ((collectedSignatures.length) / signatureRequirements.length) * 100 
    : 100;

  const getSignerName = (signerType: string) => {
    switch (signerType) {
      case 'owner':
        return ownerName || 'Property Owner';
      case 'qualifier':
        return contractorName;
      case 'notary':
        return 'Notary Public';
      default:
        return signerType;
    }
  };

  const handleSignature = useCallback((signatureDataUrl: string) => {
    if (!currentRequirement) return;

    const newSignature: CollectedSignature = {
      requirementId: currentRequirement.id,
      signerType: currentRequirement.signerType,
      signatureDataUrl,
      signedAt: new Date().toISOString(),
    };

    setCollectedSignatures(prev => [...prev, newSignature]);
    
    if (onSignatureCollected) {
      onSignatureCollected(newSignature);
    }

    // Move to next requirement or complete
    if (currentIndex < signatureRequirements.length - 1) {
      setCurrentIndex(prev => prev + 1);
      toast.success(`${getSignerName(currentRequirement.signerType)} signature captured`);
    } else {
      // All signatures collected
      setIsProcessing(true);
      const allSignatures = [...collectedSignatures, newSignature];
      
      setTimeout(() => {
        onComplete(allSignatures);
        setIsProcessing(false);
        onOpenChange(false);
        toast.success('All signatures collected successfully!');
      }, 500);
    }
  }, [currentRequirement, currentIndex, signatureRequirements.length, collectedSignatures, onComplete, onSignatureCollected, onOpenChange]);

  const handleSkip = () => {
    if (currentIndex < signatureRequirements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      // Remove the last signature if going back
      setCollectedSignatures(prev => prev.slice(0, -1));
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleClose = () => {
    // Reset state on close
    setCurrentIndex(0);
    setCollectedSignatures([]);
    onOpenChange(false);
  };

  if (signatureRequirements.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              No Signatures Required
            </DialogTitle>
            <DialogDescription>
              All required signatures have already been collected for this permit.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const SignerIcon = currentRequirement ? SIGNER_ICONS[currentRequirement.signerType as keyof typeof SIGNER_ICONS] || User : User;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Collect Signatures
          </DialogTitle>
          <DialogDescription>
            {signatureRequirements.length - collectedSignatures.length} of {signatureRequirements.length} signatures remaining
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex gap-1 justify-center">
            {signatureRequirements.map((req, idx) => (
              <div
                key={req.id}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  idx < collectedSignatures.length
                    ? "bg-green-500"
                    : idx === currentIndex
                    ? "bg-primary"
                    : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>

        {isProcessing ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="font-medium">Processing signatures...</p>
              <p className="text-sm text-muted-foreground">Embedding into documents</p>
            </CardContent>
          </Card>
        ) : currentRequirement ? (
          <div className="space-y-4">
            {/* Current Signer Info */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <SignerIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{getSignerName(currentRequirement.signerType)}</p>
                    <p className="text-sm text-muted-foreground">
                      Signing: {currentRequirement.documentType.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <Badge variant={currentRequirement.isRequired ? 'default' : 'secondary'}>
                    {currentRequirement.isRequired ? 'Required' : 'Optional'}
                  </Badge>
                </div>
                {currentRequirement.requiresNotary && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                    <AlertCircle className="h-4 w-4" />
                    This document requires notarization after signing
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Signature Canvas */}
            <SignatureCapture
              onSign={handleSignature}
              onCancel={handleClose}
              signerName={getSignerName(currentRequirement.signerType)}
              documentName={currentRequirement.documentType.replace(/_/g, ' ')}
              width={380}
              height={180}
            />

            {/* Navigation */}
            <div className="flex justify-between items-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              {!currentRequirement.isRequired && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                >
                  Skip for Now
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        ) : null}

        {/* Collected Signatures Summary */}
        {collectedSignatures.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Collected Signatures:</p>
            <div className="flex flex-wrap gap-2">
              {collectedSignatures.map((sig, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1">
                  <Check className="h-3 w-3 text-green-500" />
                  {sig.signerType}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
