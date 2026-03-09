import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calculator, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function QuickBooksSettings() {
  const [syncInvoices, setSyncInvoices] = useState(true);
  const [syncPayments, setSyncPayments] = useState(true);
  const [syncCustomers, setSyncCustomers] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> QuickBooks Integration</h2>
        <p className="text-sm text-muted-foreground mt-1">Sync your accounting data with QuickBooks Online</p>
      </div>

      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">Connection Status</h3>
              <Badge variant="secondary">Not Connected</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Connect your QuickBooks Online account to sync invoices and payments</p>
          </div>
          <Button onClick={() => toast.info("QuickBooks OAuth coming soon")} className="gap-2">
            Connect QuickBooks <ExternalLink className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Sync Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Sync Invoices</Label>
              <p className="text-xs text-muted-foreground">Push invoices to QuickBooks when created</p>
            </div>
            <Switch checked={syncInvoices} onCheckedChange={setSyncInvoices} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Sync Payments</Label>
              <p className="text-xs text-muted-foreground">Record payments in QuickBooks automatically</p>
            </div>
            <Switch checked={syncPayments} onCheckedChange={setSyncPayments} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Sync Customers</Label>
              <p className="text-xs text-muted-foreground">Create QuickBooks customers from CRM contacts</p>
            </div>
            <Switch checked={syncCustomers} onCheckedChange={setSyncCustomers} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
