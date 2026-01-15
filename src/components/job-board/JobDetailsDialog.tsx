import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin,
  Clock,
  DollarSign,
  AlertCircle,
  Calendar,
  Users,
  Image,
  CheckCircle2,
  X,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { getMatchScoreColor, getMatchScoreLabel, type MatchScore } from '@/lib/contractor-matching';
import { ExpressInterestDialog } from './ExpressInterestDialog';
import type { JobRequest } from '@/hooks/useJobBoard';

interface JobDetailsDialogProps {
  job: JobRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpressInterest: (
    jobId: string,
    message: string,
    proposedAmount?: number,
    estimatedDuration?: string,
    availableStartDate?: string
  ) => Promise<void>;
  hasResponded: (jobId: string) => Promise<boolean>;
}

const urgencyColors: Record<string, string> = {
  emergency: 'bg-red-500 text-white',
  urgent: 'bg-orange-500 text-white',
  standard: 'bg-blue-500 text-white',
  flexible: 'bg-green-500 text-white',
};

const timelineLabels: Record<string, string> = {
  asap: 'ASAP',
  this_week: 'This Week',
  this_month: 'This Month',
  flexible: 'Flexible',
};

export function JobDetailsDialog({
  job,
  open,
  onOpenChange,
  onExpressInterest,
  hasResponded,
}: JobDetailsDialogProps) {
  const [expressInterestOpen, setExpressInterestOpen] = useState(false);
  const [alreadyResponded, setAlreadyResponded] = useState(false);
  const [checkingResponse, setCheckingResponse] = useState(false);

  useEffect(() => {
    const checkResponse = async () => {
      if (job) {
        setCheckingResponse(true);
        const responded = await hasResponded(job.id);
        setAlreadyResponded(responded);
        setCheckingResponse(false);
      }
    };
    if (open && job) {
      checkResponse();
    }
  }, [job, open, hasResponded]);

  if (!job) return null;

  const formatBudget = () => {
    if (!job.budget_min && !job.budget_max) return 'Budget TBD';
    if (job.budget_min && job.budget_max) {
      return `$${job.budget_min.toLocaleString()} - $${job.budget_max.toLocaleString()}`;
    }
    if (job.budget_min) return `From $${job.budget_min.toLocaleString()}`;
    return `Up to $${job.budget_max?.toLocaleString()}`;
  };

  const location = [job.property_address, job.city, job.state, job.zip_code]
    .filter(Boolean)
    .join(', ');

  const handleExpressInterest = async (
    message: string,
    proposedAmount?: number,
    estimatedDuration?: string,
    availableStartDate?: string
  ) => {
    await onExpressInterest(job.id, message, proposedAmount, estimatedDuration, availableStartDate);
    setAlreadyResponded(true);
    setExpressInterestOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">{job.title}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              {/* Match Score */}
              {job.match_score && (
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${getMatchScoreColor(job.match_score.total)}`}>
                    {job.match_score.total}%
                  </div>
                  <div>
                    <h4 className="font-semibold">{getMatchScoreLabel(job.match_score.total)}</h4>
                    <p className="text-sm text-muted-foreground">Based on your skills, location, and ratings</p>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span>Category: {job.match_score.breakdown.category}/30</span>
                      <span>•</span>
                      <span>Distance: {job.match_score.breakdown.distance}/25</span>
                      <span>•</span>
                      <span>Rating: {job.match_score.breakdown.rating}/20</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge>{job.service_category}</Badge>
                <Badge className={urgencyColors[job.urgency] || 'bg-gray-500'}>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {job.urgency.charAt(0).toUpperCase() + job.urgency.slice(1)}
                </Badge>
                {job.timeline && (
                  <Badge variant="secondary">
                    <Calendar className="w-3 h-3 mr-1" />
                    {timelineLabels[job.timeline] || job.timeline}
                  </Badge>
                )}
              </div>

              {/* Description */}
              {job.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                </div>
              )}

              <Separator />

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{location}</p>
                    {job.distance !== undefined && (
                      <p className="text-sm text-muted-foreground">{job.distance.toFixed(1)} miles away</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Budget</p>
                    <p className="text-sm text-green-600 font-semibold">{formatBudget()}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Posted</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Responses</p>
                    <p className="text-sm text-muted-foreground">
                      {job.response_count || 0} of {job.max_responses} max
                    </p>
                  </div>
                </div>
              </div>

              {/* Photos */}
              {job.photos.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Photos ({job.photos.length})
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {job.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Job photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-md"
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Expiration */}
              <div className="text-sm text-muted-foreground">
                Expires: {format(new Date(job.expires_at), 'PPP')}
              </div>
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
            {alreadyResponded ? (
              <Button disabled>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Already Responded
              </Button>
            ) : (
              <Button
                onClick={() => setExpressInterestOpen(true)}
                disabled={checkingResponse || (job.response_count || 0) >= job.max_responses}
              >
                Express Interest
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ExpressInterestDialog
        open={expressInterestOpen}
        onOpenChange={setExpressInterestOpen}
        job={job}
        onSubmit={handleExpressInterest}
      />
    </>
  );
}
