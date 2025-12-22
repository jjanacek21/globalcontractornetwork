import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, User, Building2, Eye, Edit, Calendar, Filter } from "lucide-react";
import { format } from "date-fns";
import { UserManagementDialog } from "./UserManagementDialog";

interface CompanyMember {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  manager_id: string | null;
  team_id: string | null;
  is_active: boolean;
  job_title: string | null;
  hire_date: string | null;
  created_at: string;
  profile?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  company?: {
    name: string;
  };
}

interface Company {
  id: string;
  name: string;
}

const ROLE_COLORS: Record<string, string> = {
  company_admin: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  project_manager: 'bg-indigo-100 text-indigo-800',
  sales_rep: 'bg-green-100 text-green-800',
  crew: 'bg-orange-100 text-orange-800',
};

const ROLE_LABELS: Record<string, string> = {
  company_admin: 'Company Admin',
  manager: 'Manager',
  project_manager: 'Project Manager',
  sales_rep: 'Sales Rep',
  crew: 'Crew',
};

export function UsersTable() {
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState<CompanyMember | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'add'>('view');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersResult, companiesResult] = await Promise.all([
        supabase.from('company_members').select('*').order('created_at', { ascending: false }),
        supabase.from('companies').select('id, name').order('name'),
      ]);

      if (membersResult.error) throw membersResult.error;

      // Get profiles and company info for each member
      const membersWithDetails = await Promise.all(
        (membersResult.data || []).map(async (member) => {
          const [profileResult, companyResult] = await Promise.all([
            supabase.from('profiles').select('email, first_name, last_name').eq('id', member.user_id).maybeSingle(),
            supabase.from('companies').select('name').eq('id', member.company_id).maybeSingle(),
          ]);
          return {
            ...member,
            profile: profileResult.data || undefined,
            company: companyResult.data || undefined,
          };
        })
      );

      setMembers(membersWithDetails);
      setCompanies(companiesResult.data || []);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleMemberClick = (member: CompanyMember, mode: 'view' | 'edit' = 'view') => {
    setSelectedMember(member);
    setDialogMode(mode);
    setDialogOpen(true);
  };

  const handleAddUser = () => {
    setSelectedMember(null);
    setDialogMode('add');
    setDialogOpen(true);
  };

  const filteredMembers = members.filter(member => {
    const fullName = `${member.profile?.first_name || ''} ${member.profile?.last_name || ''}`.toLowerCase();
    const email = member.profile?.email?.toLowerCase() || '';
    const matchesSearch = 
      fullName.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase()) ||
      member.job_title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = companyFilter === 'all' || member.company_id === companyFilter;
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesCompany && matchesRole;
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
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
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
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleAddUser}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {members.length === 0 ? "No users yet. Click 'Add User' to create one." : "No users match your filters."}
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow
                  key={member.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleMemberClick(member)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {member.profile?.first_name || member.profile?.last_name
                            ? `${member.profile.first_name || ''} ${member.profile.last_name || ''}`
                            : 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">{member.profile?.email || 'No email'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{member.company?.name || 'Unknown'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={ROLE_COLORS[member.role] || 'bg-gray-100 text-gray-800'}>
                      {ROLE_LABELS[member.role] || member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {member.job_title || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.is_active ? "default" : "secondary"}>
                      {member.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(member.created_at), "MMM d, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => handleMemberClick(member)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleMemberClick(member, 'edit')}>
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

      <UserManagementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        member={selectedMember}
        mode={dialogMode}
        onModeChange={setDialogMode}
        onRefresh={fetchData}
      />
    </div>
  );
}
