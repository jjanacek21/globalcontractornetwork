import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import type { JobFilters as JobFiltersType } from '@/hooks/useJobBoard';

interface JobFiltersProps {
  filters: JobFiltersType;
  onFiltersChange: (filters: JobFiltersType) => void;
}

const SERVICE_CATEGORIES = [
  'Roofing',
  'Roof Coating',
  'Plumbing',
  'Electrical',
  'HVAC',
  'Landscaping',
  'Tree Removal',
  'Painting',
  'Flooring',
  'Windows & Doors',
  'Siding',
  'Gutters',
  'Mold Remediation',
  'Water Damage',
  'General Contractor',
  'Fencing',
  'Concrete',
  'Drywall',
  'Other',
];

export function JobFilters({ filters, onFiltersChange }: JobFiltersProps) {
  const handleCategoryChange = (value: string) => {
    onFiltersChange({ ...filters, category: value === 'all' ? undefined : value });
  };

  const handleDistanceChange = (value: string) => {
    onFiltersChange({ ...filters, maxDistance: value === 'any' ? undefined : parseInt(value) });
  };

  const handleUrgencyChange = (value: string) => {
    onFiltersChange({ ...filters, urgency: value === 'all' ? undefined : value });
  };

  const handleTimelineChange = (value: string) => {
    onFiltersChange({ ...filters, timeline: value === 'all' ? undefined : value });
  };

  const handleMinBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : undefined;
    onFiltersChange({ ...filters, minBudget: value });
  };

  const handleMaxBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : undefined;
    onFiltersChange({ ...filters, maxBudget: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Service Category</Label>
          <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {SERVICE_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Distance</Label>
          <Select value={filters.maxDistance?.toString() || 'any'} onValueChange={handleDistanceChange}>
            <SelectTrigger>
              <SelectValue placeholder="Any Distance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Distance</SelectItem>
              <SelectItem value="10">Within 10 miles</SelectItem>
              <SelectItem value="25">Within 25 miles</SelectItem>
              <SelectItem value="50">Within 50 miles</SelectItem>
              <SelectItem value="100">Within 100 miles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Urgency</Label>
          <Select value={filters.urgency || 'all'} onValueChange={handleUrgencyChange}>
            <SelectTrigger>
              <SelectValue placeholder="Any Urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Urgency</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Timeline</Label>
          <Select value={filters.timeline || 'all'} onValueChange={handleTimelineChange}>
            <SelectTrigger>
              <SelectValue placeholder="Any Timeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Timeline</SelectItem>
              <SelectItem value="asap">ASAP</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Budget Range</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minBudget || ''}
              onChange={handleMinBudgetChange}
              className="w-1/2"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxBudget || ''}
              onChange={handleMaxBudgetChange}
              className="w-1/2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
