import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { JobRequest } from '@/hooks/useHomeownerJobs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import {
  MapPin,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  XCircle,
  Trash2,
  MessageSquare
} from 'lucide-react';

interface JobListingCardProps {
  job: JobRequest;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
  onDelete: () => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'open':
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Open</Badge>;
    case 'awarded':
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Awarded</Badge>;
    case 'closed':
      return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">Closed</Badge>;
    case 'completed':
      return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">Completed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getUrgencyBadge = (urgency: string) => {
  switch (urgency) {
    case 'emergency':
      return <Badge variant="destructive" className="text-xs">Emergency</Badge>;
    case 'high':
      return <Badge className="bg-orange-500/10 text-orange-600 text-xs">Urgent</Badge>;
    case 'medium':
      return <Badge className="bg-yellow-500/10 text-yellow-600 text-xs">Moderate</Badge>;
    default:
      return null;
  }
};

export function JobListingCard({
  job,
  isExpanded,
  onToggleExpand,
  onClose,
  onDelete
}: JobListingCardProps) {
  const hasBudget = job.budget_min || job.budget_max;

  return (
    <div className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-medium truncate">{job.title}</h3>
            {getStatusBadge(job.status)}
            {getUrgencyBadge(job.urgency)}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.property_address}
            </span>
            {hasBudget && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {job.budget_min && job.budget_max
                  ? `$${job.budget_min.toLocaleString()} - $${job.budget_max.toLocaleString()}`
                  : job.budget_max
                  ? `Up to $${job.budget_max.toLocaleString()}`
                  : `From $${job.budget_min?.toLocaleString()}`
                }
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
            </span>
          </div>

          {job.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {job.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Response count button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="gap-1"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="font-medium">{job.response_count || 0}</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {job.status === 'open' && (
                <DropdownMenuItem onClick={onClose}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Close Job
                </DropdownMenuItem>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Job
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this job?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. All responses from contractors will also be deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Service category badge */}
      <div className="mt-3 flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {job.service_category}
        </Badge>
        {job.timeline && (
          <Badge variant="outline" className="text-xs">
            {job.timeline}
          </Badge>
        )}
      </div>
    </div>
  );
}
