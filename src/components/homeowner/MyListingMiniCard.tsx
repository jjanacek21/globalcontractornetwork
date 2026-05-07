import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Image as ImageIcon, Pencil, MessageSquare, Trash2, XCircle } from 'lucide-react';
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
import { JobRequest } from '@/hooks/useHomeownerJobs';

interface Props {
  job: JobRequest;
  onEdit: () => void;
  onViewResponses: () => void;
  onClose: () => void;
  onDelete: () => void;
  isExpanded: boolean;
}

const statusColors: Record<string, string> = {
  open: 'bg-green-500/10 text-green-700 border-green-500/30',
  awarded: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  closed: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
  completed: 'bg-purple-500/10 text-purple-700 border-purple-500/30',
};

export function MyListingMiniCard({ job, onEdit, onViewResponses, onClose, onDelete, isExpanded }: Props) {
  const cover = job.photos?.[0];
  const budget =
    job.budget_min && job.budget_max
      ? `$${job.budget_min.toLocaleString()} - $${job.budget_max.toLocaleString()}`
      : job.budget_max
      ? `Up to $${job.budget_max.toLocaleString()}`
      : job.budget_min
      ? `From $${job.budget_min.toLocaleString()}`
      : 'Budget TBD';

  return (
    <Card className="overflow-hidden">
      {cover ? (
        <div className="aspect-video bg-muted overflow-hidden">
          <img src={cover} alt={job.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video bg-muted flex items-center justify-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
        </div>
      )}
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold truncate">{job.title}</h3>
          <Badge variant="outline" className={statusColors[job.status || 'open']}>
            {job.status || 'open'}
          </Badge>
        </div>
        <p className="text-green-600 font-semibold text-sm">{budget}</p>
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button size="sm" variant="outline" onClick={onEdit} className="flex-1 min-w-[100px]">
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <Button
            size="sm"
            variant={isExpanded ? 'default' : 'outline'}
            onClick={onViewResponses}
            className="flex-1 min-w-[120px]"
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            Replies ({job.response_count || 0})
          </Button>
          {job.status === 'open' && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the job and all contractor responses.
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
        </div>
      </CardContent>
    </Card>
  );
}
