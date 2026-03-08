import { Card, CardContent } from "@/components/ui/card";
import { Home, FileText, MessageSquare, CheckCircle } from "lucide-react";

export default function CRMHomeownerPortal() {
  const sections = [
    { title: "Project Status", desc: "View current project progress and milestones", icon: CheckCircle, color: "text-green-500" },
    { title: "Documents", desc: "Access contracts, invoices, and project documents", icon: FileText, color: "text-blue-500" },
    { title: "Communication", desc: "Message your project team and view updates", icon: MessageSquare, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Homeowner Portal</h1>
        <p className="text-muted-foreground">Customer-facing portal preview with project status, documents, and communication</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((s, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <h3 className="font-semibold">{s.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Home className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">This is a preview of the homeowner-facing portal. Configure the portal in Settings.</p>
        </CardContent>
      </Card>
    </div>
  );
}
