import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Loader2, Building2, Home, Eye, Info } from "lucide-react";
import { AVAILABLE_FEATURES } from "@/hooks/useContractorFeatures";
import { ApplicationDetailDialog } from "./ApplicationDetailDialog";
import { RejectSignupDialog } from "./RejectSignupDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PendingContractor {
  id: string;
  user_id: string | null;
  company_name: string;
  company_id: string | null;
  category: string;
  email: string | null;
  phone: string | null;
  description: string | null;
  created_at: string | null;
  subscription_status: string | null;
  rejection_reason?: string | null;
  rejection_notes?: string | null;
  rejected_at?: string | null;
  company?: {
    id: string;
    name: string;
    verification_status: string | null;
  } | null;
}

interface NetworkMember {
  id: string;
  user_id: string;
  member_type: string;
  status: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  created_at: string | null;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

interface Company {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  company_id: string;
}

const PendingSignupsTable = () => {
  const [pendingContractors, setPendingContractors] = useState<PendingContractor[]>([]);
  const [networkMembers, setNetworkMembers] = useState<NetworkMember[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailContractor, setDetailContractor] = useState<PendingContractor | null>(null);
  const [selectedContractor, setSelectedContractor] = useState<PendingContractor | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("none");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("none");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<PendingContractor | null>(null);
  const [statusFilter, setStatusFilter] = useState<"pending" | "rejected" | "all">("pending");

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch contractors with company information based on filter
      let query = supabase
        .from("contractor_profiles")
        .select(`
          *,
          company:company_id (
            id,
            name,
            verification_status
          )
        `)
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") {
        query = query.eq("subscription_status", statusFilter);
      } else {
        query = query.in("subscription_status", ["pending", "rejected"]);
      }
      const { data: contractorsData } = await query;

      setPendingContractors(contractorsData || []);

      // Fetch recent network members
      const { data: membersData } = await supabase
        .from("network_members")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      // Fetch profiles for network members
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", userIds);

        const membersWithProfiles = membersData.map(member => ({
          ...member,
          profile: profilesData?.find(p => p.id === member.user_id)
        }));

