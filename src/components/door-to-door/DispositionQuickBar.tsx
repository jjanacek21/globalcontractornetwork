import { 
  Home, 
  X, 
  RotateCcw, 
  ThumbsUp, 
  Search, 
  Calendar, 
  FileCheck,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PropertyDisposition } from '@/hooks/usePropertyDispositions';

interface DispositionQuickBarProps {
  currentDisposition: PropertyDisposition;
  onSelect: (disposition: PropertyDisposition) => void;
  disabled?: boolean;
}

const DISPOSITIONS: {
  value: PropertyDisposition;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}[] = [
  { 
    value: 'go_back', 
    label: 'Go Back', 
    shortLabel: 'Go Back',
    icon: RotateCcw, 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-100 hover:bg-amber-200' 
  },
  { 
    value: 'not_home', 
    label: 'Not Home', 
    shortLabel: 'Not Home',
    icon: Home, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100 hover:bg-gray-200' 
  },
  { 
    value: 'not_interested', 
    label: 'Not Interested', 
    shortLabel: 'Not Int.',
    icon: X, 
    color: 'text-red-600', 
    bgColor: 'bg-red-100 hover:bg-red-200' 
  },
  { 
    value: 'interested', 
    label: 'Interested', 
    shortLabel: 'Interested',
    icon: ThumbsUp, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100 hover:bg-blue-200' 
  },
  { 
    value: 'needs_inspection', 
    label: 'Needs Inspection', 
    shortLabel: 'Inspect',
    icon: Search, 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-100 hover:bg-orange-200' 
  },
  { 
    value: 'appointment_set', 
    label: 'Appointment Set', 
    shortLabel: 'Appt Set',
    icon: Calendar, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100 hover:bg-green-200' 
  },
  { 
    value: 'contract_signed', 
    label: 'Contract Signed', 
    shortLabel: 'Signed',
    icon: FileCheck, 
    color: 'text-yellow-600', 
    bgColor: 'bg-yellow-100 hover:bg-yellow-200' 
  },
];

export function DispositionQuickBar({ 
  currentDisposition, 
  onSelect, 
  disabled 
}: DispositionQuickBarProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 pb-2 min-w-max px-1">
        {DISPOSITIONS.map((disp) => {
          const Icon = disp.icon;
          const isSelected = currentDisposition === disp.value;
          
          return (
            <button
              key={disp.value}
              onClick={() => onSelect(disp.value)}
              disabled={disabled}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl transition-all min-w-[72px]",
                disp.bgColor,
                isSelected && "ring-2 ring-offset-1 ring-primary scale-105",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                isSelected ? "bg-white shadow-sm" : "bg-white/50"
              )}>
                <Icon className={cn("w-5 h-5", disp.color)} />
              </div>
              <span className={cn("text-xs font-medium", disp.color)}>
                {disp.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Export disposition config for use in other components
export const DISPOSITION_CONFIG = DISPOSITIONS;

// Helper to get color for a disposition
export function getDispositionColor(disposition: PropertyDisposition): string {
  switch (disposition) {
    case 'not_contacted': return '#f59e0b'; // amber/yellow
    case 'not_home': return '#64748b'; // slate
    case 'not_interested': return '#dc2626'; // red
    case 'go_back': return '#d97706'; // amber
    case 'interested': return '#2563eb'; // blue
    case 'needs_inspection': return '#ea580c'; // orange
    case 'appointment_set': return '#16a34a'; // green
    case 'contract_signed': return '#eab308'; // yellow/gold
    default: return '#f59e0b';
  }
}

// Helper to check if disposition should be filled
export function isDispositionFilled(disposition: PropertyDisposition): boolean {
  return disposition !== 'not_contacted';
}
