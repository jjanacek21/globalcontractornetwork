import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Filter } from "lucide-react";
import { format } from "date-fns";

interface CompanyLeadsTabProps {
  companyId: string;
}

interface Lead {
  id: string;
  status: string;
  quoted_amount: number | null;
  created_at: string;
  contractor_id: string;
  project?: {
    id: string;
    service_type: string;
    property_address: string;
    homeowner?: {
      first_name: string;
      last_name: string;
    };
  };
  contractor?: {
    company_name: string;
    first_name: string;
    last_name: string;
  };
}

export const CompanyLeadsTab = ({ companyId }: CompanyLeadsTabProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        // First get all contractor profiles for this company
        const { data: contractors } = await supabase
          .from("contractor_profiles")
          .select("id")
          .eq("company_id", companyId);

        if (!contractors || contractors.length === 0) {
          setLeads([]);
          setLoading(false);
          return;
        }

        const contractorIds = contractors.map(c => c.id);

        // Fetch leads for these contractors
        const { data, error } = await supabase
          .from("contractor_leads")
          .select(`
            *,
            project:homeowner_projects(
              id,
              service_type,
              property_address
            ),
            contractor:contractor_profiles(
              company_name,
              first_name,
              last_name
            )
          `)
          .in("contractor_id", contractorIds)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setLeads(data || []);
      } catch (error) {
        console.error("Error fetching leads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [companyId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-500">New</Badge>;
      case "contacted":
        return <Badge className="bg-yellow-500">Contacted</Badge>;
      case "quoted":
        return <Badge className="bg-purple-500">Quoted</Badge>;
      case "won":
        return <Badge className="bg-green-500">Won</Badge>;
      case "lost":
        return <Badge variant="destructive">Lost</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredLeads = statusFilter === "all" 
    ? leads 
    : leads.filter(l => l.status === statusFilter);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Company Leads
          </CardTitle>
          <CardDescription>View and manage leads across your company</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="quoted">Quoted</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading leads...</p>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No leads found.</p>
            <p className="text-sm text-muted-foreground">Leads will appear here when customers request services.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Quote</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{format(new Date(lead.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="font-medium">
                    {lead.project?.homeowner?.first_name} {lead.project?.homeowner?.last_name}
                  </TableCell>
                  <TableCell>{lead.project?.service_type || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {lead.project?.property_address || "-"}
                  </TableCell>
                  <TableCell>
                    {lead.contractor?.first_name} {lead.contractor?.last_name}
                  </TableCell>
                  <TableCell>
                    {lead.quoted_amount ? `$${lead.quoted_amount.toLocaleString()}` : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(lead.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
