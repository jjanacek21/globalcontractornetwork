import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Home, MoreVertical, Building } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PropertyCard({ property, onClick, onEdit, onDelete }: PropertyCardProps) {
  const fullAddress = [
    property.address_line1,
    property.city,
    property.state,
    property.zip
  ].filter(Boolean).join(", ");

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Home className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {property.address_line1 || "No address"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {property.city}, {property.state} {property.zip}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
                Edit Property
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {property.property_type && (
            <Badge variant="secondary" className="text-xs">
              <Building className="w-3 h-3 mr-1" />
              {property.property_type.replace(/_/g, ' ')}
            </Badge>
          )}
          {property.year_built && (
            <Badge variant="outline" className="text-xs">
              Built {property.year_built}
            </Badge>
          )}
        </div>

        {property.lat && property.lng && (
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>Location verified</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
