import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Eye, Trash2, Check, Users, Building2, Wrench, Shield, UserCheck, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

interface ContractorProfile {
  id: string;
  user_id: string | null;
  company_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  category: string;
  verification_status: string | null;
  subscription_status: string | null;
  is_verified: boolean | null;
  company_id: string | null;
  team_id: string | null;
  contractor_type: string | null;
  is_directory_eligible: boolean | null;
  license_number: string | null;
  license_state: string | null;
  created_at: string | null;
  company?: { name: string } | null;
  team?: { name: string } | null;
}

interface FeatureAccess {
  id: string;
  feature_name: string;
  is_approved: boolean;
}

interface CompanyOption {
  id: string;
  name: string;
}

interface TeamOption {
  id: string;
  name: string;
}

const AVAILABLE_FEATURES = [
  "coating_kings",
  "green_home_solutions",
  "supplement_kings",
  "permit_queens",
  "prep_your_property",
  "social_network",
  "gamification",
  "referral_network",
  "crm_access",
  "academy_access"
];

export function ContractorsTable() {
  const [contractors, setContractors] = useState<ContractorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedContractor, setSelectedContractor] = useState<ContractorProfile | null>(null);
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Assign company/team dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignContractor, setAssignContractor] = useState<ContractorProfile | null>(null);
  const [assignCompanyId, setAssignCompanyId] = useState<string | null>(null);
  const [assignTeamId, setAssignTeamId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [assignSaving, setAssignSaving] = useState(false);

  // Admin access dialog state
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminContractor, setAdminContractor] = useState<ContractorProfile | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isPermitAdmin, setIsPermitAdmin] = useState(false);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSaving, setAdminSaving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchContractors();
  }, []);

  const fetchContractors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contractor_profiles')
        .select(`
          *,
          company:companies(name),
          team:teams(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContractors(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load contractors", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    const { data } = await supabase.from('companies').select('id, name').order('name');
    setCompanies(data || []);
  };

  const fetchTeams = async (companyId: string) => {
    const { data } = await supabase.from('teams').select('id, name').eq('company_id', companyId).order('name');
    setTeams(data || []);
  };

  const handleOpenAssignDialog = async (contractor: ContractorProfile) => {
    setAssignContractor(contractor);
    setAssignCompanyId(contractor.company_id);
    setAssignTeamId(contractor.team_id);
    setTeams([]);
    await fetchCompanies();
    if (contractor.company_id) {
      await fetchTeams(contractor.company_id);
    }
    setAssignDialogOpen(true);
  };

  const handleAssignCompanyChange = async (value: string) => {
    const companyId = value === 'none' ? null : value;
    setAssignCompanyId(companyId);
    setAssignTeamId(null);
    if (companyId) {
      await fetchTeams(companyId);
    } else {
      setTeams([]);
    }
  };

  const handleSaveAssignment = async () => {
    if (!assignContractor) return;
    setAssignSaving(true);
    try {
      const { error } = await supabase
        .from('contractor_profiles')
        .update({ company_id: assignCompanyId, team_id: assignTeamId })
        .eq('id', assignContractor.id);

      if (error) throw error;
      toast({ title: "Success", description: "Company/team assignment updated" });
      setAssignDialogOpen(false);
      fetchContractors();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setAssignSaving(false);
    }
  };

  const handleOpenAdminDialog = async (contractor: ContractorProfile) => {
    if (!contractor.user_id) {
      toast({ title: "No auth account", description: "This contractor has no linked user account", variant: "destructive" });
      return;
    }
    setAdminContractor(contractor);
    setAdminLoading(true);
    setAdminDialogOpen(true);

    try {
      const [superRes, permitRes, companyRes] = await Promise.all([
        supabase.from('super_admins').select('id').eq('user_id', contractor.user_id).maybeSingle(),
        supabase.from('permit_admins').select('id').eq('user_id', contractor.user_id).maybeSingle(),
        contractor.company_id
          ? supabase.from('company_admins').select('id').eq('user_id', contractor.user_id).eq('company_id', contractor.company_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      setIsSuperAdmin(!!superRes.data);
      setIsPermitAdmin(!!permitRes.data);
      setIsCompanyAdmin(!!companyRes.data);
    } catch {
      toast({ title: "Error loading admin roles", variant: "destructive" });
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSaveAdminRoles = async () => {
    if (!adminContractor?.user_id) return;
    setAdminSaving(true);
    const userId = adminContractor.user_id;

    try {
      // Super Admin
      const { data: existingSuper } = await supabase.from('super_admins').select('id').eq('user_id', userId).maybeSingle();
      if (isSuperAdmin && !existingSuper) {
        await supabase.from('super_admins').insert({ user_id: userId });
      } else if (!isSuperAdmin && existingSuper) {
        await supabase.from('super_admins').delete().eq('user_id', userId);
      }

      // Permit Admin
      const { data: existingPermit } = await supabase.from('permit_admins').select('id').eq('user_id', userId).maybeSingle();
      if (isPermitAdmin && !existingPermit) {
        await supabase.from('permit_admins').insert({ user_id: userId });
      } else if (!isPermitAdmin && existingPermit) {
        await supabase.from('permit_admins').delete().eq('user_id', userId);
      }

      // Company Admin
      if (adminContractor.company_id) {
        const { data: existingCompany } = await supabase.from('company_admins').select('id').eq('user_id', userId).eq('company_id', adminContractor.company_id).maybeSingle();
        if (isCompanyAdmin && !existingCompany) {
          await supabase.from('company_admins').insert({ user_id: userId, company_id: adminContractor.company_id });
        } else if (!isCompanyAdmin && existingCompany) {
          await supabase.from('company_admins').delete().eq('user_id', userId).eq('company_id', adminContractor.company_id);
        }
      }

      toast({ title: "Admin roles updated" });
      setAdminDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error saving admin roles", description: error.message, variant: "destructive" });
    } finally {
      setAdminSaving(false);
    }
  };

  const handleManageFeatures = async (contractor: ContractorProfile) => {
    setSelectedContractor(contractor);
    const { data: features } = await supabase
      .from('contractor_feature_access')
      .select('*')
      .eq('contractor_id', contractor.id);
    
    setFeatureAccess(features || []);
    setSelectedFeatures((features || []).filter(f => f.is_approved).map(f => f.feature_name));
    setFeatureDialogOpen(true);
  };

  const handleSaveFeatures = async () => {
    if (!selectedContractor) return;
    setSaving(true);
    try {
      await supabase
        .from('contractor_feature_access')
        .delete()
        .eq('contractor_id', selectedContractor.id);

      if (selectedFeatures.length > 0) {
        const { error } = await supabase
          .from('contractor_feature_access')
          .insert(selectedFeatures.map(feature => ({
            contractor_id: selectedContractor.id,
            feature_name: feature,
            is_approved: true,
            approved_at: new Date().toISOString()
          })));
        if (error) throw error;
      }

      toast({ title: "Success", description: "Feature access updated" });
      setFeatureDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (contractor: ContractorProfile) => {
    try {
      const { error } = await supabase
        .from('contractor_profiles')
        .update({ subscription_status: 'active', verification_status: 'approved' })
        .eq('id', contractor.id);
      if (error) throw error;
      toast({ title: "Success", description: "Contractor approved" });
      fetchContractors();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (contractor: ContractorProfile) => {
    setDeleting(contractor.id);
    try {
      const { error } = await supabase
        .from('contractor_profiles')
        .delete()
        .eq('id', contractor.id);
      if (error) throw error;
      toast({ title: "Success", description: "Contractor deleted" });
      fetchContractors();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const getContractorTypeBadge = (type: string | null) => {
    switch (type) {
      case 'subcontractor':
        return <Badge className="bg-blue-100 text-blue-800"><Building2 className="h-3 w-3 mr-1" />Sub-Contractor</Badge>;
      case 'handyman':
        return <Badge className="bg-orange-100 text-orange-800"><Wrench className="h-3 w-3 mr-1" />Handyman</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800"><Users className="h-3 w-3 mr-1" />Independent</Badge>;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><Shield className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  const filteredContractors = contractors.filter(c => {
    const matchesSearch = 
      c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || c.contractor_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || c.verification_status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
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
        <div className="flex flex-wrap gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contractors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="independent">Independent</SelectItem>
              <SelectItem value="subcontractor">Sub-Contractor</SelectItem>
              <SelectItem value="handyman">Handyman</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredContractors.length} contractors
        </Badge>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contractor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Company/Team</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Directory</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContractors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No contractors found
                </TableCell>
              </TableRow>
            ) : (
              filteredContractors.map((contractor) => (
                <TableRow key={contractor.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{contractor.company_name}</p>
                      {(contractor.first_name || contractor.last_name) && (
                        <p className="text-sm text-muted-foreground">
                          {contractor.first_name} {contractor.last_name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">{contractor.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getContractorTypeBadge(contractor.contractor_type)}</TableCell>
                  <TableCell>
                    {contractor.company?.name ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        {contractor.company.name}
                        {contractor.team?.name && (
                          <span className="text-muted-foreground"> / {contractor.team.name}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(contractor.verification_status)}</TableCell>
                  <TableCell>
                    {contractor.is_directory_eligible ? (
                      <Badge className="bg-green-100 text-green-800"><UserCheck className="h-3 w-3 mr-1" />Listed</Badge>
                    ) : (
                      <Badge variant="secondary">Not Listed</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {contractor.created_at && format(new Date(contractor.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleOpenAssignDialog(contractor)} title="Assign to Company/Team">
                        <Building2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleManageFeatures(contractor)} title="Manage Features">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {contractor.subscription_status === 'pending' && (
                        <Button size="icon" variant="ghost" onClick={() => handleApprove(contractor)} title="Approve">
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" disabled={deleting === contractor.id}>
                            {deleting === contractor.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Contractor</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {contractor.company_name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(contractor)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assign Company/Team Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Assign to Company/Team
            </DialogTitle>
            <DialogDescription>{assignContractor?.company_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Company</Label>
              <Select value={assignCompanyId || 'none'} onValueChange={handleAssignCompanyChange}>
                <SelectTrigger><SelectValue placeholder="No company" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Company</SelectItem>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {assignCompanyId && (
              <div>
                <Label>Team</Label>
                <Select value={assignTeamId || 'none'} onValueChange={v => setAssignTeamId(v === 'none' ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="No team" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Team</SelectItem>
                    {teams.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAssignment} disabled={assignSaving}>
              {assignSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feature Access Dialog */}
      <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Feature Access</DialogTitle>
            <DialogDescription>{selectedContractor?.company_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_FEATURES.map(feature => (
                <label key={feature} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedFeatures.includes(feature)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFeatures([...selectedFeatures, feature]);
                      } else {
                        setSelectedFeatures(selectedFeatures.filter(f => f !== feature));
                      }
                    }}
                  />
                  <span className="text-sm capitalize">{feature.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeatureDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveFeatures} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ContractorsTable;
