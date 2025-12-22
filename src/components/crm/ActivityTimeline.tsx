import { useEffect } from "react";
import { useActivities } from "@/hooks/useActivities";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { 
  MessageSquare, Phone, Mail, FileText, Calendar, 
  CheckCircle, AlertCircle, User, Edit, Plus, Trash
} from "lucide-react";

interface ActivityTimelineProps {
  entityType: string;
  entityId: string;
}

const actionIcons: Record<string, React.ElementType> = {
  note_added: MessageSquare,
  call_made: Phone,
  email_sent: Mail,
  document_uploaded: FileText,
  appointment_scheduled: Calendar,
  status_changed: CheckCircle,
  created: Plus,
  updated: Edit,
  deleted: Trash,
  default: AlertCircle,
};

const actionColors: Record<string, string> = {
  note_added: "bg-blue-100 text-blue-600",
  call_made: "bg-green-100 text-green-600",
  email_sent: "bg-purple-100 text-purple-600",
  document_uploaded: "bg-orange-100 text-orange-600",
  appointment_scheduled: "bg-pink-100 text-pink-600",
  status_changed: "bg-teal-100 text-teal-600",
  created: "bg-emerald-100 text-emerald-600",
  updated: "bg-amber-100 text-amber-600",
  deleted: "bg-red-100 text-red-600",
  default: "bg-gray-100 text-gray-600",
};

export function ActivityTimeline({ entityType, entityId }: ActivityTimelineProps) {
  const { activities, isLoading } = useActivities(entityType, entityId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No activity recorded yet
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = actionIcons[activity.action] || actionIcons.default;
          const colorClass = actionColors[activity.action] || actionColors.default;

          return (
            <div key={activity.id} className="relative flex gap-4 pl-2">
              {/* Icon */}
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {activity.action.replace(/_/g, ' ')}
                    </p>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at || ''), { addSuffix: true })}
                  </span>
                </div>

                {activity.user && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <User className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {activity.user.first_name} {activity.user.last_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
