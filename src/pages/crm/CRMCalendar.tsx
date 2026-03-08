import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCRMJobs } from "@/hooks/useCRMJobs";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isSameMonth, startOfWeek, endOfWeek } from "date-fns";

export default function CRMCalendar() {
  const { jobs } = useCRMJobs();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const getJobsForDay = (day: Date) => {
    return jobs.filter(j => {
      if (j.scheduled_date && isSameDay(new Date(j.scheduled_date), day)) return true;
      if (j.start_date && isSameDay(new Date(j.start_date), day)) return true;
      return false;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
        <p className="text-muted-foreground">View your scheduled jobs and appointments</p>
      </div>

      <Card>
        <CardContent className="p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => {
              const dayJobs = getJobsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[80px] p-1.5 rounded-lg border text-sm ${
                    !isCurrentMonth ? "bg-muted/20 text-muted-foreground/50" :
                    isToday ? "bg-primary/5 border-primary/30" : "bg-background"
                  }`}
                >
                  <span className={`text-xs font-medium ${isToday ? "text-primary font-bold" : ""}`}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayJobs.slice(0, 2).map(j => (
                      <div key={j.id} className="text-[10px] bg-primary/10 text-primary rounded px-1 py-0.5 truncate">
                        {j.title}
                      </div>
                    ))}
                    {dayJobs.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">+{dayJobs.length - 2} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
