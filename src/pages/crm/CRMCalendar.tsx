import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCRMJobs } from "@/hooks/useCRMJobs";
import { ChevronLeft, ChevronRight, Plus, ExternalLink, Cloud, Wind, Droplets, Sun, CloudRain, Thermometer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isSameMonth, startOfWeek, endOfWeek } from "date-fns";

const forecastDays = [
  { day: "Mon", icon: Sun, high: 85, low: 72, workable: true },
  { day: "Tue", icon: Cloud, high: 82, low: 70, workable: true },
  { day: "Wed", icon: CloudRain, high: 78, low: 68, workable: false },
  { day: "Thu", icon: Sun, high: 86, low: 73, workable: true },
  { day: "Fri", icon: Sun, high: 88, low: 74, workable: true },
  { day: "Sat", icon: Cloud, high: 84, low: 71, workable: true },
];

export default function CRMCalendar() {
  const { jobs } = useCRMJobs();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [repFilter, setRepFilter] = useState("all");

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });
  }, [currentMonth]);

  const getJobsForDay = (day: Date) =>
    jobs.filter(j => (j.scheduled_date && isSameDay(new Date(j.scheduled_date), day)) || (j.start_date && isSameDay(new Date(j.start_date), day)));

  const selectedDayJobs = getJobsForDay(selectedDate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Calendar</h1>
          <p className="text-muted-foreground">Schedule and track project milestones, appointments, and deliveries</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><ExternalLink className="mr-2 h-4 w-4" />Sync Google Calendar</Button>
          <Button size="sm" className="bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,30%)] text-white"><Plus className="mr-2 h-4 w-4" />Add Event</Button>
        </div>
      </div>

      {/* 7-Day Production Forecast */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">7-Day Production Forecast</h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 border-r pr-6">
              <Sun className="w-10 h-10 text-yellow-500" />
              <div>
                <p className="text-3xl font-bold">84°F</p>
                <p className="text-sm text-muted-foreground">Partly Cloudy</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Wind className="w-3 h-3" />8 mph</span>
                  <span className="flex items-center gap-1"><Droplets className="w-3 h-3" />45%</span>
                  <span className="flex items-center gap-1"><CloudRain className="w-3 h-3" />10%</span>
                  <span className="flex items-center gap-1"><Wind className="w-3 h-3" />12 mph gusts</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto flex-1">
              {forecastDays.map((d, i) => (
                <div key={i} className={`flex flex-col items-center p-2 rounded-lg min-w-[70px] ${d.workable ? "bg-green-50" : "bg-red-50"}`}>
                  <span className="text-xs font-medium">{d.day}</span>
                  <d.icon className={`w-5 h-5 my-1 ${d.workable ? "text-yellow-500" : "text-gray-400"}`} />
                  <span className="text-xs font-bold">{d.high}°</span>
                  <span className="text-[10px] text-muted-foreground">{d.low}°</span>
                  <Badge variant={d.workable ? "default" : "destructive"} className="text-[9px] mt-1">
                    {d.workable ? "GO" : "NO"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rep Filter */}
      <Select value={repFilter} onValueChange={setRepFilter}>
        <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Sales Reps" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All Sales Reps</SelectItem></SelectContent>
      </Select>

      {/* Calendar + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(day => {
                const dayJobs = getJobsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[80px] p-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                      isSelected ? "border-primary bg-primary/5" :
                      !isCurrentMonth ? "bg-muted/20 text-muted-foreground/50" :
                      isToday ? "bg-primary/5 border-primary/30" : "bg-background hover:bg-muted/30"
                    }`}
                  >
                    <span className={`text-xs font-medium ${isToday ? "text-primary font-bold" : ""}`}>{format(day, "d")}</span>
                    <div className="mt-1 space-y-0.5">
                      {dayJobs.slice(0, 2).map(j => (
                        <div key={j.id} className="text-[10px] bg-primary/10 text-primary rounded px-1 py-0.5 truncate">{j.title}</div>
                      ))}
                      {dayJobs.length > 2 && <span className="text-[10px] text-muted-foreground">+{dayJobs.length - 2} more</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Events Sidebar */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Events for {format(selectedDate, "MMMM d, yyyy")}</h3>
            {selectedDayJobs.length > 0 ? (
              <div className="space-y-3">
                {selectedDayJobs.map(j => (
                  <div key={j.id} className="p-3 bg-muted/30 rounded-lg">
                    <p className="font-medium text-sm">{j.title}</p>
                    {j.contact && <p className="text-xs text-muted-foreground">{j.contact.first_name} {j.contact.last_name}</p>}
                    <Badge variant="outline" className="text-xs mt-1">{j.stage}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No events scheduled for this day.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
