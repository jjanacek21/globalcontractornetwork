import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Crown, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  FileText,
  Plus,
  Phone,
  DollarSign
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { AddLeadDialog } from "@/components/supplement-kings/AddLeadDialog";
import { LeadsTable } from "@/components/supplement-kings/LeadsTable";
import { LeadDetailsDialog } from "@/components/supplement-kings/LeadDetailsDialog";
import { LeadActionsDialog } from "@/components/supplement-kings/LeadActionsDialog";

interface Lead {
  id: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  property_address: string;
  property_city: string;
  property_state?: string | null;
  property_zip?: string | null;
  claim_type: string;
  claim_number?: string | null;
  insurance_company: string | null;
  date_of_loss?: string | null;
  status: string;
  urgency: string;
  notes?: string | null;
  created_at: string;
  assigned_amount: number | null;
  settled_amount: number | null;
}

interface ContractorProfile {
  id: string;
  company_name: string;
  contact_name: string | null;
}

export default function SupplementKingsContractorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [contractor, setContractor] = useState<ContractorProfile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);
  const [actionsDialogOpen, setActionsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/supplement-kings/contractor/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/supplement-kings/contractor/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchContractorProfile();
    }
  }, [user]);

  useEffect(() => {
    if (contractor) {
      fetchLeads();
    }
  }, [contractor]);

  const fetchContractorProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('supplement_contractors')
        .select('id, company_name, contact_name')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, redirect to auth
          toast({
            title: "No contractor profile",
            description: "Please sign up as a contractor.",
            variant: "destructive"
          });
          navigate("/supplement-kings/contractor/auth");
        }
        throw error;
      }
      setContractor(data);
    } catch (error: any) {
      console.error('Error fetching contractor profile:', error);
    }
  };

  const fetchLeads = async () => {
    if (!contractor) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('supplement_leads')
        .select('*')
        .eq('contractor_id', contractor.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load leads.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/");
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailsDialogOpen(true);
  };

  const handleAction = (action: string) => {
    setActionType(action);
    setActionsDialogOpen(true);
  };

  const handleActionSuccess = () => {
    fetchLeads();
    // Refresh the details dialog data by briefly closing and reopening
    if (selectedLead) {
      setDetailsDialogOpen(false);
      setTimeout(() => setDetailsDialogOpen(true), 100);
    }
  };

  if (!user || !contractor) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Calculate stats
  const submittedCount = leads.filter(l => l.status === 'submitted').length;
  const inProgressCount = leads.filter(l => ['in_review', 'xactimate_complete', 'supplement_sent', 'negotiating'].includes(l.status)).length;
  const settledCount = leads.filter(l => l.status === 'settled').length;
  const totalSettled = leads.reduce((sum, l) => sum + (l.settled_amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-blue-500/20 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600/20 to-yellow-500/20 flex items-center justify-center">
              <Crown className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Supplement Kings</h1>
              <p className="text-xs text-slate-400">{contractor.company_name}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSignOut}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome, {contractor.contact_name || contractor.company_name}!
            </h2>
            <p className="text-slate-400">
              Submit and track your insurance claim supplements from your dashboard.
            </p>
          </div>
          <Button 
            onClick={() => setAddDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Submit New Lead
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Submitted</p>
                  <p className="text-3xl font-bold text-white">{submittedCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">In Progress</p>
                  <p className="text-3xl font-bold text-white">{inProgressCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Settled</p>
                  <p className="text-3xl font-bold text-white">{settledCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Recovered</p>
                  <p className="text-3xl font-bold text-white">${totalSettled.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leads Table */}
        <Card className="bg-slate-900/50 border-blue-500/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Your Leads</CardTitle>
            <CardDescription className="text-slate-400">
              Track the status of your submitted claims
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
              </div>
            ) : (
              <LeadsTable leads={leads} onViewLead={handleViewLead} />
            )}
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="bg-slate-900/50 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-400" />
              Need Help?
            </CardTitle>
            <CardDescription className="text-slate-400">
              Contact our team for assistance with your claims
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
              <Phone className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Phone</p>
                <p className="text-white font-medium">(954) 555-KING</p>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              Request Callback
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Add Lead Dialog */}
      {contractor && (
        <AddLeadDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSuccess={fetchLeads}
          contractorId={contractor.id}
        />
      )}

      {/* Lead Details Dialog */}
      <LeadDetailsDialog
        lead={selectedLead}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onAction={handleAction}
      />

      {/* Lead Actions Dialog */}
      {contractor && selectedLead && (
        <LeadActionsDialog
          leadId={selectedLead.id}
          contractorId={contractor.id}
          actionType={actionType}
          open={actionsDialogOpen}
          onOpenChange={setActionsDialogOpen}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
}