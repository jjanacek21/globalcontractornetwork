import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Phone, Video, MapPin, Building2, X } from 'lucide-react';
import { Appointment } from '@/hooks/useHomeownerAppointments';
import { format } from 'date-fns';

interface AppointmentsSectionProps {
  upcomingAppointments: Appointment[];
  pastAppointments: Appointment[];
  loading: boolean;
  onCancel: (appointmentId: string) => Promise<boolean>;
}

export function AppointmentsSection({
  upcomingAppointments,
  pastAppointments,
  loading,
  onCancel
}: AppointmentsSectionProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'phone_call': return Phone;
      case 'video_call': return Video;
      case 'in_person': return MapPin;
      default: return Calendar;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'confirmed': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            My Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (upcomingAppointments.length === 0 && pastAppointments.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          My Appointments
          {upcomingAppointments.length > 0 && (
            <Badge variant="default" className="ml-2">
              {upcomingAppointments.length} upcoming
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Upcoming</h4>
            {upcomingAppointments.map((apt) => {
              const TypeIcon = getTypeIcon(apt.appointment_type);
              return (
                <div
                  key={apt.id}
                  className="p-4 rounded-lg bg-primary/5 border border-primary/20"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={apt.contractor?.logo_url || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{apt.contractor?.company_name}</h4>
                        <Badge className={getStatusColor(apt.status)}>
                          {apt.status}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(apt.scheduled_date), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {apt.scheduled_time}
                        </div>
                        <div className="flex items-center gap-1">
                          <TypeIcon className="h-3 w-3" />
                          {apt.appointment_type.replace('_', ' ')}
                        </div>
                      </div>
                      
                      {apt.service_type && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Service: {apt.service_type}
                        </p>
                      )}
                    </div>
                    
                    {apt.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onCancel(apt.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <div className="space-y-3">
            {upcomingAppointments.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Past</h4>
              </div>
            )}
            {pastAppointments.slice(0, 3).map((apt) => (
              <div
                key={apt.id}
                className="p-3 rounded-lg bg-muted/50 border"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{apt.contractor?.company_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(apt.scheduled_date), 'MMM d, yyyy')} at {apt.scheduled_time}
                    </p>
                  </div>
                  <Badge className={getStatusColor(apt.status)}>
                    {apt.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
