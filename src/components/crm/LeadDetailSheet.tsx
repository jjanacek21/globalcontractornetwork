import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, DollarSign, 
  FileText, Building
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { LeadWithDetails } from "@/hooks/useLeads";
import { ActivityTimeline } from "./ActivityTimeline";

interface LeadDetailSheetProps {
  lead: LeadWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (status: string) => void;
}

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contact_made', label: 'Contact Made' },
  { value: 'inspection_scheduled', label: 'Inspection Scheduled' },
  { value: 'inspected', label: 'Inspected' },
  { value: 'estimate_sent', label: 'Estimate Sent' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
  { value: 'no_deal', label: 'No Deal' },
];

export function LeadDetailSheet({ lead, open, onOpenChange, onStatusChange }: LeadDetailSheetProps) {
  if (!lead) return null;

  const contactName = lead.contact 
    ? `${lead.contact.first_name} ${lead.contact.last_name}` 
    : "Unknown Contact";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{contactName}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Lead created {formatDistanceToNow(new Date(lead.created_at || ''), { addSuffix: true })}
              </p>
            </div>
            <Badge variant="outline" className="capitalize">
              {lead.status?.replace(/_/g, ' ') || 'new'}
            </Badge>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="property">Property</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Contact Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">{contactName}</p>
                  </div>
                  {lead.contact?.email && (
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm">{lead.contact.email}</p>
                    </div>
                  )}
                  {lead.contact?.primary_phone && (
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm">{lead.contact.primary_phone}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lead Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Lead Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <Badge variant="secondary" className="mt-1">
                      {lead.lead_type?.replace(/_/g, ' ') || 'retail'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Source</p>
                    <Badge variant="outline" className="mt-1">
                      {lead.source?.replace(/_/g, ' ') || 'unknown'}
                    </Badge>
                  </div>
                  {lead.expected_value && (
                    <div>
                      <p className="text-xs text-muted-foreground">Expected Value</p>
                      <p className="text-sm font-medium text-primary">
                        ${lead.expected_value.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                {lead.qualification_notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{lead.qualification_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Update Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <Button
                      key={status.value}
                      variant={lead.status === status.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => onStatusChange?.(status.value)}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="property" className="mt-4 space-y-4">
            {lead.property ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Property Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm font-medium">
                      {lead.property.address_line1}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {lead.property.city}, {lead.property.state} {lead.property.zip}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No property information available
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <ActivityTimeline entityType="lead" entityId={lead.id} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
