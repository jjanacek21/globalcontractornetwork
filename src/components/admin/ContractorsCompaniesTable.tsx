import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, Loader2, Eye, Edit, Shield, Building2, Users, MapPin, CheckCircle2, AlertTriangle, AlertCircle, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { CompanyManagementDialog } from "./CompanyManagementDialog";

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
  company_id: string | null;
  team_id: string | null;
  service_area: string[] | null;
  created_at: string | null;
  company?: { name: string } | null;
}

interface CredentialWarnings {
  insurance_expired?: boolean;
  insurance_days_expired?: number;
  insurance_expiring_soon?: boolean;
  insurance_days_remaining?: number;
  insurance_expiring_14?: boolean;
  insurance_expiring_30?: boolean;
  workers_comp_expired?: boolean;
  workers_comp_days_expired?: number;
  workers_comp_expiring_soon?: boolean;
  workers_comp_days_remaining?: number;
  workers_comp_expiring_14?: boolean;
  workers_comp_expiring_30?: boolean;
  licenses_expired?: string[];
  licenses_expiring?: string[];
}

interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  website: string | null;
  description: string | null;
  verification_status: string | null;
  verification_score: number | null;
  is_active: boolean | null;
  created_at: string | null;
  insurance_expiration: string | null;
  workers_comp_expiration: string | null;
  license_number: string | null;
  license_state: string | null;
  license_expiration: string | null;
  primary_category: string | null;
  years_in_business: number | null;
  credential_warnings: CredentialWarnings | null;
}

interface FeatureAccess {
  id: string;
  contractor_id: string;
  feature_name: string;
  is_approved: boolean | null;
}

const AVAILABLE_FEATURES = [
  "crm_access",
  "field_map",
  "estimates_tool",
  "social_network",
  "academy_resources",
  "referral_system",
  "presentations",
  "lead_pipeline",
  "rewards_dashboard"
];

