import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, Users, Building2, Eye, Edit, Calendar, Filter } from "lucide-react";
import { format } from "date-fns";
import { TeamDialog } from "./TeamDialog";

interface Team {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  created_at: string;
  company?: {
    name: string;
  };
  member_count?: number;
}

interface Company {
  id: string;
  name: string;
}

export function TeamsTable() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'add'>('view');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamsResult, companiesResult] = await Promise.all([
        supabase.from('teams').select('*').order('created_at', { ascending: false }),
        supabase.from('permit_companies').select('id, name').order('name'),
      ]);

      if (teamsResult.error) throw teamsResult.error;

      // Get company info and member counts for each team
      const teamsWithDetails = await Promise.all(
        (teamsResult.data || []).map(async (team) => {
          const [companyResult, memberCount] = await Promise.all([
            supabase.from('permit_companies').select('name').eq('id', team.company_id).maybeSingle(),
            supabase.from('company_members').select('*', { count: 'exact', head: true }).eq('team_id', team.id),
          ]);
          return {
            ...team,
            company: companyResult.data || undefined,
            member_count: memberCount.count || 0,
          };
        })
      );

      setTeams(teamsWithDetails);
      setCompanies(companiesResult.data || []);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load teams", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleTeamClick = (team: Team, mode: 'view' | 'edit' = 'view') => {
    setSelectedTeam(team);
    setDialogMode(mode);
    setDialogOpen(true);
  };

  const handleAddTeam = () => {
    setSelectedTeam(null);
    setDialogMode('add');
    setDialogOpen(true);
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch = 
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = companyFilter === 'all' || team.company_id === companyFilter;
    return matchesSearch && matchesCompany;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAddTeam}>
          <Plus className="h-4 w-4 mr-2" />
          Add Team
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {teams.length === 0 ? "No teams yet. Click 'Add Team' to create one." : "No teams match your filters."}
                </TableCell>
              </TableRow>
            ) : (
              filteredTeams.map((team) => (
                <TableRow
                  key={team.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleTeamClick(team)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <p className="font-medium">{team.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{team.company?.name || 'Unknown'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{team.member_count}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {team.description || <span className="italic">No description</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(team.created_at), "MMM d, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => handleTeamClick(team)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleTeamClick(team, 'edit')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TeamDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        team={selectedTeam}
        mode={dialogMode}
        onModeChange={setDialogMode}
        onRefresh={fetchData}
      />
    </div>
  );
}
