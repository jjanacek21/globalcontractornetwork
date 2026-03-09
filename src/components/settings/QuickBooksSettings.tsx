import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calculator, ExternalLink, CheckCircle2, XCircle, RefreshCw, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function QuickBooksSettings() {
  const [syncInvoices, setSyncInvoices] = useState(true);
  const [syncPayments, setSyncPayments] = useState(true);
  const [syncCustomers, setSyncCustomers] = useState(false);
  const [syncExpenses, setSyncExpenses] = useState(false);
  const isConnected = false; // Will be replaced with real integration status

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> QuickBooks Integration</h2>
        <p className="text-sm text-muted-foreground mt-1">Sync your accounting data with QuickBooks Online</p>
      </div>

      {/* Connection Status */}
      <Card className={isConnected ? "border-green-500/30" : "border-border"}>
        <CardContent className="p-6 flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isConnected ? "bg-green-500/10" : "bg-muted"}`}>
            {isConnected ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <XCircle className="h-6 w-6 text-muted-foreground" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">Connection Status</h3>
              <Badge variant={isConnected ? "default" : "secondary"}>{isConnected ? "Connected" : "Not Connected"}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {isConnected
                ? "Your QuickBooks Online account is syncing successfully."
                : "Connect your QuickBooks Online account to sync invoices and payments."}
            </p>
          </div>
          <Button onClick={() => toast.info("QuickBooks OAuth integration coming soon")} className="gap-2" variant={isConnected ? "outline" : "default"}>
            {isConnected ? <><RefreshCw className="h-4 w-4" />Reconnect</> : <>Connect QuickBooks <ExternalLink className="h-4 w-4" /></>}
          </Button>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader><CardTitle className="text-base">Sync Settings</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {[
            { label: "Sync Invoices", desc: "Push invoices to QuickBooks when created", checked: syncInvoices, onChange: setSyncInvoices },
            { label: "Sync Payments", desc: "Record payments in QuickBooks automatically", checked: syncPayments, onChange: setSyncPayments },
            { label: "Sync Expenses", desc: "Import expense transactions from QuickBooks", checked: syncExpenses, onChange: setSyncExpenses },
            { label: "Sync Customers", desc: "Create QuickBooks customers from CRM contacts", checked: syncCustomers, onChange: setSyncCustomers },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <Label>{item.label}</Label>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch checked={item.checked} onCheckedChange={item.onChange} disabled={!isConnected} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sync History - Empty State */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Sync Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No sync activity yet</p>
            <p className="text-sm mt-1">Connect QuickBooks to start syncing your accounting data.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
