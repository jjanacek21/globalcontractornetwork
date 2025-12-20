import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Video, Download, BookOpen } from "lucide-react";

export const WindowResourceLibrary = () => {
  const resources = [
    {
      icon: FileText,
      title: "Impact Window Buyer's Guide",
      description: "Everything you need to know before purchasing impact windows in Florida",
      type: "Guide",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Video,
      title: "Installation Process Video",
      description: "See how our expert team installs impact windows from start to finish",
      type: "Video",
      color: "bg-red-100 text-red-600"
    },
    {
      icon: Download,
      title: "Insurance Discount Guide",
      description: "How to maximize your homeowner's insurance savings with impact windows",
      type: "PDF",
      color: "bg-emerald-100 text-emerald-600"
    },
    {
      icon: BookOpen,
      title: "Florida Building Codes",
      description: "Understanding window requirements in High-Velocity Hurricane Zones",
      type: "Reference",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: FileText,
      title: "Energy Efficiency Guide",
      description: "How Low-E glass and proper installation reduce your energy bills",
      type: "Guide",
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      icon: Download,
      title: "Financing Options Overview",
      description: "Compare 0% financing, low-rate options, and payment plans",
      type: "PDF",
      color: "bg-pink-100 text-pink-600"
    }
  ];

  return (
    <section id="resources" className="py-20 bg-white">
      <div className="container">
        <div className="text-center mb-16">
          <Badge className="bg-emerald-100 text-emerald-700 mb-4">Resources</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Window Resource Library</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Educational materials to help you make informed decisions about your home's windows
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${resource.color}`}>
                    <resource.icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline">{resource.type}</Badge>
                </div>
                <CardTitle className="text-lg group-hover:text-emerald-600 transition-colors">
                  {resource.title}
                </CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm text-emerald-600 font-medium group-hover:underline">
                  Read more →
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-16 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">10+</div>
              <div className="text-emerald-200">Years Experience</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">2,500+</div>
              <div className="text-emerald-200">Windows Installed</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">45%</div>
              <div className="text-emerald-200">Avg Insurance Savings</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">4.9★</div>
              <div className="text-emerald-200">Customer Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
