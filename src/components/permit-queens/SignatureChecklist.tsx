import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  PenTool,
  User,
  Building2,
  Stamp,
  FileCheck,
  AlertCircle,
  Download,
  Send,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  ExternalLink,
} from 'lucide-react';

export interface SignatureRequirement {
  id: string;
  documentName: string;
  documentType: string;
  signerType: 'owner' | 'contractor' | 'qualifier' | 'notary' | 'witness';
  signerName?: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  requiresNotary: boolean;
  notaryThreshold?: number; // e.g., $5000
  requiresRecording?: boolean; // e.g., NOC must be recorded with clerk
  recordingOffice?: string;
  notes?: string;
  documentUrl?: string;
}

export interface SignatureChecklistProps {
  requirements: SignatureRequirement[];
  ownerName?: string;
  contractorName?: string;
  qualifierName?: string;
  estimatedValue?: number;
  yearBuilt?: number;
  isHOA?: boolean;
  county?: string;
  onSignatureComplete?: (requirementId: string) => void;
  onDownloadForSigning?: (requirement: SignatureRequirement) => void;
  onSendForSignature?: (requirement: SignatureRequirement) => void;
  className?: string;
}

// Generate default signature requirements based on permit type and jurisdiction
export function generateSignatureRequirements(
  permitType: string,
  county: string,
  city?: string,
  materialType?: string,
  estimatedValue?: number,
  yearBuilt?: number,
  isHOA?: boolean,
  isHVHZ?: boolean
): SignatureRequirement[] {
  const requirements: SignatureRequirement[] = [];
  const value = estimatedValue || 0;
  const year = yearBuilt || new Date().getFullYear();
  
  // Base requirements for all roofing permits
  if (permitType === 'roofing' || permitType === 're_roofing') {
    // Permit Application - always requires contractor signature
    requirements.push({
      id: 'permit_application',
      documentName: 'Permit Application',
      documentType: 'permit_application',
      signerType: 'contractor',
      isRequired: true,
      isCompleted: false,
      requiresNotary: value >= 5000,
      notaryThreshold: 5000,
      notes: value >= 5000 ? 'Notarization required for permits $5,000+' : undefined,
    });
    
    // NOC - requires owner signature and notarization
    requirements.push({
      id: 'noc',
      documentName: 'Notice of Commencement (NOC)',
      documentType: 'noc',
      signerType: 'owner',
      isRequired: true,
      isCompleted: false,
      requiresNotary: true,
      requiresRecording: county === 'Palm Beach',
      recordingOffice: county === 'Palm Beach' ? 'Palm Beach County Clerk of Court' : undefined,
      notes: county === 'Palm Beach' ? 'Must be recorded with County Clerk before work begins' : 'Must be notarized before submission',
    });
    
    // Owner Authorization - always required
    requirements.push({
      id: 'owner_authorization',
      documentName: 'Owner Authorization Letter',
      documentType: 'owner_authorization',
      signerType: 'owner',
      isRequired: true,
      isCompleted: false,
      requiresNotary: false,
    });
    
    // County-specific requirements
    if (county === 'Broward') {
      // Section 1524 Notification
      requirements.push({
        id: 'section_1524',
        documentName: 'Section 1524 Owner Notification',
        documentType: 'section_1524',
        signerType: 'owner',
        isRequired: true,
        isCompleted: false,
        requiresNotary: false,
        notes: 'Owner acknowledgment of re-roofing requirements',
      });
      
      // HVHZ Package
      if (isHVHZ) {
        requirements.push({
          id: 'hvhz_package',
          documentName: 'HVHZ Roofing Package',
          documentType: 'hvhz_package',
          signerType: 'contractor',
          isRequired: true,
          isCompleted: false,
          requiresNotary: false,
        });
      }
      
      // HOA Affidavit
      if (isHOA) {
        requirements.push({
          id: 'hoa_affidavit',
          documentName: 'HOA Affidavit',
          documentType: 'hoa_affidavit',
          signerType: 'owner',
          isRequired: true,
          isCompleted: false,
          requiresNotary: true,
          notes: 'Notarized affidavit confirming HOA approval',
        });
      }
    }
    
    if (county === 'Palm Beach') {
      // City of Boca Raton Supplemental Form
      if (city === 'Boca Raton') {
        requirements.push({
          id: 'boca_supplemental',
          documentName: 'Boca Raton Supplemental Roofing Package',
          documentType: 'city_supplement',
          signerType: 'qualifier',
          isRequired: true,
          isCompleted: false,
          requiresNotary: true,
          notes: 'Qualifier signature with notarization required',
        });
      }
      
      // Roof-to-Wall Mitigation (Section 706.8)
      if (year < 1988 && value >= 300000) {
        requirements.push({
          id: 'roof_to_wall',
          documentName: 'Roof-to-Wall Mitigation Affidavit (706.8)',
          documentType: 'roof_to_wall_mitigation',
          signerType: 'qualifier',
          isRequired: true,
          isCompleted: false,
          requiresNotary: true,
          notes: 'Required for pre-1988 structures with permit value $300K+',
        });
      }
    }
    
    if (county === 'Miami-Dade') {
      // Owner Notification for Roofing
      requirements.push({
        id: 'owner_notification',
        documentName: 'Owner Notification for Roofing',
        documentType: 'owner_notification',
        signerType: 'owner',
        isRequired: true,
        isCompleted: false,
        requiresNotary: false,
      });
      
      // HVHZ Section D
      if (isHVHZ) {
        requirements.push({
          id: 'hvhz_section_d',
          documentName: 'HVHZ Section D - Steep Slope Roofing',
          documentType: 'hvhz_section_d',
          signerType: 'contractor',
          isRequired: true,
          isCompleted: false,
          requiresNotary: false,
        });
      }
      
      // Roof-to-Wall Affidavit
      if (year < 1994 || value >= 300000) {
        requirements.push({
          id: 'roof_to_wall_mdc',
          documentName: 'Roof-to-Wall Connection Affidavit',
          documentType: 'roof_to_wall_affidavit',
          signerType: 'contractor',
          isRequired: true,
          isCompleted: false,
          requiresNotary: true,
          notes: 'Required for pre-1994 structures or permits $300K+',
        });
      }
    }
  }
  
  return requirements;
}

