import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { JobResponse } from '@/hooks/useJobResponses';
import { formatDistanceToNow } from 'date-fns';
import { Star, Check, X, Phone, Mail } from 'lucide-react';

interface ContractorResponseCardProps {
  response: JobResponse;
  onAccept: () => void;
  onDecline: () => void;
}

export function ContractorResponseCard({
  response,
  onAccept,
  onDecline
}: ContractorResponseCardProps) {
  const contractor = response.contractor;
  const isPending = response.status === 'pending';
  const isAccepted = response.status === 'accepted';
  const isDeclined = response.status === 'declined';

  return (
    <Card className={`transition-all ${
      isAccepted ? 'border-green-500/50 bg-green-500/5' :
      isDeclined ? 'opacity-60' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Contractor Avatar */}
          <Avatar className="h-12 w-12 border-2 border-background">
            <AvatarImage src={contractor?.logo_url || ''} alt={contractor?.company_name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {contractor?.company_name?.slice(0, 2).toUpperCase() || 'C'}
            </AvatarFallback>
          </Avatar>

          {/* Contractor Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold truncate">{contractor?.company_name || 'Contractor'}</h4>
              {contractor?.average_rating && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span>{contractor.average_rating.toFixed(1)}</span>
                  {contractor.review_count && (
                    <span className="text-muted-foreground">({contractor.review_count})</span>
                  )}
                </div>
              )}
            </div>

            {contractor?.category && (
              <Badge variant="outline" className="mt-1 text-xs">
                {contractor.category}
              </Badge>
            )}

            {/* Proposed Amount */}
            {response.proposed_amount && (
              <p className="text-lg font-semibold text-primary mt-2">
                ${response.proposed_amount.toLocaleString()}
              </p>
            )}

            {/* Message */}
            {response.message && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                {response.message}
              </p>
            )}

            {/* Contact info for accepted responses */}
            {isAccepted && contractor && (
              <div className="flex items-center gap-4 mt-3 text-sm">
                {contractor.phone && (
                  <a href={`tel:${contractor.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                    <Phone className="h-3.5 w-3.5" />
                    {contractor.phone}
                  </a>
                )}
                {contractor.email && (
                  <a href={`mailto:${contractor.email}`} className="flex items-center gap-1 text-primary hover:underline">
                    <Mail className="h-3.5 w-3.5" />
                    {contractor.email}
                  </a>
                )}
              </div>
            )}

            {/* Timestamp */}
            <p className="text-xs text-muted-foreground mt-2">
              Responded {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {isPending && (
              <>
                <Button size="sm" onClick={onAccept} className="gap-1">
                  <Check className="h-4 w-4" />
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={onDecline} className="gap-1">
                  <X className="h-4 w-4" />
                  Decline
                </Button>
              </>
            )}
            {isAccepted && (
              <Badge className="bg-green-500 text-white">
                <Check className="h-3 w-3 mr-1" />
                Accepted
              </Badge>
            )}
            {isDeclined && (
              <Badge variant="secondary">
                Declined
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
