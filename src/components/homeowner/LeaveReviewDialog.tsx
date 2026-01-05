import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReviewableProject } from '@/hooks/useHomeownerReviews';

interface LeaveReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ReviewableProject | null;
  reviewerName: string;
  reviewerEmail?: string;
  onSubmit: (
    contractorId: string,
    projectId: string,
    rating: number,
    reviewText: string,
    reviewerName: string,
    reviewerEmail?: string
  ) => Promise<boolean>;
  submitting: boolean;
}

export function LeaveReviewDialog({
  open,
  onOpenChange,
  project,
  reviewerName,
  reviewerEmail,
  onSubmit,
  submitting
}: LeaveReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const handleSubmit = async () => {
    if (!project || !project.assigned_contractor_id) return;
    
    const success = await onSubmit(
      project.assigned_contractor_id,
      project.id,
      rating,
      reviewText,
      reviewerName,
      reviewerEmail
    );
    
    if (success) {
      setRating(0);
      setReviewText('');
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setReviewText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>
            Share your experience with{' '}
            <span className="text-primary font-medium">
              {project?.contractor?.company_name}
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Project info */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-sm text-muted-foreground">Project</p>
            <p className="font-medium">{project?.service_type}</p>
            <p className="text-sm text-muted-foreground mt-1">{project?.property_address}</p>
          </div>

          {/* Star rating */}
          <div className="space-y-2">
            <Label>Your Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      (hoverRating || rating) >= star
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 5 && "Excellent!"}
                {rating === 4 && "Very Good"}
                {rating === 3 && "Good"}
                {rating === 2 && "Fair"}
                {rating === 1 && "Poor"}
              </p>
            )}
          </div>

          {/* Review text */}
          <div className="space-y-2">
            <Label>Your Review (Optional)</Label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell others about your experience..."
              className="min-h-[100px]"
            />
          </div>

          {/* Reviewer info */}
          <div className="text-sm text-muted-foreground">
            Reviewing as: <span className="font-medium">{reviewerName}</span>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