        setNetworkMembers(membersWithProfiles);
      }

      // Fetch companies for assignment
      const { data: companiesData } = await supabase
        .from("companies")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      setCompanies(companiesData || []);

      // Fetch teams
      const { data: teamsData } = await supabase
        .from("teams")
        .select("id, name, company_id")
        .order("name");

      setTeams(teamsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (contractor: PendingContractor) => {
    try {
      setSelectedContractor(contractor);
      setSelectedCompanyId("none");
      setSelectedTeamId("none");
      setSelectedFeatures(["directory_listing"]); // Default to directory listing
      setApprovalDialogOpen(true);
    } catch (error) {
      console.error("Error opening approval dialog:", error);
      toast({
        title: "Error",
        description: "Failed to open approval dialog",
        variant: "destructive"
      });
    }
  };

  const toggleFeatureSelection = (featureKey: string) => {
    setSelectedFeatures(prev => {
      const currentFeatures = [...prev];
      if (currentFeatures.includes(featureKey)) {
        return currentFeatures.filter(f => f !== featureKey);
      }
      return [...currentFeatures, featureKey];
    });
  };

  // Create a mutable copy of features for safe iteration
  const featuresList = [...AVAILABLE_FEATURES];

  const handleApprove = async () => {
    if (!selectedContractor) return;

    setApproving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Update contractor status
      const { error: updateError } = await supabase
        .from("contractor_profiles")
        .update({
          subscription_status: "active",
          is_verified: true,
          approved_at: new Date().toISOString(),
          approved_by: user?.id ?? null,
        })
        .eq("id", selectedContractor.id);

      if (updateError) throw updateError;

      // If this contractor has a company_id (registered as company admin), ensure company is verified
      if (selectedContractor.company_id) {
        // Ensure they're set up as company admin in company_members if not already
        const { data: existingMember } = await supabase
          .from("company_members")
          .select("id, role")
          .eq("user_id", selectedContractor.user_id)
          .eq("company_id", selectedContractor.company_id)
          .maybeSingle();

        if (!existingMember && selectedContractor.user_id) {
          await supabase.from("company_members").insert({
            user_id: selectedContractor.user_id,
            company_id: selectedContractor.company_id,
            role: "company_admin",
            is_active: true
          });
        }

        // Also update company verification status
        await supabase
          .from("companies")
          .update({ 
            verification_status: "verified",
            is_active: true
          })
          .eq("id", selectedContractor.company_id);
      } else if (selectedContractor.user_id && selectedCompanyId && selectedCompanyId !== "none") {
        // If company selected from dropdown (independent contractor joining company), add to company_members
        const { error: memberError } = await supabase
          .from("company_members")
          .insert({
            user_id: selectedContractor.user_id,
            company_id: selectedCompanyId,
            team_id: selectedTeamId !== "none" ? selectedTeamId : null,
            role: "sales_rep",
            is_active: true
          });

        if (memberError) {
          console.error("Error adding to company:", memberError);
        }
      }

      // Create feature access records
      if (selectedFeatures.length > 0) {
        const featureRecords = selectedFeatures.map(featureKey => ({
          contractor_id: selectedContractor.id,
          feature_name: featureKey,
          is_approved: true,
          approved_at: new Date().toISOString(),
        }));

        const { error: featureError } = await supabase
          .from("contractor_feature_access")
          .insert(featureRecords);

        if (featureError) {
          console.error("Error creating feature access:", featureError);
        } else {
          // Send email notification about approved features
          try {
            await supabase.functions.invoke("notify-contractor-access", {
              body: {
                contractor_id: selectedContractor.id,
                approved_features: selectedFeatures,
              },
            });
          } catch (emailError) {
            console.error("Error sending notification:", emailError);
          }
        }

        // If this is a company registration, send company approval email
        if (selectedContractor.company_id && selectedContractor.email) {
          try {
            await supabase.functions.invoke("notify-company-approved", {
              body: {
                companyId: selectedContractor.company_id,
                companyName: selectedContractor.company_name,
                adminEmail: selectedContractor.email,
                adminName: `${selectedContractor.company?.name || selectedContractor.company_name}`,
                approvedFeatures: selectedFeatures.map(f => 
                  AVAILABLE_FEATURES.find(af => af.key === f)?.label || f
                )
              }
            });
          } catch (emailError) {
            console.error("Error sending company approval notification:", emailError);
          }
        }
      }

      // Generic approval email for non-company applicants (independents/handymen/etc.)
      if (!selectedContractor.company_id) {
        try {
          await supabase.functions.invoke("notify-signup-approved", {
            body: { contractorId: selectedContractor.id },
          });
        } catch (emailError) {
          console.error("Error sending approval notification:", emailError);
        }
      }

      const approvalMessage = selectedContractor.company_id
        ? `${selectedContractor.company_name} company has been approved with ${selectedFeatures.length} feature(s) enabled.`
        : `${selectedContractor.company_name} has been approved with ${selectedFeatures.length} feature(s) enabled.`;

      toast({
        title: selectedContractor.company_id ? "Company Approved" : "Contractor Approved",
        description: approvalMessage
      });

      setApprovalDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve contractor",
        variant: "destructive"
      });
    } finally {
      setApproving(false);
    }
  };

  const handleReject = (contractor: PendingContractor) => {
    setRejectTarget(contractor);
    setRejectOpen(true);
  };

  const filteredTeams = teams.filter(t => t.company_id === selectedCompanyId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pending Contractors */}
      <div>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Building2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Contractor Applications</h3>
          <Badge variant="secondary">{pendingContractors.length}</Badge>
          <div className="ml-auto">
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {pendingContractors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No pending contractor applications
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingContractors.map((contractor) => (
                  <TableRow key={contractor.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => { setDetailContractor(contractor); setDetailOpen(true); }}
                          className="text-left hover:text-primary hover:underline"
                        >
                          {contractor.company_name}
                        </button>
                        {contractor.company && (
                          <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 w-fit">
                            <Building2 className="h-3 w-3 mr-1" />
                            Company Admin
                          </Badge>
                        )}
                        {contractor.subscription_status === "rejected" && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="destructive" className="text-xs w-fit cursor-help">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Rejected
                                  <Info className="h-3 w-3 ml-1 opacity-70" />
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="font-semibold mb-1">{contractor.rejection_reason || "No reason recorded"}</p>
                                <p className="text-xs whitespace-pre-wrap">{contractor.rejection_notes || "—"}</p>
                                {contractor.rejected_at && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {format(new Date(contractor.rejected_at), "MMM d, yyyy")}
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{contractor.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{contractor.email}</div>
                        <div className="text-muted-foreground">{contractor.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contractor.created_at && format(new Date(contractor.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setDetailContractor(contractor); setDetailOpen(true); }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {contractor.subscription_status !== "rejected" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApproveClick(contractor)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(contractor)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Network Members */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Home className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Recent Network Members</h3>
          <Badge variant="secondary">{networkMembers.length}</Badge>
        </div>

        {networkMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No network members yet
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {networkMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.profile?.first_name} {member.profile?.last_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {member.member_type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{member.profile?.email}</div>
                        <div className="text-muted-foreground">{member.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.city && member.state ? `${member.city}, ${member.state}` : "-"}
                    </TableCell>
                    <TableCell>
                      {member.created_at && format(new Date(member.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.status === "active" ? "default" : "secondary"}>
                        {member.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Approval Dialog */}
      {selectedContractor && (
        <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-background">
            <DialogHeader>
              <DialogTitle>Approve Contractor</DialogTitle>
              <DialogDescription>
                Approve {selectedContractor.company_name} and select which features to enable.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Assign to Company (Optional)</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-[100]">
                    <SelectItem value="none">No company assignment</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCompanyId && selectedCompanyId !== "none" && (
                <div className="space-y-2">
                  <Label>Assign to Team (Optional)</Label>
                  <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-[100]">
                      <SelectItem value="none">No team assignment</SelectItem>
                      {filteredTeams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Grant Access To
                </Label>
                <div className="border rounded-lg p-3 space-y-3 max-h-[200px] overflow-y-auto">
                  {featuresList.map((feature) => (
                    <div key={feature.key} className="flex items-start gap-3">
                      <Checkbox
                        id={`feature-${feature.key}`}
                        checked={selectedFeatures.includes(feature.key)}
                        onCheckedChange={() => toggleFeatureSelection(feature.key)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`feature-${feature.key}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {feature.label}
                        </label>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedFeatures.length} feature(s)
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApprove} disabled={approving}>
                {approving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve & Grant Access
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <ApplicationDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        contractorId={detailContractor?.id || null}
        companyId={detailContractor?.company_id || null}
      />
    </div>
  );
};

export default PendingSignupsTable;