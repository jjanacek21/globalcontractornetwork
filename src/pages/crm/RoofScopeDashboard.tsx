import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRSCompany, useRSEstimates, useRSCustomers } from "@/hooks/useRoofScope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, FileText, Brain, TrendingUp, ArrowRight } from "lucide-react";
import { RoofScopeOnboarding } from "@/components/roofscope/RoofScopeOnboarding";

export default function RoofScopeDashboard() {
  const navigate = useNavigate();
  const { company, loading: companyLoading } = useRSCompany();
  const { estimates, loading: estLoading } = useRSEstimates(company?.id);
  const { customers } = useRSCustomers(company?.id);

  if (companyLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (!company || !company.onboarding_completed) {
    return <RoofScopeOnboarding />;
  }

  const thisMonth = new Date();
  const monthEstimates = estimates.filter(e => {
    const d = new Date(e.created_at);
    return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear();
  });
  const totalValue = monthEstimates.reduce((sum, e) => sum + (e.grand_total || 0), 0);

  const statCards = [
    { label: "Estimates This Month", value: monthEstimates.length, icon: FileText, color: "text-blue-400" },
    { label: "Total Estimated Value", value: `$${totalValue.toLocaleString()}`, icon: TrendingUp, color: "text-green-400" },
    { label: "Customers", value: customers.length, icon: Users, color: "text-orange-400" },
    { label: "AI Analyses", value: 0, icon: Brain, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back{company.name ? `, ${company.name}` : ""}</h1>
          <p className="text-sm text-muted-foreground">RoofScope AI Estimator — Estimate Smarter. Close Faster.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/roofscope/estimate/new")} className="gap-2">
            <Plus className="w-4 h-4" /> New Estimate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="bg-card/80 backdrop-blur border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <s.icon className={`w-8 h-8 ${s.color} opacity-60`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Button variant="outline" className="h-20 flex-col gap-1" onClick={() => navigate("/roofscope/estimate/new")}>
          <Plus className="w-5 h-5" />
          <span className="text-sm">New Estimate</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col gap-1" onClick={() => navigate("/roofscope/customers")}>
          <Users className="w-5 h-5" />
          <span className="text-sm">Add Customer</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col gap-1" onClick={() => navigate("/roofscope/analyzer")}>
          <Brain className="w-5 h-5" />
          <span className="text-sm">AI Photo Analyzer</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Recent Estimates</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/roofscope/estimates")} className="gap-1 text-xs">
            View All <ArrowRight className="w-3 h-3" />
          </Button>
        </CardHeader>
        <CardContent>
          {estLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : estimates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No estimates yet. Create your first estimate to get started!</p>
          ) : (
            <div className="space-y-2">
              {estimates.slice(0, 10).map(est => (
                <div key={est.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/roofscope/estimate/${est.id}`)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div>
                      <p className="text-sm font-medium truncate">{est.estimate_number}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {est.customer ? `${est.customer.first_name || ''} ${est.customer.last_name || ''}`.trim() : "No customer"}
                        {est.property_address ? ` • ${est.property_address}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={est.status === "accepted" ? "default" : "secondary"} className="text-[10px]">
                      {est.status}
                    </Badge>
                    <span className="text-sm font-semibold">${(est.grand_total || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
