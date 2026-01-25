import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Loader2, FileText, Clock, CheckCircle, AlertCircle, 
  DollarSign, RefreshCw, Eye, MessageSquare, Crown, Brain, Upload, BarChart3
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { PermitDetailDialog } from "./PermitDetailDialog";
import PermitTrainingUploader from "./PermitTrainingUploader";
import PermitBatchUploader from "./PermitBatchUploader";
import TrainingSamplesTable from "./TrainingSamplesTable";
import PermitTrainingAnalytics from "./PermitTrainingAnalytics";
import { toast } from "sonner";

interface PermitProject {
  id: string;
  property_address: string;
  customer_name: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  permit_type: string;
  jurisdiction_county: string;
  pipeline_status: string;
  packet_status: string;
  city_review_status: string;
  payment_status: string;
  valuation: number;
  created_at: string;
  updated_at: string;
  ready_for_payment_notified_at: string | null;
  city_submission_date: string | null;
  complexity_tier: string;
  contractor_profile_id: string | null;
  user_id: string | null;
}

const PIPELINE_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'intake', label: 'New Request' },
  { value: 'gathering_info', label: 'Gathering Info' },
  { value: 'documents_submitted', label: 'Docs Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'pending_city_review', label: 'City Review' },
  { value: 'ready_for_payment', label: 'Ready for Payment' },
  { value: 'approved', label: 'Approved' },
  { value: 'issued', label: 'Permit Issued' },
];

const STATUS_COLORS: Record<string, string> = {
  'intake': 'bg-blue-100 text-blue-800 border-blue-200',
  'gathering_info': 'bg-amber-100 text-amber-800 border-amber-200',
  'documents_submitted': 'bg-purple-100 text-purple-800 border-purple-200',
  'under_review': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'pending_city_review': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'ready_for_payment': 'bg-orange-100 text-orange-800 border-orange-200',
  'approved': 'bg-green-100 text-green-800 border-green-200',
  'issued': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'rejected': 'bg-red-100 text-red-800 border-red-200',
};

export default function PermitExpeditingTab() {
  const [permits, setPermits] = useState<PermitProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPermit, setSelectedPermit] = useState<PermitProject | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("queue");
  const [trainingRefresh, setTrainingRefresh] = useState(0);
  const [trainingMode, setTrainingMode] = useState<"single" | "batch">("batch");

  useEffect(() => {
    fetchPermits();
  }, []);

  const fetchPermits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('permit_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPermits(data || []);
    } catch (error: any) {
      console.error('Error fetching permits:', error);
      toast.error('Failed to load permits');
    } finally {
      setLoading(false);
    }
  };

  const filteredPermits = permits.filter(permit => {
    const matchesSearch = 
      permit.property_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.owner_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || permit.pipeline_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = () => {
    const counts: Record<string, number> = {};
    permits.forEach(p => {
      counts[p.pipeline_status] = (counts[p.pipeline_status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  const handleViewPermit = (permit: PermitProject) => {
    setSelectedPermit(permit);
    setDialogOpen(true);
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
    return (
      <Badge className={`${colorClass} border`}>
        {status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full max-w-xl grid-cols-3">
        <TabsTrigger value="queue" className="flex items-center gap-2">
          <Crown className="h-4 w-4" />
          Permit Queue
        </TabsTrigger>
        <TabsTrigger value="training" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          AI Training
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Analytics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="queue" className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">New</p>
                <p className="text-2xl font-bold text-blue-800">{statusCounts['intake'] || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm text-amber-600 font-medium">In Progress</p>
                <p className="text-2xl font-bold text-amber-800">
                  {(statusCounts['gathering_info'] || 0) + (statusCounts['documents_submitted'] || 0) + (statusCounts['under_review'] || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cyan-50 border-cyan-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-cyan-600" />
              <div>
                <p className="text-sm text-cyan-600 font-medium">City Review</p>
                <p className="text-2xl font-bold text-cyan-800">{statusCounts['pending_city_review'] || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600 font-medium">Ready to Pay</p>
                <p className="text-2xl font-bold text-orange-800">{statusCounts['ready_for_payment'] || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Approved</p>
                <p className="text-2xl font-bold text-green-800">{statusCounts['approved'] || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm text-emerald-600 font-medium">Issued</p>
                <p className="text-2xl font-bold text-emerald-800">{statusCounts['issued'] || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Permit Expediting Queue
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search permits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchPermits}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPermits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No permits found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Property</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Jurisdiction</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Valuation</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Submitted</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPermits.map(permit => (
                    <tr key={permit.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="max-w-xs truncate font-medium">
                          {permit.property_address}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{permit.owner_name || permit.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{permit.owner_email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize">
                          {permit.permit_type?.replace('_', ' ') || 'N/A'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {permit.jurisdiction_county || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(permit.pipeline_status)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {formatCurrency(permit.valuation)}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(permit.created_at), { addSuffix: true })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewPermit(permit)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewPermit(permit)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permit Detail Dialog */}
      <PermitDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        permit={selectedPermit}
        onRefresh={fetchPermits}
      />
      </TabsContent>

      <TabsContent value="training" className="space-y-6">
        {/* Upload Mode Toggle */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm font-medium text-muted-foreground">Upload Mode:</span>
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <Button
              variant={trainingMode === "batch" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTrainingMode("batch")}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Batch Upload
            </Button>
            <Button
              variant={trainingMode === "single" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTrainingMode("single")}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Single Upload
            </Button>
          </div>
        </div>

        {/* Conditional Uploader */}
        {trainingMode === "batch" ? (
          <PermitBatchUploader 
            onBatchComplete={() => setTrainingRefresh(prev => prev + 1)} 
          />
        ) : (
          <PermitTrainingUploader 
            onUploadComplete={() => setTrainingRefresh(prev => prev + 1)} 
          />
        )}
        
        <TrainingSamplesTable refreshTrigger={trainingRefresh} />
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6">
        <PermitTrainingAnalytics />
      </TabsContent>
    </Tabs>
  );
}
