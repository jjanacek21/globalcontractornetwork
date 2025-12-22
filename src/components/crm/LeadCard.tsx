import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, DollarSign, Calendar, User, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import type { LeadWithDetails } from "@/hooks/useLeads";

interface LeadCardProps {
  lead: LeadWithDetails;
  onClick?: () => void;
  onStatusChange?: (status: string) => void;
  onDelete?: () => void;
}

export function LeadCard({ lead, onClick, onStatusChange, onDelete }: LeadCardProps) {
  const contactName = lead.contact 
    ? `${lead.contact.first_name} ${lead.contact.last_name}` 
    : "Unknown Contact";

  const propertyAddress = lead.property
    ? `${lead.property.address_line1}, ${lead.property.city}`
    : "No address";

  return (
    <Card 
      className="hover:shadow-md transition-all cursor-pointer group border-l-4"
      style={{ borderLeftColor: `hsl(var(--primary))` }}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground truncate">{contactName}</h3>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground truncate">{propertyAddress}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                className="text-destructive"
              >
                Delete Lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className="text-xs">
            {lead.lead_type?.replace(/_/g, ' ') || 'retail'}
          </Badge>
          {lead.source && (
            <Badge variant="secondary" className="text-xs">
              {lead.source.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          {lead.expected_value && (
            <div className="flex items-center gap-1 text-primary font-medium">
              <DollarSign className="w-4 h-4" />
              <span>{lead.expected_value.toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Calendar className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(lead.created_at || ''), { addSuffix: true })}</span>
          </div>
        </div>

        {lead.assigned_rep && (
          <div className="mt-3 pt-3 border-t flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
              <User className="w-3 h-3" />
            </div>
            <span className="text-xs text-muted-foreground">
              {lead.assigned_rep.job_title || 'Assigned Rep'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
