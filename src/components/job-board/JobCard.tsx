import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, DollarSign, AlertCircle, Calendar, Users, Image } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getMatchScoreColor, getMatchScoreLabel, type MatchScore } from '@/lib/contractor-matching';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    description: string | null;
    service_category: string;
    urgency: string;
    budget_min: number | null;
    budget_max: number | null;
    timeline: string | null;
    property_address: string;
    city: string | null;
    state: string | null;
    photos: string[];
    created_at: string;
    response_count?: number;
    match_score?: MatchScore;
    distance?: number;
  };
  onViewDetails: () => void;
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

export function JobCard({ job, onViewDetails }: JobCardProps) {
  const formatBudget = () => {
    if (!job.budget_min && !job.budget_max) return 'Budget TBD';
    if (job.budget_min && job.budget_max) {
      return `$${job.budget_min.toLocaleString()} - $${job.budget_max.toLocaleString()}`;
    }
    if (job.budget_min) return `From $${job.budget_min.toLocaleString()}`;
    return `Up to $${job.budget_max?.toLocaleString()}`;
  };

  const location = [job.city, job.state].filter(Boolean).join(', ') || job.property_address;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onViewDetails}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{job.title}</h3>
            <p className="text-sm text-muted-foreground">{job.service_category}</p>
          </div>
          {job.match_score && (
            <div className="flex flex-col items-end gap-1">
              <Badge className={`${getMatchScoreColor(job.match_score.total)} text-white`}>
                {job.match_score.total}% Match
              </Badge>
              <span className="text-xs text-muted-foreground">
                {getMatchScoreLabel(job.match_score.total)}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {job.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={urgencyColors[job.urgency] || 'bg-gray-500'}>
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

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{location}</span>
          </div>
          {job.distance !== undefined && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{job.distance.toFixed(1)} mi away</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-green-600 font-medium">
            <DollarSign className="w-4 h-4" />
            <span>{formatBudget()}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{job.response_count || 0} responses</span>
          </div>
        </div>

        {job.photos.length > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Image className="w-4 h-4" />
            <span>{job.photos.length} photo{job.photos.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
          </span>
          <Button size="sm" onClick={(e) => { e.stopPropagation(); onViewDetails(); }}>
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