export default function ContractorsCompaniesTable() {
  const [loading, setLoading] = useState(true);
  const [contractors, setContractors] = useState<ContractorProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewFilter, setViewFilter] = useState<"all" | "contractors" | "companies">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [credentialFilter, setCredentialFilter] = useState("all");
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<ContractorProfile | null>(null);
  const [contractorFeatures, setContractorFeatures] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Company dialog state
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyDialogMode, setCompanyDialogMode] = useState<'view' | 'edit'>('view');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractorsRes, companiesRes] = await Promise.all([
        supabase
          .from("contractor_profiles")
          .select("*, company:companies(name)")
          .order("created_at", { ascending: false }),
        supabase
          .from("companies")
          .select("*")
          .order("created_at", { ascending: false })
      ]);

      if (contractorsRes.error) throw contractorsRes.error;
      if (companiesRes.error) throw companiesRes.error;

      setContractors(contractorsRes.data || []);
      setCompanies((companiesRes.data || []).map(c => ({
        ...c,
        credential_warnings: c.credential_warnings as CredentialWarnings | null
      })));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEditContractor = async (contractor: ContractorProfile) => {
    setSelectedContractor(contractor);
    
    // Fetch current feature access
    const { data: features } = await supabase
      .from("contractor_feature_access")
      .select("*")
      .eq("contractor_id", contractor.id);
    
    const featureMap: Record<string, boolean> = {};
    AVAILABLE_FEATURES.forEach(f => {
      const existing = features?.find(fa => fa.feature_name === f);
      featureMap[f] = existing?.is_approved || false;
    });
    setContractorFeatures(featureMap);
    setEditDialogOpen(true);
  };

  const handleSaveFeatures = async () => {
    if (!selectedContractor) return;
    setSaving(true);
    
    try {
      // Delete existing and insert new
      await supabase
        .from("contractor_feature_access")
        .delete()
        .eq("contractor_id", selectedContractor.id);

      const featuresToInsert = Object.entries(contractorFeatures)
        .filter(([_, enabled]) => enabled)
        .map(([feature]) => ({
          contractor_id: selectedContractor.id,
          feature_name: feature,
          is_approved: true,
          approved_at: new Date().toISOString()
        }));

      if (featuresToInsert.length > 0) {
        const { error } = await supabase
          .from("contractor_feature_access")
          .insert(featuresToInsert);
        if (error) throw error;
      }

      toast({ title: "Success", description: "Feature access updated successfully" });
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error saving features:", error);
      toast({ title: "Error", description: "Failed to save feature access", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleApproveContractor = async (contractor: ContractorProfile) => {
    try {
      const { error } = await supabase
        .from("contractor_profiles")
        .update({ 
          verification_status: "approved",
          subscription_status: "active"
        })
        .eq("id", contractor.id);

      if (error) throw error;
      
      toast({ title: "Success", description: `${contractor.company_name} has been approved` });
      fetchData();
    } catch (error) {
      console.error("Error approving contractor:", error);
      toast({ title: "Error", description: "Failed to approve contractor", variant: "destructive" });
    }
  };

  const handleCompanyClick = (company: Company, mode: 'view' | 'edit' = 'view') => {
    setSelectedCompany(company);
    setCompanyDialogMode(mode);
    setCompanyDialogOpen(true);
  };

  const handleDeleteContractor = async (contractor: ContractorProfile) => {
    setDeletingId(contractor.id);
    try {
      const { error } = await supabase
        .from("contractor_profiles")
        .delete()
        .eq("id", contractor.id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Contractor deleted successfully" });
      fetchData();
    } catch (error: any) {
      console.error("Error deleting contractor:", error);
      toast({ title: "Error", description: error.message || "Failed to delete contractor", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const getCredentialStatus = (company: Company) => {
    const warnings = company.credential_warnings;
    if (!warnings) return null;

    const issues = [];
    
    if (warnings.insurance_expired) {
      issues.push({ type: "expired", label: "Insurance Expired", severity: "critical" });
    } else if (warnings.insurance_expiring_soon) {
      issues.push({ type: "expiring", label: `Insurance ${warnings.insurance_days_remaining}d`, severity: "critical" });
    } else if (warnings.insurance_expiring_14) {
      issues.push({ type: "warning", label: "Insurance <14d", severity: "warning" });
    } else if (warnings.insurance_expiring_30) {
      issues.push({ type: "info", label: "Insurance <30d", severity: "info" });
    }

    if (warnings.workers_comp_expired) {
      issues.push({ type: "expired", label: "Workers Comp Expired", severity: "critical" });
    } else if (warnings.workers_comp_expiring_soon) {
      issues.push({ type: "expiring", label: `Workers Comp ${warnings.workers_comp_days_remaining}d`, severity: "critical" });
    } else if (warnings.workers_comp_expiring_14) {
      issues.push({ type: "warning", label: "Workers Comp <14d", severity: "warning" });
    } else if (warnings.workers_comp_expiring_30) {
      issues.push({ type: "info", label: "Workers Comp <30d", severity: "info" });
    }

    if (warnings.licenses_expired && warnings.licenses_expired.length > 0) {
      issues.push({ type: "expired", label: `${warnings.licenses_expired.length} License(s) Expired`, severity: "warning" });
    }
    if (warnings.licenses_expiring && warnings.licenses_expiring.length > 0) {
      issues.push({ type: "warning", label: `${warnings.licenses_expiring.length} License(s) Expiring`, severity: "info" });
    }

    return issues;
  };

  const hasCredentialIssues = (company: Company) => {
    const issues = getCredentialStatus(company);
    return issues && issues.length > 0;
  };

  const hasExpiredCredentials = (company: Company) => {
    const warnings = company.credential_warnings;
    if (!warnings) return false;
    return warnings.insurance_expired || warnings.workers_comp_expired || 
           (warnings.licenses_expired && warnings.licenses_expired.length > 0);
  };

  // Get unique locations for filter
  const allLocations = [...new Set([
    ...contractors.flatMap(c => c.service_area || []),
    ...companies.map(c => c.state).filter(Boolean)
  ])].sort() as string[];

  // Filter data
  const filteredContractors = contractors.filter(c => {
    const matchesSearch = 
      c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      c.verification_status === statusFilter ||
      c.subscription_status === statusFilter;
    const matchesLocation = locationFilter === "all" || 
      c.service_area?.includes(locationFilter);
    return matchesSearch && matchesStatus && matchesLocation;
  });

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      c.verification_status === statusFilter;
    const matchesLocation = locationFilter === "all" || 
      c.state === locationFilter;
    const matchesCredential = credentialFilter === "all" ||
      (credentialFilter === "expired" && hasExpiredCredentials(c)) ||
      (credentialFilter === "expiring" && hasCredentialIssues(c) && !hasExpiredCredentials(c)) ||
      (credentialFilter === "valid" && !hasCredentialIssues(c));
    return matchesSearch && matchesStatus && matchesLocation && matchesCredential;
  });

  const getStatusBadge = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "rejected":
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">{status}</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const CredentialBadges = ({ company }: { company: Company }) => {
    const issues = getCredentialStatus(company);
    if (!issues || issues.length === 0) {
      return <Badge className="bg-green-100 text-green-800">✓ Valid</Badge>;
    }

    return (
      <TooltipProvider>
        <div className="flex flex-wrap gap-1">
          {issues.map((issue, idx) => (
            <Tooltip key={idx}>
              <TooltipTrigger>
                <Badge 
                  className={
                    issue.severity === "critical" 
                      ? "bg-red-100 text-red-800" 
                      : issue.severity === "warning"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {issue.severity === "critical" && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {issue.severity === "warning" && <AlertCircle className="h-3 w-3 mr-1" />}
                  {issue.severity === "info" && <Clock className="h-3 w-3 mr-1" />}
                  {issue.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{issue.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Count companies with expired credentials
  const expiredCount = companies.filter(c => hasExpiredCredentials(c)).length;
  const expiringCount = companies.filter(c => hasCredentialIssues(c) && !hasExpiredCredentials(c)).length;

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      {(expiredCount > 0 || expiringCount > 0) && (
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
          {expiredCount > 0 && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">{expiredCount} with expired credentials</span>
            </div>
          )}
          {expiringCount > 0 && (
            <div className="flex items-center gap-2 text-orange-600">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{expiringCount} with expiring credentials</span>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={viewFilter} onValueChange={(v: "all" | "contractors" | "companies") => setViewFilter(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="View" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="contractors">Contractors Only</SelectItem>
            <SelectItem value="companies">Companies Only</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={credentialFilter} onValueChange={setCredentialFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Credentials" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Credentials</SelectItem>
            <SelectItem value="expired">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                Expired
              </span>
            </SelectItem>
            <SelectItem value="expiring">
              <span className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-orange-500" />
                Expiring Soon
              </span>
            </SelectItem>
            <SelectItem value="valid">Valid</SelectItem>
          </SelectContent>
        </Select>

        {allLocations.length > 0 && (
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {allLocations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Combined Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Category/Trade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Credentials</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Show Companies first if not filtered out */}
            {(viewFilter === "all" || viewFilter === "companies") && filteredCompanies.map(company => (
              <TableRow 
                key={`company-${company.id}`}
                className={hasExpiredCredentials(company) ? "bg-red-50" : ""}
              >
                <TableCell>
                  <Badge variant="outline" className="gap-1">
                    <Building2 className="h-3 w-3" />
                    Company
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {hasExpiredCredentials(company) && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">{company.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {company.email && <div>{company.email}</div>}
                    {company.phone && <div className="text-muted-foreground">{company.phone}</div>}
                  </div>
                </TableCell>
                <TableCell>—</TableCell>
                <TableCell>{getStatusBadge(company.verification_status)}</TableCell>
                <TableCell>
                  <CredentialBadges company={company} />
                </TableCell>
                <TableCell>
                  {company.city && company.state ? (
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" />
                      {company.city}, {company.state}
                    </div>
                  ) : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {company.created_at ? format(new Date(company.created_at), "MMM d, yyyy") : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleCompanyClick(company, 'view')}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleCompanyClick(company, 'edit')}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {/* Show Contractors */}
            {(viewFilter === "all" || viewFilter === "contractors") && filteredContractors.map(contractor => (
              <TableRow key={`contractor-${contractor.id}`}>
                <TableCell>
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    Contractor
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{contractor.company_name}</div>
                    {contractor.first_name && (
                      <div className="text-sm text-muted-foreground">
                        {contractor.first_name} {contractor.last_name}
                      </div>
                    )}
                    {contractor.company && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {contractor.company.name}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {contractor.email && <div>{contractor.email}</div>}
                    {contractor.phone && <div className="text-muted-foreground">{contractor.phone}</div>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{contractor.category}</Badge>
                </TableCell>
                <TableCell>{getStatusBadge(contractor.verification_status || contractor.subscription_status)}</TableCell>
                <TableCell>—</TableCell>
                <TableCell>
                  {contractor.service_area && contractor.service_area.length > 0 ? (
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" />
                      {contractor.service_area.slice(0, 2).join(", ")}
                      {contractor.service_area.length > 2 && ` +${contractor.service_area.length - 2}`}
                    </div>
                  ) : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {contractor.created_at ? format(new Date(contractor.created_at), "MMM d, yyyy") : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {contractor.subscription_status === "pending" && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-green-600"
                        onClick={() => handleApproveContractor(contractor)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => handleEditContractor(contractor)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleEditContractor(contractor)}>
                      <Shield className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive"
                          disabled={deletingId === contractor.id}
                        >
                          {deletingId === contractor.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Contractor</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove <strong>{contractor.company_name}</strong> from the network? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteContractor(contractor)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {filteredContractors.length === 0 && filteredCompanies.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No contractors or companies found matching your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog for Feature Access */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Contractor: {selectedContractor?.company_name}</DialogTitle>
            <DialogDescription>
              Manage feature access for this contractor
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label className="text-base font-medium">Feature Access</Label>
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_FEATURES.map(feature => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature}
                      checked={contractorFeatures[feature] || false}
                      onCheckedChange={(checked) => 
                        setContractorFeatures(prev => ({ ...prev, [feature]: !!checked }))
                      }
                    />
                    <Label htmlFor={feature} className="text-sm capitalize">
                      {feature.replace(/_/g, " ")}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFeatures} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Company Management Dialog */}
      <CompanyManagementDialog
        open={companyDialogOpen}
        onOpenChange={setCompanyDialogOpen}
        company={selectedCompany}
        mode={companyDialogMode}
        onModeChange={setCompanyDialogMode}
        onRefresh={fetchData}
      />
    </div>
  );
}
