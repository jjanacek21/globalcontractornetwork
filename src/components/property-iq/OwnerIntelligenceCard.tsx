import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building2, Phone, Mail, Linkedin, Facebook, Twitter, Globe, MapPin, ExternalLink } from "lucide-react";
import type { PIQOwner, PIQCompany } from "@/hooks/usePropertyIQ";

interface OwnerEntry {
  owner_id: string;
  piq_owners: PIQOwner & { piq_companies?: PIQCompany[] };
}

interface OwnerIntelligenceCardProps {
  ownership: OwnerEntry[];
}

const OwnerTypeIcon = ({ type }: { type: string | null }) => {
  if (type === 'individual') return <User className="h-5 w-5 text-primary" />;
  return <Building2 className="h-5 w-5 text-primary" />;
};

const ownerTypeBadgeVariant = (type: string | null) => {
  if (type === 'company') return 'default' as const;
  if (type === 'trust') return 'secondary' as const;
  return 'outline' as const;
};

export const OwnerIntelligenceCard = ({ ownership }: OwnerIntelligenceCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Owner Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {ownership.map((entry, idx) => {
          const owner = entry.piq_owners;
          const company = owner.piq_companies?.[0];
          return (
            <div key={entry.owner_id} className={idx > 0 ? 'border-t pt-4' : ''}>
              <div className="flex items-center gap-2 mb-3">
                <OwnerTypeIcon type={owner.owner_type} />
                <h4 className="font-semibold text-base">{owner.name}</h4>
                <Badge variant={ownerTypeBadgeVariant(owner.owner_type)} className="text-xs">
                  {owner.owner_type}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {/* Mailing Address */}
                {owner.mailing_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Mailing Address</p>
                      <p>{owner.mailing_address}</p>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {owner.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                      <p>
                        <a href={`tel:${owner.phone}`} className="text-primary hover:underline">{owner.phone}</a>
                      </p>
                    </div>
                  </div>
                )}

                {/* Email */}
                {owner.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                      <p>
                        <a href={`mailto:${owner.email}`} className="text-primary hover:underline">{owner.email}</a>
                      </p>
                    </div>
                  </div>
                )}

                {/* Social Media */}
                {(owner.linkedin_url || owner.facebook_url) && (
                  <div className="flex items-start gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Social Media</p>
                      <div className="flex flex-col gap-1">
                        {owner.linkedin_url && (
                          <a href={owner.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                            <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                          </a>
                        )}
                        {owner.facebook_url && (
                          <a href={owner.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                            <Facebook className="h-3.5 w-3.5" /> Facebook
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Company/Trust Details */}
              {company && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50 border text-sm">
                  <p className="text-xs text-muted-foreground font-medium mb-2">Entity Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {company.company_name && (
                      <div>
                        <span className="text-muted-foreground">Entity:</span>{' '}
                        <span className="font-medium">{company.company_name}</span>
                      </div>
                    )}
                    {company.registered_agent && (
                      <div>
                        <span className="text-muted-foreground">Reg. Agent:</span>{' '}
                        <span className="font-medium">{company.registered_agent}</span>
                      </div>
                    )}
                    {company.formation_date && (
                      <div>
                        <span className="text-muted-foreground">Formed:</span>{' '}
                        <span className="font-medium">{new Date(company.formation_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {company.sunbiz_url && (
                      <div>
                        <a href={company.sunbiz_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink className="h-3.5 w-3.5" /> Sunbiz Record
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
