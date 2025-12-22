import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, MoreVertical, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Contact } from "@/hooks/useContacts";

interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ContactCard({ contact, onClick, onEdit, onDelete }: ContactCardProps) {
  const fullName = `${contact.first_name} ${contact.last_name}`;
  
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{fullName}</h3>
              {contact.spouse_first_name && (
                <p className="text-sm text-muted-foreground">
                  & {contact.spouse_first_name} {contact.spouse_last_name || contact.last_name}
                </p>
              )}
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
                Edit Contact
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

        <div className="mt-4 space-y-2">
          {contact.primary_phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{contact.primary_phone}</span>
            </div>
          )}
          {contact.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>{contact.email}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          {contact.source && (
            <Badge variant="secondary" className="text-xs">
              {contact.source.replace(/_/g, ' ')}
            </Badge>
          )}
          {contact.status && (
            <Badge 
              variant={contact.status === 'active' ? 'default' : 'outline'}
              className="text-xs"
            >
              {contact.status}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
