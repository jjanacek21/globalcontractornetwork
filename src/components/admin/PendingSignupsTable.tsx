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
import { CheckCircle2, XCircle, Loader2, Building2, Home } from "lucide-react";
import { AVAILABLE_FEATURES } from "@/hooks/useContractorFeatures";

interface PendingContractor {
  id: string;
  user_id: string | null;
  company_name: string;
  category: string;
  email: string | null;
  phone: string | null;
  description: string | null;
  created_at: string | null;
  subscription_status: string | null;
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
  const [selectedContractor, setSelectedContractor] = useState<PendingContractor | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("none");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("none");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch pending contractors
      const { data: contractorsData } = await supabase
        .from("contractor_profiles")
        .select("*")
        .eq("subscription_status", "pending")
        .order("created_at", { ascending: false });

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
      // Update contractor status
      const { error: updateError } = await supabase
        .from("contractor_profiles")
        .update({ 
          subscription_status: "active",
          is_verified: true
        })
        .eq("id", selectedContractor.id);

      if (updateError) throw updateError;

      // If company selected, add to company_members
      if (selectedContractor.user_id && selectedCompanyId && selectedCompanyId !== "none") {
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
      }

      toast({
        title: "Contractor Approved",
        description: `${selectedContractor.company_name} has been approved with ${selectedFeatures.length} feature(s) enabled.`
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

  const handleReject = async (contractor: PendingContractor) => {
    if (!confirm(`Are you sure you want to reject ${contractor.company_name}?`)) return;

    try {
      const { error } = await supabase
        .from("contractor_profiles")
        .update({ subscription_status: "rejected" })
        .eq("id", contractor.id);

      if (error) throw error;

      toast({
        title: "Contractor Rejected",
        description: `${contractor.company_name} has been rejected.`
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject contractor",
        variant: "destructive"
      });
    }
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
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Pending Contractor Applications</h3>
          <Badge variant="secondary">{pendingContractors.length}</Badge>
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
                    <TableCell className="font-medium">{contractor.company_name}</TableCell>
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
    </div>
  );
};

export default PendingSignupsTable;