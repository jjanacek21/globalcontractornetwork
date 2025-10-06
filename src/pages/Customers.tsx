import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CustomerDialog } from "@/components/customers/CustomerDialog";

interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  pipeline_stage: string;
  lead_source: string;
  created_at: string;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  );

  const getPipelineBadgeColor = (stage: string) => {
    const colors: Record<string, string> = {
      lead: "bg-blue-100 text-blue-800",
      inspection: "bg-yellow-100 text-yellow-800",
      estimate_sent: "bg-purple-100 text-purple-800",
      sold: "bg-green-100 text-green-800",
      in_production: "bg-orange-100 text-orange-800",
      complete: "bg-gray-100 text-gray-800",
    };
    return colors[stage] || "bg-gray-100 text-gray-800";
  };

  const formatStage = (stage: string) => {
    return stage.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer pipeline</p>
        </div>
        <Button onClick={() => { setSelectedCustomer(null); setDialogOpen(true); }} className="shadow-soft">
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading customers...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No customers found" : "No customers yet. Add your first customer to get started."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <Card
                  key={customer.id}
                  className="cursor-pointer hover:shadow-card transition-shadow"
                  onClick={() => { setSelectedCustomer(customer); setDialogOpen(true); }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-semibold text-lg">{customer.name}</h3>
                          {customer.address && (
                            <p className="text-sm text-muted-foreground">{customer.address}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm">
                          {customer.phone && (
                            <span className="text-muted-foreground">{customer.phone}</span>
                          )}
                          {customer.email && (
                            <span className="text-muted-foreground">{customer.email}</span>
                          )}
                        </div>
                        {customer.lead_source && (
                          <p className="text-xs text-muted-foreground">
                            Source: {customer.lead_source}
                          </p>
                        )}
                      </div>
                      <Badge className={getPipelineBadgeColor(customer.pipeline_stage)}>
                        {formatStage(customer.pipeline_stage)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={selectedCustomer}
        onSuccess={fetchCustomers}
      />
    </div>
  );
};

export default Customers;
