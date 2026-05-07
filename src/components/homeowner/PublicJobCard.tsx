import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, AlertCircle, Calendar, Image as ImageIcon, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PublicJob {
  id: string;
  title: string;
  description: string | null;
  service_category: string;
  urgency: string | null;
  budget_min: number | null;
  budget_max: number | null;
  timeline: string | null;
  photos: string[];
  created_at: string | null;
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

export function PublicJobCard({ job }: { job: PublicJob }) {
  const formatBudget = () => {
    if (!job.budget_min && !job.budget_max) return 'Budget TBD';
    if (job.budget_min && job.budget_max) {
      return `$${job.budget_min.toLocaleString()} - $${job.budget_max.toLocaleString()}`;
    }
    if (job.budget_min) return `From $${job.budget_min.toLocaleString()}`;
    return `Up to $${job.budget_max?.toLocaleString()}`;
  };

  const cover = job.photos?.[0];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {cover ? (
        <div className="aspect-video w-full bg-muted overflow-hidden">
          <img src={cover} alt={job.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video w-full bg-muted flex items-center justify-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg truncate">{job.title}</h3>
            <p className="text-sm text-muted-foreground">{job.service_category}</p>
          </div>
          <div className="flex items-center gap-1 text-green-600 font-semibold whitespace-nowrap">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">{formatBudget()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {job.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {job.urgency && (
            <Badge variant="outline" className={urgencyColors[job.urgency] || 'bg-gray-500'}>
              <AlertCircle className="w-3 h-3 mr-1" />
              {job.urgency.charAt(0).toUpperCase() + job.urgency.slice(1)}
            </Badge>
          )}
          {job.timeline && (
            <Badge variant="secondary">
              <Calendar className="w-3 h-3 mr-1" />
              {timelineLabels[job.timeline] || job.timeline}
            </Badge>
          )}
          {job.photos && job.photos.length > 1 && (
            <Badge variant="outline">
              <ImageIcon className="w-3 h-3 mr-1" />
              {job.photos.length} photos
            </Badge>
          )}
        </div>
        {job.created_at && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
            <Clock className="w-3 h-3" />
            Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
