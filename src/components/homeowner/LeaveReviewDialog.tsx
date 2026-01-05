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
      <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Leave a Review</DialogTitle>
          <DialogDescription className="text-white/60">
            Share your experience with{' '}
            <span className="text-primary font-medium">
              {project?.contractor?.company_name}
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Project info */}
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <p className="text-sm text-white/60">Project</p>
            <p className="text-white font-medium">{project?.service_type}</p>
            <p className="text-sm text-white/60 mt-1">{project?.property_address}</p>
          </div>

          {/* Star rating */}
          <div className="space-y-2">
            <Label className="text-white">Your Rating</Label>
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
                        : "text-slate-600"
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-white/60">
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
            <Label className="text-white">Your Review (Optional)</Label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell others about your experience..."
              className="min-h-[100px] bg-slate-800 border-slate-700 text-white placeholder:text-white/40"
            />
          </div>

          {/* Reviewer info */}
          <div className="text-sm text-white/60">
            Reviewing as: <span className="text-white">{reviewerName}</span>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-slate-600 text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="bg-primary hover:bg-primary/90"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
