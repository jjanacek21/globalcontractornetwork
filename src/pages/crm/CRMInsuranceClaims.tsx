import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, CheckCircle, AlertTriangle, FileText } from "lucide-react";

export default function CRMInsuranceClaims() {
  const stats = [
    { label: "Total Claims", value: 0, icon: Shield, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Open", value: 0, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50" },
    { label: "Approved", value: 0, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
    { label: "Denied", value: 0, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Insurance Claims</h1>
        <p className="text-muted-foreground">Track and manage insurance claims</p>
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
          <FileText className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No claims yet. Claims will appear here as they are created.</p>
        </CardContent>
      </Card>
    </div>
  );
}
