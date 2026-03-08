import { Card, CardContent } from "@/components/ui/card";
import { Brain, BarChart3, Target, Zap } from "lucide-react";

export default function CRMScopeIntelligence() {
  const stats = [
    { label: "Scopes Analyzed", value: 0, icon: Brain, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Accuracy Rate", value: "—", icon: Target, color: "text-green-500", bg: "bg-green-50" },
    { label: "Supplements Generated", value: 0, icon: Zap, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Revenue Recovered", value: "$0", icon: BarChart3, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Scope Intelligence</h1>
        <p className="text-muted-foreground">AI-powered scope analysis dashboard</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Brain className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">Upload a scope document to start AI analysis.</p>
        </CardContent>
      </Card>
    </div>
  );
}
