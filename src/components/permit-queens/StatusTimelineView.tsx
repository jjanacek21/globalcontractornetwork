import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Send, 
  Eye, 
  XCircle,
  RefreshCw,
  Bell,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface StatusEvent {
  id: string;
  permit_request_id: string;
  previous_status: string | null;
  new_status: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

interface StatusTimelineViewProps {
  projectId: string;
  currentStatus?: string;
  onRefresh?: () => void;
  compact?: boolean;
}

const STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  draft: {
    label: 'Draft',
    icon: FileText,
    color: 'text-slate-500',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
  },
  pending_docs: {
    label: 'Pending Documents',
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  docs_complete: {
    label: 'Documents Complete',
    icon: CheckCircle2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  packet_ready: {
    label: 'Packet Ready',
    icon: FileText,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  awaiting_payment: {
    label: 'Awaiting Payment',
    icon: Clock,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  submitted: {
    label: 'Submitted to Dept',
    icon: Send,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  under_review: {
    label: 'Under Review',
    icon: Eye,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  corrections_needed: {
    label: 'Corrections Needed',
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  issued: {
    label: 'Permit Issued',
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
  },
};

export function StatusTimelineView({
  projectId,
  currentStatus,
  onRefresh,
  compact = false,
}: StatusTimelineViewProps) {
  const [events, setEvents] = useState<StatusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!compact);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('permit_status_events')
          .select('*')
          .eq('permit_request_id', projectId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching status events:', error);
        } else {
          setEvents((data || []) as StatusEvent[]);
        }
      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchEvents();
    }

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`status-events-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'permit_status_events',
          filter: `permit_request_id=eq.${projectId}`,
        },
        (payload) => {
          setEvents(prev => [payload.new as StatusEvent, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || {
      label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icon: Clock,
      color: 'text-slate-500',
      bgColor: 'bg-slate-100',
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentConfig = currentStatus ? getStatusConfig(currentStatus) : null;
  const CurrentIcon = currentConfig?.icon || Clock;
  const displayedEvents = compact && !expanded ? events.slice(0, 3) : events;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Status Timeline
            </CardTitle>
            {currentStatus && currentConfig && (
              <CardDescription className="flex items-center gap-2 mt-1">
                <span>Current:</span>
                <Badge className={cn(currentConfig.bgColor, currentConfig.color, 'gap-1')}>
                  <CurrentIcon className="h-3 w-3" />
                  {currentConfig.label}
                </Badge>
              </CardDescription>
            )}
          </div>
          {onRefresh && (
            <Button variant="ghost" size="icon" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No status updates yet</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-4">
              {displayedEvents.map((event, index) => {
                const config = getStatusConfig(event.new_status);
                const Icon = config.icon;
                const isLatest = index === 0;

                return (
                  <div key={event.id} className="relative flex gap-4 pl-0">
                    {/* Icon */}
                    <div
                      className={cn(
                        "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background",
                        config.bgColor,
                        isLatest && "ring-2 ring-primary/20"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", config.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{config.label}</span>
                        {event.previous_status && (
                          <span className="text-xs text-muted-foreground">
                            from {getStatusConfig(event.previous_status).label}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                        {' • '}
                        {format(new Date(event.created_at), 'MMM d, yyyy h:mm a')}
                      </p>

                      {event.note && (
                        <p className="text-sm mt-2 text-muted-foreground bg-muted/50 p-2 rounded">
                          {event.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Show more/less */}
            {compact && events.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show {events.length - 3} More
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
