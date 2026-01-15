import { Check, Clock, Zap, Crown, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PricingTier {
  name: string;
  code: string;
  description: string;
  base_price: number;
  features_json: string[];
  turnaround_days: number;
}

interface PricingCardProps {
  tier: PricingTier;
  isSelected?: boolean;
  isRecommended?: boolean;
  onSelect?: () => void;
  className?: string;
}

const tierIcons = {
  basic: Clock,
  standard: Star,
  complex: Crown,
};

const tierColors = {
  basic: 'border-slate-200 bg-slate-50',
  standard: 'border-amber-200 bg-amber-50',
  complex: 'border-purple-200 bg-purple-50',
};

export function PricingCard({
  tier,
  isSelected = false,
  isRecommended = false,
  onSelect,
  className,
}: PricingCardProps) {
  const Icon = tierIcons[tier.code as keyof typeof tierIcons] || Star;
  const colorClass = tierColors[tier.code as keyof typeof tierColors] || tierColors.standard;

  return (
    <Card
      className={cn(
        "relative transition-all duration-200 cursor-pointer hover:shadow-lg",
        colorClass,
        isSelected && "ring-2 ring-amber-500 shadow-lg",
        className
      )}
      onClick={onSelect}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-amber-500 text-white">
            <Zap className="h-3 w-3 mr-1" />
            Recommended
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-white shadow flex items-center justify-center">
          <Icon className={cn(
            "h-6 w-6",
            tier.code === 'basic' && "text-slate-600",
            tier.code === 'standard' && "text-amber-600",
            tier.code === 'complex' && "text-purple-600",
          )} />
        </div>
        <CardTitle className="text-lg">{tier.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{tier.description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center">
          <span className="text-3xl font-bold">${tier.base_price}</span>
          <span className="text-muted-foreground"> / permit</span>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{tier.turnaround_days} day{tier.turnaround_days !== 1 ? 's' : ''} turnaround</span>
        </div>

        <ul className="space-y-2">
          {tier.features_json?.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className={cn(
            "w-full",
            isSelected 
              ? "bg-amber-600 hover:bg-amber-700" 
              : "bg-white text-foreground border hover:bg-muted"
          )}
          variant={isSelected ? "default" : "outline"}
        >
          {isSelected ? "Selected" : "Select Plan"}
        </Button>
      </CardContent>
    </Card>
  );
}

interface PricingGridProps {
  tiers: PricingTier[];
  selectedTier?: string;
  recommendedTier?: string;
  onSelectTier: (tierCode: string) => void;
  className?: string;
}

export function PricingGrid({
  tiers,
  selectedTier,
  recommendedTier,
  onSelectTier,
  className,
}: PricingGridProps) {
  return (
    <div className={cn("grid md:grid-cols-3 gap-6", className)}>
      {tiers.map((tier) => (
        <PricingCard
          key={tier.code}
          tier={tier}
          isSelected={selectedTier === tier.code}
          isRecommended={recommendedTier === tier.code}
          onSelect={() => onSelectTier(tier.code)}
        />
      ))}
    </div>
  );
}
