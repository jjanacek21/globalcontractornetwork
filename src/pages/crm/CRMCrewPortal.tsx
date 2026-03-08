import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HardHat, Users, Calendar, ClipboardList } from "lucide-react";

export default function CRMCrewPortal() {
  const stats = [
    { label: "Active Crew", value: 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Today's Assignments", value: 0, icon: ClipboardList, color: "text-green-500", bg: "bg-green-50" },
    { label: "Scheduled This Week", value: 0, icon: Calendar, color: "text-purple-500", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Crew Portal</h1>
        <p className="text-muted-foreground">Manage crew members, assignments, and schedules</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <HardHat className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No crew members added yet. Add your first crew member to get started.</p>
        </CardContent>
      </Card>
    </div>
  );
}
