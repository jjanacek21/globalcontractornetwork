import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProjectCard } from "./ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, SortAsc, SortDesc, FileX } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface ProjectsListProps {
  projects: PermitProject[];
  onRefresh: () => void;
  onViewProject: (project: PermitProject) => void;
  onAction: (projectId: string, action: 'upload' | 'inspection' | 'revision') => void;
}

export function ProjectsList({ projects, onRefresh, onViewProject, onAction }: ProjectsListProps) {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

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

  // Filter and sort projects
  const filteredProjects = projects
    .filter((p) => {
      const matchesSearch = 
        p.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        p.property_address.toLowerCase().includes(search.toLowerCase()) ||
        p.service_type.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <FileX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Permit Projects Yet</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Start by submitting your first permit request. We'll handle the paperwork for you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="documents_submitted">Docs Submitted</SelectItem>
              <SelectItem value="documents_approved">Docs Approved</SelectItem>
              <SelectItem value="pending_payment">Payment Due</SelectItem>
              <SelectItem value="permit_delivered">Permit Ready</SelectItem>
              <SelectItem value="inspection_scheduled">Inspection Set</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
            title={sortOrder === "newest" ? "Showing newest first" : "Showing oldest first"}
          >
            {sortOrder === "newest" ? (
              <SortDesc className="h-4 w-4" />
            ) : (
              <SortAsc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredProjects.length} of {projects.length} projects
      </p>

      {/* Project Cards */}
      <div className="space-y-3">
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onViewProject={onViewProject}
            onAction={onAction}
            onDelete={setDeleteId}
          />
        ))}
      </div>

      {filteredProjects.length === 0 && projects.length > 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No projects match your filters</p>
          <Button 
            variant="link" 
            onClick={() => { setSearch(""); setStatusFilter("all"); }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the permit project and all associated documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