export function SignatureChecklist({
  requirements,
  ownerName,
  contractorName,
  qualifierName,
  estimatedValue,
  yearBuilt,
  isHOA,
  county,
  onSignatureComplete,
  onDownloadForSigning,
  onSendForSignature,
  className = '',
}: SignatureChecklistProps) {
  // Group requirements by signer type
  const groupedRequirements = useMemo(() => {
    const groups: Record<string, SignatureRequirement[]> = {
      owner: [],
      contractor: [],
      qualifier: [],
      notary: [],
      witness: [],
    };
    
    for (const req of requirements) {
      groups[req.signerType].push(req);
    }
    
    return groups;
  }, [requirements]);
  
  // Calculate completion stats
  const stats = useMemo(() => {
    const total = requirements.filter(r => r.isRequired).length;
    const completed = requirements.filter(r => r.isRequired && r.isCompleted).length;
    const needsNotary = requirements.filter(r => r.isRequired && r.requiresNotary && !r.isCompleted);
    const needsRecording = requirements.filter(r => r.isRequired && r.requiresRecording && !r.isCompleted);
    
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      needsNotary,
      needsRecording,
    };
  }, [requirements]);
  
  const getSignerIcon = (type: SignatureRequirement['signerType']) => {
    switch (type) {
      case 'owner':
        return <User className="h-4 w-4" />;
      case 'contractor':
      case 'qualifier':
        return <Building2 className="h-4 w-4" />;
      case 'notary':
        return <Stamp className="h-4 w-4" />;
      case 'witness':
        return <FileCheck className="h-4 w-4" />;
    }
  };
  
  const getSignerName = (type: SignatureRequirement['signerType']) => {
    switch (type) {
      case 'owner':
        return ownerName || 'Property Owner';
      case 'contractor':
        return contractorName || 'Contractor';
      case 'qualifier':
        return qualifierName || contractorName || 'Qualifying Agent';
      case 'notary':
        return 'Notary Public';
      case 'witness':
        return 'Witness';
    }
  };
  
  const renderSignatureGroup = (
    title: string,
    icon: React.ReactNode,
    signerType: SignatureRequirement['signerType'],
    description?: string
  ) => {
    const groupReqs = groupedRequirements[signerType];
    if (groupReqs.length === 0) return null;
    
    const completed = groupReqs.filter(r => r.isCompleted).length;
    const total = groupReqs.length;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
            <Badge variant={completed === total ? 'default' : 'secondary'} className="text-xs">
              {completed}/{total}
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            {getSignerName(signerType)}
          </span>
        </div>
        
        {description && (
          <p className="text-sm text-muted-foreground ml-6">{description}</p>
        )}
        
        <div className="space-y-2 ml-6">
          {groupReqs.map((req) => (
            <div
              key={req.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                req.isCompleted
                  ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                  : 'bg-background border-border'
              }`}
            >
              <div className="mt-0.5">
                {req.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium ${req.isCompleted ? 'text-green-700 dark:text-green-300' : ''}`}>
                    {req.documentName}
                  </span>
                  
                  {req.requiresNotary && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Stamp className="h-3 w-3" />
                      Notary
                    </Badge>
                  )}
                  
                  {req.requiresRecording && (
                    <Badge variant="outline" className="text-xs gap-1 border-amber-500 text-amber-700">
                      <FileText className="h-3 w-3" />
                      Recording Required
                    </Badge>
                  )}
                </div>
                
                {req.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{req.notes}</p>
                )}
                
                {req.completedAt && (
                  <p className="text-xs text-green-600 mt-1">
                    Signed {new Date(req.completedAt).toLocaleDateString()}
                    {req.completedBy && ` by ${req.completedBy}`}
                  </p>
                )}
              </div>
              
              {!req.isCompleted && (
                <div className="flex items-center gap-2">
                  {req.documentUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownloadForSigning?.(req)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {onSendForSignature && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSendForSignature(req)}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Send
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Signature Requirements
            </CardTitle>
            <CardDescription>
              {stats.completed} of {stats.total} signatures collected
            </CardDescription>
          </div>
          
          <div className="text-right">
            <span className="text-2xl font-bold">{stats.percentage}%</span>
            <p className="text-sm text-muted-foreground">Complete</p>
          </div>
        </div>
        
        <Progress value={stats.percentage} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Alerts for special requirements */}
        {stats.needsNotary.length > 0 && (
          <Alert>
            <Stamp className="h-4 w-4" />
            <AlertDescription>
              <strong>{stats.needsNotary.length} document{stats.needsNotary.length > 1 ? 's' : ''}</strong> require notarization.
              {estimatedValue && estimatedValue >= 5000 && (
                <span className="block text-sm mt-1">
                  Notarization required for permits valued at $5,000 or more.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {stats.needsRecording.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{stats.needsRecording.length} document{stats.needsRecording.length > 1 ? 's' : ''}</strong> must be recorded with the County Clerk.
              {county === 'Palm Beach' && (
                <span className="block text-sm mt-1">
                  NOC must be recorded with Palm Beach County Clerk of Court before work begins.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Signature groups */}
        {renderSignatureGroup(
          'Property Owner Signatures',
          <User className="h-5 w-5 text-blue-600" />,
          'owner',
          'Required from the property owner or authorized representative'
        )}
        
        {renderSignatureGroup(
          'Contractor/Qualifier Signatures',
          <Building2 className="h-5 w-5 text-purple-600" />,
          'contractor',
          'Required from the licensed contractor or qualifying agent'
        )}
        
        {renderSignatureGroup(
          'Qualifying Agent Signatures',
          <Building2 className="h-5 w-5 text-indigo-600" />,
          'qualifier',
          'Required from the license holder/qualifying agent'
        )}
        
        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download All for Wet Signing
          </Button>
          
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Setup E-Signatures
          </Button>
        </div>
        
        {/* Completion message */}
        {stats.percentage === 100 && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              All required signatures have been collected. Your permit packet is ready for submission!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default SignatureChecklist;
