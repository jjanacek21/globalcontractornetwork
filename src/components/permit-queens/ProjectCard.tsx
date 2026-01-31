import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Eye, 
  Trash2, 
  Upload, 
  ClipboardCheck, 
  RefreshCw, 
  MoreVertical, 
  FileText,
  MapPin,
  User,
  Calendar,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PermitProject {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  property_address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  service_type: string;
  has_hurricane_straps: boolean | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface ProjectCardProps {
  project: PermitProject;
  onViewProject: (project: PermitProject) => void;
  onAction: (projectId: string, action: 'upload' | 'inspection' | 'revision') => void;
  onDelete: (projectId: string) => void;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  pending: { 
    bg: "bg-amber-100", 
    text: "text-amber-800", 
    border: "border-amber-300",
    label: "Pending Review" 
  },
  documents_submitted: { 
    bg: "bg-blue-100", 
    text: "text-blue-800", 
    border: "border-blue-300",
    label: "Docs Submitted" 
  },
  documents_approved: { 
    bg: "bg-purple-100", 
    text: "text-purple-800", 
    border: "border-purple-300",
    label: "Docs Approved" 
  },
  pending_payment: { 
    bg: "bg-orange-100", 
    text: "text-orange-800", 
    border: "border-orange-300",
    label: "Payment Due" 
  },
  permit_delivered: { 
    bg: "bg-emerald-100", 
    text: "text-emerald-800", 
    border: "border-emerald-300",
    label: "Permit Ready" 
  },
  inspection_scheduled: { 
    bg: "bg-cyan-100", 
    text: "text-cyan-800", 
    border: "border-cyan-300",
    label: "Inspection Set" 
  },
  complete: { 
    bg: "bg-green-100", 
    text: "text-green-800", 
    border: "border-green-300",
    label: "Complete" 
  }
};

export function ProjectCard({ project, onViewProject, onAction, onDelete }: ProjectCardProps) {
  const navigate = useNavigate();
  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.pending;

  return (
    <Card 
      className={`border-l-4 ${statusConfig.border} hover:shadow-md transition-shadow cursor-pointer`}
      onClick={() => onViewProject(project)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Status Badge - Top */}
            <Badge className={`${statusConfig.bg} ${statusConfig.text} border-0 mb-2 text-xs font-medium`}>
              {statusConfig.label}
            </Badge>
            
            {/* Customer Name */}
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-semibold text-foreground truncate">
                {project.customer_name}
              </span>
            </div>
            
            {/* Address */}
            <div className="flex items-start gap-2 mb-2">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <div className="truncate">{project.property_address}</div>
                {project.city && (
                  <div className="text-xs">{project.city}, {project.state} {project.zip_code}</div>
                )}
              </div>
            </div>
            
            {/* Service Type & Date */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="bg-muted px-2 py-0.5 rounded">{project.service_type}</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(project.created_at), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
              onClick={() => navigate(`/permit-queens/request/${project.id}`)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewProject(project)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/permit-queens/request/${project.id}`)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Manage Permit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAction(project.id, 'upload')}>
                  <Upload className="h-4 w-4 mr-2 text-amber-600" />
                  Upload Documents
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction(project.id, 'inspection')}>
                  <ClipboardCheck className="h-4 w-4 mr-2 text-cyan-600" />
                  Request Inspection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction(project.id, 'revision')}>
                  <RefreshCw className="h-4 w-4 mr-2 text-purple-600" />
                  Request Revision
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(project.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
