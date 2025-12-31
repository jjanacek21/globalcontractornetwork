import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MapPin, DollarSign, Clock, Phone, Mail, CheckCircle, 
  XCircle, MessageSquare, ArrowRight
} from "lucide-react";
import { ContractorLead } from "@/hooks/useContractorDashboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface LeadQueueProps {
  leads: ContractorLead[];
  onUpdateStatus: (leadId: string, status: string, quotedAmount?: number) => void;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-purple-100 text-purple-800",
  quoted: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  completed: "bg-gray-100 text-gray-800",
};

export const LeadQueue = ({ leads, onUpdateStatus }: LeadQueueProps) => {
  const [selectedLead, setSelectedLead] = useState<ContractorLead | null>(null);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);

  const newLeads = leads.filter(l => l.status === "new");
  const activeLeads = leads.filter(l => ["contacted", "quoted"].includes(l.status));

  const handleQuoteSubmit = () => {
    if (selectedLead && quoteAmount) {
      onUpdateStatus(selectedLead.id, "quoted", parseFloat(quoteAmount));
      setShowQuoteDialog(false);
      setQuoteAmount("");
      setSelectedLead(null);
    }
  };

  const renderLeadCard = (lead: ContractorLead) => (
    <Card key={lead.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[lead.status]}>{lead.status}</Badge>
                <Badge variant="outline">{lead.project?.service_type}</Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="h-3 w-3" />
                <span>{lead.project?.property_address}</span>
              </div>
            </div>
            <div className="text-right">
              {lead.project?.ai_estimate_low && lead.project?.ai_estimate_high && (
                <div className="flex items-center gap-1 text-primary font-semibold">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    {lead.project.ai_estimate_low.toLocaleString()} - {lead.project.ai_estimate_high.toLocaleString()}
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">AI Estimate</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Received {new Date(lead.created_at).toLocaleDateString()}</span>
          </div>

          {lead.status === "new" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onUpdateStatus(lead.id, "contacted")}
              >
                <Phone className="h-4 w-4 mr-1" />
                Mark Contacted
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  setSelectedLead(lead);
                  setShowQuoteDialog(true);
                }}
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Send Quote
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onUpdateStatus(lead.id, "declined")}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          )}

          {lead.status === "contacted" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  setSelectedLead(lead);
                  setShowQuoteDialog(true);
                }}
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Send Quote
              </Button>
              <Button size="sm" variant="outline">
                <MessageSquare className="h-4 w-4 mr-1" />
                Message
              </Button>
            </div>
          )}

          {lead.status === "quoted" && lead.quoted_amount && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quoted Amount</p>
                <p className="text-lg font-bold text-primary">
                  ${lead.quoted_amount.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onUpdateStatus(lead.id, "accepted")}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accepted
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateStatus(lead.id, "declined")}
                >
                  Lost
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* New Leads Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            New Leads
            {newLeads.length > 0 && (
              <Badge variant="destructive">{newLeads.length}</Badge>
            )}
          </h3>
        </div>
        
        {newLeads.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <p className="text-muted-foreground">No new leads at the moment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {newLeads.map(renderLeadCard)}
          </div>
        )}
      </div>

      {/* Active Leads Section */}
      {activeLeads.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Active Leads</h3>
          <div className="grid gap-4">
            {activeLeads.map(renderLeadCard)}
          </div>
        </div>
      )}

      {/* Quote Dialog */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Quote</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedLead?.project && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Project Details</p>
                <p className="font-medium">{selectedLead.project.service_type}</p>
                <p className="text-sm">{selectedLead.project.property_address}</p>
                {selectedLead.project.ai_estimate_low && (
                  <p className="text-sm text-muted-foreground">
                    AI Estimate: ${selectedLead.project.ai_estimate_low.toLocaleString()} - ${selectedLead.project.ai_estimate_high?.toLocaleString()}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Quote Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuoteSubmit} disabled={!quoteAmount}>
              Send Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
