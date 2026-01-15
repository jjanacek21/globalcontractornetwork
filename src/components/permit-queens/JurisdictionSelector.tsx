import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Home, Wrench, Zap, Droplets, TreeDeciduous, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJurisdictionRules } from '@/hooks/usePermitRequest';

interface JurisdictionSelectorProps {
  selectedCounty: string;
  selectedPermitType: string;
  onCountyChange: (county: string) => void;
  onPermitTypeChange: (type: string) => void;
}

const PERMIT_TYPES = [
  { id: 'roofing', label: 'Roofing', icon: Home, description: 'Re-roof, repairs, coatings' },
  { id: 'hvac', label: 'HVAC', icon: Zap, description: 'AC, heating, ductwork' },
  { id: 'plumbing', label: 'Plumbing', icon: Droplets, description: 'Pipes, fixtures, water heaters' },
  { id: 'electrical', label: 'Electrical', icon: Zap, description: 'Wiring, panels, fixtures' },
  { id: 'windows_doors', label: 'Windows & Doors', icon: Building2, description: 'Impact windows, entry doors' },
  { id: 'general_construction', label: 'General Construction', icon: Wrench, description: 'Additions, renovations' },
  { id: 'tree_removal', label: 'Tree Removal', icon: TreeDeciduous, description: 'Tree permits, clearing' },
  { id: 'fence', label: 'Fence', icon: Shield, description: 'Fencing permits' },
];

export function JurisdictionSelector({
  selectedCounty,
  selectedPermitType,
  onCountyChange,
  onPermitTypeChange,
}: JurisdictionSelectorProps) {
  const { rules, loading, getCounties, getPermitTypes } = useJurisdictionRules();
  const [counties, setCounties] = useState<string[]>([]);

  useEffect(() => {
    if (!loading) {
      const uniqueCounties = getCounties();
      setCounties(uniqueCounties.length > 0 ? uniqueCounties : [
        'Broward County',
        'Miami-Dade County',
        'Palm Beach County',
        'Orange County',
        'Hillsborough County',
        'Pinellas County',
        'Duval County',
      ]);
    }
  }, [loading, rules]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Label className="text-base font-semibold">Select Jurisdiction</Label>
        <Select value={selectedCounty} onValueChange={onCountyChange}>
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder="Choose county or municipality..." />
          </SelectTrigger>
          <SelectContent>
            {counties.map((county) => (
              <SelectItem key={county} value={county} className="text-base py-3">
                {county}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Select the county where the property is located. This determines permit requirements.
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">Permit Type</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PERMIT_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedPermitType === type.id;
            
            return (
              <Card
                key={type.id}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  isSelected && "border-primary bg-primary/5 ring-2 ring-primary/20"
                )}
                onClick={() => onPermitTypeChange(type.id)}
              >
                <CardContent className="p-4 text-center">
                  <Icon className={cn(
                    "w-8 h-8 mx-auto mb-2",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )} />
                  <p className={cn(
                    "font-medium text-sm",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {type.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {type.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
