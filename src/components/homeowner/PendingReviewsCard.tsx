import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Building2, CheckCircle, MapPin } from 'lucide-react';
import { ReviewableProject, SubmittedReview } from '@/hooks/useHomeownerReviews';

interface PendingReviewsCardProps {
  reviewableProjects: ReviewableProject[];
  submittedReviews: SubmittedReview[];
  loading: boolean;
  onLeaveReview: (project: ReviewableProject) => void;
}

export function PendingReviewsCard({ 
  reviewableProjects, 
  submittedReviews,
  loading, 
  onLeaveReview 
}: PendingReviewsCardProps) {
  const pendingReviews = reviewableProjects.filter(p => !p.has_review);

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (pendingReviews.length === 0 && submittedReviews.length === 0) {
    return null; // Don't show if no reviews needed or submitted
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Reviews
          {pendingReviews.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingReviews.length} pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pending reviews */}
        {pendingReviews.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Leave a review for completed projects
            </h4>
            
            {pendingReviews.map((project) => (
              <div
                key={project.id}
                className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={project.contractor?.logo_url || ''} />
                    <AvatarFallback className="bg-yellow-500/10 text-yellow-600">
                      <Building2 className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {project.contractor?.company_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">{project.service_type}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      {project.property_address}
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => onLeaveReview(project)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submitted reviews */}
        {submittedReviews.length > 0 && (
          <div className="space-y-3">
            {pendingReviews.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Your Reviews</h4>
              </div>
            )}
            
            {submittedReviews.slice(0, 3).map((review) => (
              <div
                key={review.id}
                className="p-3 rounded-lg bg-muted/30 border"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">
                      {review.contractor?.company_name}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {review.is_approved ? (
                    <Badge className="bg-green-500/10 text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Pending Review
                    </Badge>
                  )}
                </div>
                
                {review.review_text && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    "{review.review_text}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
