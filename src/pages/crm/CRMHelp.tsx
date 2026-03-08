import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Video, Headphones, HelpCircle, Play } from "lucide-react";

export default function CRMHelp() {
  const cards = [
    { title: "Documentation", desc: "Browse guides and reference documentation for all CRM features.", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Video Tutorials", desc: "Watch step-by-step tutorials to learn the platform quickly.", icon: Video, color: "text-purple-500", bg: "bg-purple-50" },
    { title: "Contact Support", desc: "Reach our support team for personalized help with your account.", icon: Headphones, color: "text-green-500", bg: "bg-green-50" },
    { title: "FAQ", desc: "Find answers to commonly asked questions about the CRM.", icon: HelpCircle, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Help and Support</h1>
        <p className="text-muted-foreground">Get assistance and learn how to use the platform</p>
      </div>

      {/* Walkthrough Banner */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Interactive Product Walkthrough</h2>
            <p className="text-sm text-muted-foreground mt-1">Take a guided tour of all CRM features and learn how to use the platform effectively.</p>
          </div>
          <Button className="bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,30%)] text-white">
            <Play className="mr-2 h-4 w-4" />Start Walkthrough
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((c, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg ${c.bg} flex items-center justify-center ${c.color} shrink-0`}>
                <c.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">{c.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
