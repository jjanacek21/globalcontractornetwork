import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Gift, Building2, Check, X, ArrowRight, MapPin, Briefcase, Clock,
  CheckCircle, XCircle
} from 'lucide-react';
import { ReferralInvitation } from '@/hooks/useHomeownerReferralInvitations';
import { format } from 'date-fns';

interface ReferralInvitationsSectionProps {
  invitations: ReferralInvitation[];
  pendingCount: number;
  loading: boolean;
  onAccept: (invitationId: string, propertyAddress?: string) => Promise<boolean>;
  onDecline: (invitationId: string) => Promise<boolean>;
}

export function ReferralInvitationsSection({ 
  invitations, 
  pendingCount,
  loading, 
  onAccept,
  onDecline 
}: ReferralInvitationsSectionProps) {
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<ReferralInvitation | null>(null);
  const [propertyAddress, setPropertyAddress] = useState('');
  const [processing, setProcessing] = useState(false);

  const pendingInvitations = invitations.filter(i => i.status === 'pending');
  const processedInvitations = invitations.filter(i => i.status !== 'pending');

  const handleAcceptClick = (invitation: ReferralInvitation) => {
    setSelectedInvitation(invitation);
    setPropertyAddress(invitation.property_address || '');
    setAcceptDialogOpen(true);
  };

  const handleAccept = async () => {
    if (!selectedInvitation) return;
    
    setProcessing(true);
    const success = await onAccept(selectedInvitation.id, propertyAddress);
    setProcessing(false);
    
    if (success) {
      setAcceptDialogOpen(false);
      setSelectedInvitation(null);
      setPropertyAddress('');
    }
  };

  const handleDecline = async (invitation: ReferralInvitation) => {
    setProcessing(true);
    await onDecline(invitation.id);
    setProcessing(false);
  };

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Gift className="h-5 w-5 text-primary" />
            Contractor Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return null; // Don't show section if no invitations
  }

  return (
    <>
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Gift className="h-5 w-5 text-primary" />
            Contractor Recommendations
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount} pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pending invitations */}
          {pendingInvitations.map((invitation) => (
            <div
              key={invitation.id}
              className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-transparent border border-primary/30"
            >
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={invitation.referring_contractor?.logo_url || ''} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    <Building2 className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <p className="text-white text-sm">
                    <span className="font-medium">{invitation.referring_contractor?.company_name}</span>
                    {' '}recommends
                  </p>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={invitation.recommended_contractor?.logo_url || ''} />
                      <AvatarFallback className="bg-green-500/20 text-green-400">
                        <Building2 className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-white">
                      {invitation.recommended_contractor?.company_name}
                    </span>
                  </div>
                </div>
                
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  New
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-3 text-sm text-white/60 mb-3">
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {invitation.job_type}
                </div>
                {invitation.property_address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {invitation.property_address}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(invitation.created_at), 'MMM d, yyyy')}
                </div>
              </div>
              
              {invitation.message && (
                <p className="text-sm text-white/80 italic mb-3">
                  "{invitation.message}"
                </p>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAcceptClick(invitation)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={processing}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept & Get Estimate
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDecline(invitation)}
                  className="border-slate-600 text-white/60 hover:text-white hover:bg-slate-700"
                  disabled={processing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Processed invitations */}
          {processedInvitations.length > 0 && pendingInvitations.length > 0 && (
            <div className="border-t border-slate-700 pt-4 mt-4">
              <h4 className="text-sm font-medium text-white/60 mb-3">Previous Recommendations</h4>
            </div>
          )}
          
          {processedInvitations.slice(0, 3).map((invitation) => (
            <div
              key={invitation.id}
              className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/60">
                    {invitation.recommended_contractor?.company_name}
                  </span>
                  <ArrowRight className="h-3 w-3 text-white/40" />
                  <span className="text-sm text-white/80">{invitation.job_type}</span>
                </div>
                
                {invitation.status === 'accepted' ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Accepted
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-slate-700 text-white/60">
                    <XCircle className="h-3 w-3 mr-1" />
                    Declined
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Accept Dialog */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Accept Recommendation</DialogTitle>
            <DialogDescription className="text-white/60">
              Confirm your property address to receive an estimate from{' '}
              <span className="text-primary font-medium">
                {selectedInvitation?.recommended_contractor?.company_name}
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white">Property Address</Label>
              <Input
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                placeholder="Enter your property address"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-green-400">
                ✓ The contractor will receive your request and contact you for an estimate
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAcceptDialogOpen(false)}
              className="border-slate-600 text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!propertyAddress.trim() || processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? 'Processing...' : 'Confirm & Request Estimate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
