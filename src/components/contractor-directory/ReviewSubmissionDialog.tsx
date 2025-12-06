import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReviewSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractorId: string;
  contractorName: string;
}

export function ReviewSubmissionDialog({
  open,
  onOpenChange,
  contractorId,
  contractorName,
}: ReviewSubmissionDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating.",
        variant: "destructive",
      });
      return;
    }

    if (!reviewerName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("contractor_reviews").insert({
      contractor_id: contractorId,
      rating,
      review_text: reviewText.trim() || null,
      reviewer_name: reviewerName.trim(),
      reviewer_email: reviewerEmail.trim() || null,
      is_approved: false,
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error submitting review",
        description: "Please try again later.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Review submitted!",
      description: "Your review will appear after moderation (24-48 hours).",
    });

    // Reset form and close
    setRating(0);
    setReviewText("");
    setReviewerName("");
    setReviewerEmail("");
    onOpenChange(false);
  };

  const displayRating = hoverRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>
            Share your experience with {contractorName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Your Rating *</Label>
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
                    className={`h-8 w-8 ${
                      star <= displayRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review">Your Review (optional)</Label>
            <Textarea
              id="review"
              placeholder="Tell others about your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              maxLength={1000}
            />
          </div>

          {/* Reviewer Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Your Name *</Label>
            <Input
              id="name"
              placeholder="John Smith"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Reviewer Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={reviewerEmail}
              onChange={(e) => setReviewerEmail(e.target.value)}
              maxLength={255}
            />
            <p className="text-xs text-muted-foreground">
              We'll never share your email publicly.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Reviews are moderated and may take 24-48 hours to appear.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
