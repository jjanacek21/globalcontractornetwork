import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building2, Phone, Mail, Linkedin, Facebook, Twitter, Globe, MapPin, ExternalLink } from "lucide-react";
import type { PropertyOwner } from "@/lib/propertyIQSeedData";

interface OwnerIntelligenceCardProps {
  owners: PropertyOwner[];
}

const OwnerTypeIcon = ({ type }: { type: string }) => {
  if (type === 'individual') return <User className="h-5 w-5 text-primary" />;
  return <Building2 className="h-5 w-5 text-primary" />;
};

const ownerTypeBadgeVariant = (type: string) => {
  if (type === 'company') return 'default' as const;
  if (type === 'trust') return 'secondary' as const;
  return 'outline' as const;
};

export const OwnerIntelligenceCard = ({ owners }: OwnerIntelligenceCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Owner Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {owners.map((owner, idx) => (
          <div key={idx} className={idx > 0 ? 'border-t pt-4' : ''}>
            <div className="flex items-center gap-2 mb-3">
              <OwnerTypeIcon type={owner.owner_type} />
              <h4 className="font-semibold text-base">{owner.name}</h4>
              <Badge variant={ownerTypeBadgeVariant(owner.owner_type)} className="text-xs">
                {owner.owner_type}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Mailing Address */}
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Mailing Address</p>
                  <p>{owner.mailing_address}</p>
                </div>
              </div>

              {/* Phones */}
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Phone Numbers</p>
                  {owner.phones.map((phone, i) => (
                    <p key={i}>
                      <a href={`tel:${phone}`} className="text-primary hover:underline">{phone}</a>
                    </p>
                  ))}
                </div>
              </div>

              {/* Emails */}
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Email Addresses</p>
                  {owner.emails.map((email, i) => (
                    <p key={i}>
                      <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a>
                    </p>
                  ))}
                </div>
              </div>

              {/* Social Media */}
              {Object.keys(owner.social_media).length > 0 && (
                <div className="flex items-start gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Social Media</p>
                    <div className="flex flex-col gap-1">
                      {owner.social_media.linkedin && (
                        <a href={owner.social_media.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                          <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                        </a>
                      )}
                      {owner.social_media.facebook && (
                        <a href={owner.social_media.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                          <Facebook className="h-3.5 w-3.5" /> Facebook
                        </a>
                      )}
                      {owner.social_media.twitter && (
                        <a href={owner.social_media.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                          <Twitter className="h-3.5 w-3.5" /> Twitter
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Company/Trust Details */}
            {(owner.company_name || owner.registered_agent) && (
              <div className="mt-3 p-3 rounded-lg bg-muted/50 border text-sm">
                <p className="text-xs text-muted-foreground font-medium mb-2">Entity Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {owner.company_name && (
                    <div>
                      <span className="text-muted-foreground">Entity:</span>{' '}
                      <span className="font-medium">{owner.company_name}</span>
                    </div>
                  )}
                  {owner.registered_agent && (
                    <div>
                      <span className="text-muted-foreground">Reg. Agent:</span>{' '}
                      <span className="font-medium">{owner.registered_agent}</span>
                    </div>
                  )}
                  {owner.formation_date && (
                    <div>
                      <span className="text-muted-foreground">Formed:</span>{' '}
                      <span className="font-medium">{new Date(owner.formation_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {owner.sunbiz_url && (
                    <div>
                      <a href={owner.sunbiz_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                        <ExternalLink className="h-3.5 w-3.5" /> Sunbiz Record
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
