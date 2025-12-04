import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

interface ProjectsTableProps {
  projects: PermitProject[];
  onRefresh: () => void;
  onViewProject: (project: PermitProject) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  documents_submitted: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  documents_approved: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  pending_payment: "bg-orange-500/20 text-orange-500 border-orange-500/30",
  permit_delivered: "bg-green-500/20 text-green-500 border-green-500/30",
  inspection_scheduled: "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
  complete: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  documents_submitted: "Documents Submitted",
  documents_approved: "Documents Approved",
  pending_payment: "Pending Payment",
  permit_delivered: "Permit Delivered",
  inspection_scheduled: "Inspection Scheduled",
  complete: "Complete"
};

export function ProjectsTable({ projects, onRefresh, onViewProject }: ProjectsTableProps) {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'created_at' | 'customer_name'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'created_at' | 'customer_name') => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedProjects = [...projects].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'created_at') {
      comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else {
      comparison = a.customer_name.localeCompare(b.customer_name);
    }
    return sortDir === 'asc' ? comparison : -comparison;
  });

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('permit_projects')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: "Project deleted",
        description: "The permit project has been deleted."
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete project.",
        variant: "destructive"
      });
    } finally {
      setDeleteId(null);
    }
  };

  const SortIcon = ({ field }: { field: 'created_at' | 'customer_name' }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p className="text-lg">No projects yet</p>
        <p className="text-sm mt-2">Add your first permit project to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead 
                className="text-zinc-400 cursor-pointer hover:text-white"
                onClick={() => handleSort('customer_name')}
              >
                <div className="flex items-center gap-1">
                  Customer
                  <SortIcon field="customer_name" />
                </div>
              </TableHead>
              <TableHead className="text-zinc-400">Property Address</TableHead>
              <TableHead className="text-zinc-400">Service</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead 
                className="text-zinc-400 cursor-pointer hover:text-white"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-1">
                  Created
                  <SortIcon field="created_at" />
                </div>
              </TableHead>
              <TableHead className="text-zinc-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProjects.map((project) => (
              <TableRow key={project.id} className="border-zinc-800 hover:bg-zinc-800/50">
                <TableCell className="text-white font-medium">
                  {project.customer_name}
                  {project.customer_email && (
                    <div className="text-xs text-zinc-500">{project.customer_email}</div>
                  )}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {project.property_address}
                  {project.city && (
                    <div className="text-xs text-zinc-500">
                      {project.city}, {project.state} {project.zip_code}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-zinc-300">{project.service_type}</TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[project.status] || STATUS_COLORS.pending}>
                    {STATUS_LABELS[project.status] || project.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-400">
                  {format(new Date(project.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewProject(project)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(project.id)}
                      className="text-zinc-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Project?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. This will permanently delete the permit project and all associated documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}