import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Wrench } from 'lucide-react';

interface ServicesEditorProps {
  services: string[] | null;
  secondaryTrades: string[] | null;
  category: string;
  onServicesChange: (services: string[]) => void;
  onTradesChange: (trades: string[]) => void;
}

const COMMON_SERVICES = [
  'Free Estimates',
  'Emergency Services',
  '24/7 Availability',
  'Licensed & Insured',
  'Financing Available',
  'Senior Discounts',
  'Warranty Included',
  'Insurance Claims',
  'Commercial Services',
  'Residential Services',
  'New Construction',
  'Renovations',
  'Repairs',
  'Maintenance',
  'Inspections'
];

const TRADE_CATEGORIES = [
  'Roofing',
  'Plumbing',
  'Electrical',
  'HVAC',
  'General Contractor',
  'Landscaping',
  'Windows & Doors',
  'Mold Remediation',
  'Painting',
  'Flooring',
  'Fencing',
  'Solar',
  'Handyman',
  'Emergency Services',
  'Engineering'
];

export function ServicesEditor({
  services,
  secondaryTrades,
  category,
  onServicesChange,
  onTradesChange
}: ServicesEditorProps) {
  const [newService, setNewService] = useState('');
  const currentServices = services || [];
  const currentTrades = secondaryTrades || [];

  const addService = (service: string) => {
    if (service && !currentServices.includes(service)) {
      onServicesChange([...currentServices, service]);
    }
    setNewService('');
  };

  const removeService = (index: number) => {
    const updated = [...currentServices];
    updated.splice(index, 1);
    onServicesChange(updated);
  };

  const toggleTrade = (trade: string) => {
    if (trade === category) return; // Can't remove primary category
    if (currentTrades.includes(trade)) {
      onTradesChange(currentTrades.filter(t => t !== trade));
    } else {
      onTradesChange([...currentTrades, trade]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Services Offered */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Services Offered
          </CardTitle>
          <CardDescription>List the specific services you provide</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Services */}
          <div className="flex flex-wrap gap-2">
            {currentServices.map((service, index) => (
              <Badge key={index} variant="secondary" className="pl-3 pr-1 py-1.5">
                {service}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-destructive/20"
                  onClick={() => removeService(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>

          {/* Add New Service */}
          <div className="flex gap-2">
            <Input
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              placeholder="Add a custom service..."
              onKeyDown={(e) => e.key === 'Enter' && addService(newService)}
            />
            <Button onClick={() => addService(newService)} disabled={!newService.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Add Common Services */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick Add:</Label>
            <div className="flex flex-wrap gap-1">
              {COMMON_SERVICES.filter(s => !currentServices.includes(s)).slice(0, 8).map((service) => (
                <Button
                  key={service}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => addService(service)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {service}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Trades */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Trade Categories</CardTitle>
          <CardDescription>
            Select other trades you can handle (Primary: <span className="font-medium text-primary">{category}</span>)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {TRADE_CATEGORIES.map((trade) => {
              const isPrimary = trade === category;
              const isSelected = currentTrades.includes(trade) || isPrimary;
              return (
                <Badge
                  key={trade}
                  variant={isSelected ? 'default' : 'outline'}
                  className={`cursor-pointer transition-colors ${
                    isPrimary ? 'bg-primary cursor-not-allowed' : isSelected ? 'bg-primary/80' : 'hover:bg-primary/20'
                  }`}
                  onClick={() => !isPrimary && toggleTrade(trade)}
                >
                  {trade}
                  {isPrimary && <span className="ml-1 text-xs">(Primary)</span>}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
