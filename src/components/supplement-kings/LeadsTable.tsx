import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Eye, FileText, Search, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [claimTypeFilter, setClaimTypeFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search filter
      if (searchQuery && !lead.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Status filter
      if (statusFilter !== "all" && lead.status !== statusFilter) {
        return false;
      }
      // Claim type filter
      if (claimTypeFilter !== "all" && lead.claim_type !== claimTypeFilter) {
        return false;
      }
      // Date range filter
      const leadDate = new Date(lead.created_at);
      if (fromDate && leadDate < fromDate) {
        return false;
      }
      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (leadDate > endOfDay) {
          return false;
        }
      }
      return true;
    });
  }, [leads, searchQuery, statusFilter, claimTypeFilter, fromDate, toDate]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setClaimTypeFilter("all");
    setFromDate(undefined);
    setToDate(undefined);
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || claimTypeFilter !== "all" || fromDate || toDate;

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
    <div className="space-y-4">
      {/* Filter Section */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-slate-400 mb-1 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-[180px]">
            <label className="text-xs text-slate-400 mb-1 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="xactimate_complete">Xactimate Complete</SelectItem>
                <SelectItem value="supplement_sent">Supplement Sent</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Claim Type Filter */}
          <div className="w-[150px]">
            <label className="text-xs text-slate-400 mb-1 block">Claim Type</label>
            <Select value={claimTypeFilter} onValueChange={setClaimTypeFilter}>
              <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="wind">Wind</SelectItem>
                <SelectItem value="hail">Hail</SelectItem>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="fire">Fire</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* From Date */}
          <div className="w-[150px]">
            <label className="text-xs text-slate-400 mb-1 block">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-slate-900 border-slate-600",
                    !fromDate && "text-slate-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, "MMM d, yyyy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* To Date */}
          <div className="w-[150px]">
            <label className="text-xs text-slate-400 mb-1 block">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-slate-900 border-slate-600",
                    !toDate && "text-slate-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, "MMM d, yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-3 text-sm text-slate-400">
          Showing {filteredLeads.length} of {leads.length} leads
        </div>
      </div>

      {/* Table */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">No matching leads</h3>
          <p className="text-slate-500">Try adjusting your filters</p>
        </div>
      ) : (
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
              {filteredLeads.map((lead) => (
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
      )}
    </div>
  );
}
