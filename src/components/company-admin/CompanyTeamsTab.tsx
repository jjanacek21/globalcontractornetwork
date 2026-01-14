import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, MapPin, Users } from "lucide-react";

interface CompanyTeamsTabProps {
  companyId: string;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  service_zip_codes: string[] | null;
  service_counties: string[] | null;
  is_active?: boolean;
  member_count?: number;
}

export const CompanyTeamsTab = ({ companyId }: CompanyTeamsTabProps) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    service_zip_codes: "",
    service_counties: ""
  });
  const { toast } = useToast();

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("company_id", companyId)
        .order("name");

      if (error) throw error;

      // Get member counts
      const teamsWithCounts = await Promise.all((data || []).map(async (team) => {
        const { count } = await supabase
          .from("company_members")
          .select("*", { count: "exact", head: true })
          .eq("team_id", team.id);
        return { ...team, member_count: count || 0 };
      }));

      setTeams(teamsWithCounts);
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [companyId]);

  const handleSubmit = async () => {
    try {
      const teamData = {
        company_id: companyId,
        name: formData.name,
        description: formData.description || null,
        service_zip_codes: formData.service_zip_codes ? formData.service_zip_codes.split(",").map(z => z.trim()) : null,
        service_counties: formData.service_counties ? formData.service_counties.split(",").map(c => c.trim()) : null
      };

      if (editingTeam) {
        const { error } = await supabase
          .from("teams")
          .update(teamData)
          .eq("id", editingTeam.id);
        if (error) throw error;
        toast({ title: "Team Updated", description: "Team has been updated successfully" });
      } else {
        const { error } = await supabase
          .from("teams")
          .insert(teamData);
        if (error) throw error;
        toast({ title: "Team Created", description: "New team has been created successfully" });
      }

      setDialogOpen(false);
      setEditingTeam(null);
      setFormData({ name: "", description: "", service_zip_codes: "", service_counties: "" });
      fetchTeams();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || "",
      service_zip_codes: team.service_zip_codes?.join(", ") || "",
      service_counties: team.service_counties?.join(", ") || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    
    try {
      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", teamId);
      if (error) throw error;
      toast({ title: "Team Deleted", description: "Team has been deleted successfully" });
      fetchTeams();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Teams / Offices
          </CardTitle>
          <CardDescription>Manage your company's teams and their service territories</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingTeam(null); setFormData({ name: "", description: "", service_zip_codes: "", service_counties: "" }); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTeam ? "Edit Team" : "Add New Team"}</DialogTitle>
              <DialogDescription>
                {editingTeam ? "Update team details" : "Create a new team for your company"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Team Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Boca Raton Office"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this team"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zips">Service ZIP Codes</Label>
                <Input
                  id="zips"
                  value={formData.service_zip_codes}
                  onChange={(e) => setFormData({ ...formData, service_zip_codes: e.target.value })}
                  placeholder="33432, 33431, 33433 (comma separated)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="counties">Service Counties</Label>
                <Input
                  id="counties"
                  value={formData.service_counties}
                  onChange={(e) => setFormData({ ...formData, service_counties: e.target.value })}
                  placeholder="Palm Beach, Broward (comma separated)"
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingTeam ? "Update Team" : "Create Team"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading teams...</p>
        ) : teams.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No teams created yet.</p>
            <p className="text-sm text-muted-foreground">Create teams to organize your staff by location or specialty.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>ZIP Codes</TableHead>
                <TableHead>Counties</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {team.member_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {team.service_zip_codes?.slice(0, 3).map(zip => (
                        <Badge key={zip} variant="outline" className="text-xs">{zip}</Badge>
                      ))}
                      {(team.service_zip_codes?.length || 0) > 3 && (
                        <Badge variant="outline" className="text-xs">+{team.service_zip_codes!.length - 3}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {team.service_counties?.map(county => (
                        <Badge key={county} variant="secondary" className="text-xs">{county}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={team.is_active ? "default" : "secondary"}>
                      {team.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(team)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(team.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
