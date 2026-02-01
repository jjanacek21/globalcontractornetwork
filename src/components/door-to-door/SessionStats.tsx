import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DoorOpen, Trophy, Clock, Target } from "lucide-react";
import type { FieldSession, DoorToDooorStats } from "@/hooks/useDoorToDoorSession";

interface SessionStatsProps {
  session: FieldSession | null;
  allTimeStats: DoorToDooorStats | null;
  sessionStartTime?: Date;
}

export function SessionStats({ session, allTimeStats, sessionStartTime }: SessionStatsProps) {
  // Calculate session duration
  const getDuration = () => {
    if (!sessionStartTime) return "00:00";
    const now = new Date();
    const diff = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed top-20 left-4 z-40 space-y-2">
      {/* Current Session Stats */}
      {session && (
        <Card className="bg-background/95 backdrop-blur shadow-lg border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Current Session</span>
              <Badge variant="default" className="bg-green-600 animate-pulse">
                LIVE
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DoorOpen className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold">{session.total_doors}</p>
                  <p className="text-xs text-muted-foreground">Doors</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">{session.total_points}</p>
                  <p className="text-xs text-muted-foreground">Points</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{getDuration()}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All-Time Stats (collapsed view) */}
      {allTimeStats && (
        <Card className="bg-background/90 backdrop-blur shadow-md">
          <CardContent className="p-3">
            <div className="flex items-center gap-3 text-sm">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">All-time:</span>
              <span className="font-semibold">{allTimeStats.total_doors} doors</span>
              <span className="text-muted-foreground">•</span>
              <span className="font-semibold text-amber-500">{allTimeStats.total_points} pts</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
