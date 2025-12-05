import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText } from "lucide-react";
import { format } from "date-fns";

interface Lead {
  id: string;
  customer_name: string;
  property_address: string;
  property_city: string;
  claim_type: string;
  insurance_company: string | null;
  status: string;
  urgency: string;
  created_at: string;
  assigned_amount: number | null;
  settled_amount: number | null;
}

interface LeadsTableProps {
  leads: Lead[];
  onViewLead?: (lead: Lead) => void;
}

const statusColors: Record<string, string> = {
  submitted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_review: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  xactimate_complete: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  supplement_sent: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  negotiating: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  settled: "bg-green-500/20 text-green-400 border-green-500/30",
};

const urgencyColors: Record<string, string> = {
  standard: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  urgent: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  rush: "bg-red-500/20 text-red-400 border-red-500/30",
};

const claimTypeLabels: Record<string, string> = {
  wind: "Wind",
  hail: "Hail",
  water: "Water",
  fire: "Fire",
  other: "Other",
};

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  in_review: "In Review",
  xactimate_complete: "Xactimate Complete",
  supplement_sent: "Supplement Sent",
  negotiating: "Negotiating",
  settled: "Settled",
};

export function LeadsTable({ leads, onViewLead }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-300 mb-2">No leads yet</h3>
        <p className="text-slate-500">Submit your first lead to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700 hover:bg-transparent">
            <TableHead className="text-slate-400">Customer</TableHead>
            <TableHead className="text-slate-400">Property</TableHead>
            <TableHead className="text-slate-400">Claim Type</TableHead>
            <TableHead className="text-slate-400">Insurance</TableHead>
            <TableHead className="text-slate-400">Status</TableHead>
            <TableHead className="text-slate-400">Urgency</TableHead>
            <TableHead className="text-slate-400">Submitted</TableHead>
            <TableHead className="text-slate-400 text-right">Settlement</TableHead>
            <TableHead className="text-slate-400"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className="border-slate-700 hover:bg-slate-800/50">
              <TableCell className="font-medium text-white">{lead.customer_name}</TableCell>
              <TableCell className="text-slate-300">
                {lead.property_address}, {lead.property_city}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600">
                  {claimTypeLabels[lead.claim_type] || lead.claim_type}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-300">{lead.insurance_company || "-"}</TableCell>
              <TableCell>
                <Badge variant="outline" className={statusColors[lead.status] || statusColors.submitted}>
                  {statusLabels[lead.status] || lead.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={urgencyColors[lead.urgency] || urgencyColors.standard}>
                  {lead.urgency}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-400">
                {format(new Date(lead.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right">
                {lead.settled_amount ? (
                  <span className="text-green-400 font-semibold">
                    ${lead.settled_amount.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onViewLead?.(lead)}
                  className="text-slate-400 hover:text-white"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}