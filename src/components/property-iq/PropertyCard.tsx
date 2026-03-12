import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, User, Phone, Mail } from "lucide-react";
import type { PIQPropertySummary } from "@/hooks/usePropertyIQ";

interface PropertyCardProps {
  property: PIQPropertySummary;
}

export const PropertyCard = ({ property }: PropertyCardProps) => {
  const scores = property.piq_property_scores?.[0];
  const roofScore = scores?.roof_replacement_score ?? 0;
  const primaryOwnership = property.piq_property_ownership?.[0];
  const primaryOwner = primaryOwnership?.piq_owners;

  // Compute roof-related info from building components if needed
  const sqft = property.building_sqft ?? 0;
  const marketValue = property.estimated_value ?? 0;

  return (
    <Link to={`/property-iq/property/${property.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{property.property_type}</Badge>
                <Badge
                  variant={roofScore >= 80 ? 'destructive' : 'outline'}
                >
                  Roof Score: {roofScore}
                </Badge>
              </div>

              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {property.address}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {property.city}, {property.state} {property.zip}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Sqft</span>
                  <p className="font-medium">{sqft.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Built</span>
                  <p className="font-medium">{property.year_built}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Value</span>
                  <p className="font-medium">${(marketValue / 1000000).toFixed(1)}M</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Roof Score</span>
                  <p className="font-medium">{roofScore}/100</p>
                </div>
              </div>

              {/* Owner Info */}
              {primaryOwner && (
                <div className="border-t pt-3 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    {primaryOwner.owner_type === 'individual' ? (
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="font-medium">{primaryOwner.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {primaryOwner.owner_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {primaryOwner.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {primaryOwner.phone}
                      </span>
                    )}
                    {primaryOwner.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {primaryOwner.email}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
