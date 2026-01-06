import { Card3D } from "@/components/crm-ui/Card3D";
import { AnimatedBadge } from "@/components/crm-ui/AnimatedBadge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Video, Lock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

// Sample upcoming events
const events = [
  {
    id: 1,
    title: "Mastering Insurance Claims for Roofers",
    type: "training_call",
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    duration: 90,
    isMembersOnly: true,
    attendees: 47
  },
  {
    id: 2,
    title: "Ask a Master Electrician Anything",
    type: "ama",
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    duration: 60,
    isMembersOnly: true,
    attendees: 32
  },
  {
    id: 3,
    title: "2026 Building Code Updates Overview",
    type: "webinar",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    duration: 120,
    isMembersOnly: false,
    attendees: 156
  }
];

const eventTypeLabels = {
  training_call: { label: "Training Call", color: "info" as const },
  ama: { label: "AMA Session", color: "success" as const },
  webinar: { label: "Webinar", color: "warning" as const }
};

export const UpcomingEvents = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Upcoming Events</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join live training sessions, AMAs, and webinars with industry experts
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {events.map((event) => {
            const typeInfo = eventTypeLabels[event.type as keyof typeof eventTypeLabels];
            
            return (
              <Card3D key={event.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs text-primary font-medium">
                        {format(event.date, 'MMM')}
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        {format(event.date, 'd')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <AnimatedBadge variant={typeInfo.color} size="sm">
                          {typeInfo.label}
                        </AnimatedBadge>
                        {event.isMembersOnly && (
                          <AnimatedBadge variant="default" size="sm">
                            <Lock className="w-3 h-3 mr-1" />
                            Members Only
                          </AnimatedBadge>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground text-lg">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(event.date, 'EEEE, MMM d')} at {format(event.date, 'h:mm a')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {event.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.attendees} registered
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:flex-col">
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(event.date, { addSuffix: true })}
                    </span>
                    <Button 
                      variant={event.isMembersOnly ? "outline" : "default"}
                      className="shrink-0"
                    >
                      {event.isMembersOnly ? (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Join Waitlist
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          Register Free
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card3D>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="lg">
            View All Events
          </Button>
        </div>
      </div>
    </section>
  );
};
