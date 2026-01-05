import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Phone, Video, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ScheduleAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractorName: string;
  contractorId: string;
  conversationId?: string;
  onSchedule: (data: {
    contractor_id: string;
    conversation_id?: string;
    appointment_type: 'phone_call' | 'video_call' | 'in_person';
    scheduled_date: string;
    scheduled_time: string;
    duration_minutes?: number;
    notes?: string;
    property_address?: string;
    service_type?: string;
  }) => Promise<boolean>;
}

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
];

const APPOINTMENT_TYPES = [
  { value: 'phone_call', label: 'Phone Call', icon: Phone },
  { value: 'video_call', label: 'Video Call', icon: Video },
  { value: 'in_person', label: 'In Person', icon: MapPin },
] as const;

export function ScheduleAppointmentDialog({
  open,
  onOpenChange,
  contractorName,
  contractorId,
  conversationId,
  onSchedule
}: ScheduleAppointmentDialogProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>('');
  const [type, setType] = useState<'phone_call' | 'video_call' | 'in_person'>('phone_call');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!date || !time) return;

    setSubmitting(true);
    const success = await onSchedule({
      contractor_id: contractorId,
      conversation_id: conversationId,
      appointment_type: type,
      scheduled_date: format(date, 'yyyy-MM-dd'),
      scheduled_time: time,
      property_address: propertyAddress || undefined,
      service_type: serviceType || undefined,
      notes: notes || undefined
    });
    setSubmitting(false);

    if (success) {
      onOpenChange(false);
      // Reset form
      setDate(undefined);
      setTime('');
      setType('phone_call');
      setPropertyAddress('');
      setServiceType('');
      setNotes('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogDescription>
            Book an appointment with <span className="font-medium text-primary">{contractorName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Appointment Type */}
          <div className="space-y-2">
            <Label>Appointment Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {APPOINTMENT_TYPES.map((t) => (
                <Button
                  key={t.value}
                  type="button"
                  variant={type === t.value ? 'default' : 'outline'}
                  className="flex flex-col h-auto py-3"
                  onClick={() => setType(t.value)}
                >
                  <t.icon className="h-4 w-4 mb-1" />
                  <span className="text-xs">{t.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <Label>Time</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select a time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Property Address (for in-person) */}
          {type === 'in_person' && (
            <div className="space-y-2">
              <Label>Property Address</Label>
              <Input
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                placeholder="Enter the property address"
              />
            </div>
          )}

          {/* Service Type */}
          <div className="space-y-2">
            <Label>Service Type (Optional)</Label>
            <Input
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder="e.g., Roof Inspection, Estimate"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details..."
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!date || !time || submitting}
          >
            {submitting ? 'Scheduling...' : 'Schedule Appointment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
