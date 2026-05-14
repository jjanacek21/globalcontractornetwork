import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileSpreadsheet, FileText, Calculator, ClipboardList } from "lucide-react";

export default function ContractorEstimating() {
  const tools = [
    {
      icon: Calculator,
      title: "Estimate Builder",
      description: "Build line-item estimates with rate multipliers, overhead and profit.",
      link: "/member/dashboard",
    },
    {
      icon: FileSpreadsheet,
      title: "Insurance Supplements",
      description: "Generate Xactimate-ready supplements for denied or underpaid claims.",
      link: "/member/dashboard",
    },
    {
      icon: FileText,
      title: "Scope of Work",
      description: "Standardized scope packets for roofing, exteriors and restoration trades.",
      link: "/member/dashboard",
    },
    {
      icon: ClipboardList,
      title: "Claim Documentation",
      description: "Photo reports, measurement summaries and adjuster-ready packages.",
      link: "/member/dashboard",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <Link to="/member/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Return to Dashboard
        </Link>
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Estimating & Supplementing</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Professional estimating and insurance supplement tools — included free with your contractor account.
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map((t) => (
            <Card key={t.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                  <t.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{t.title}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="secondary" size="sm">
                  <Link to={t.link}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
