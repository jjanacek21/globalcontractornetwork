import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, GraduationCap, Wrench, Calculator, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const resources = [
  {
    icon: FileText,
    title: "Technical Data Sheets",
    description: "Detailed specifications for all coating systems",
    items: [
      "Product specifications",
      "Application guidelines",
      "Coverage rates",
      "Cure times & conditions"
    ]
  },
  {
    icon: GraduationCap,
    title: "Training & Certification",
    description: "Become a certified coating applicator",
    items: [
      "Online training modules",
      "In-person workshops",
      "Certification programs",
      "Continuing education"
    ]
  },
  {
    icon: Wrench,
    title: "Equipment Guide",
    description: "Recommended tools and equipment",
    items: [
      "Airless sprayers",
      "Surface prep tools",
      "Safety equipment",
      "Quality control devices"
    ]
  },
  {
    icon: Calculator,
    title: "Contractor Calculator",
    description: "Estimate materials and labor costs",
    items: [
      "Material quantity calculator",
      "Labor hour estimator",
      "Profit margin calculator",
      "Proposal generator"
    ]
  }
];

const guides = [
  { name: "Flat Roof Application Guide", size: "2.4 MB" },
  { name: "Metal Roof Preparation Manual", size: "1.8 MB" },
  { name: "Quality Control Checklist", size: "450 KB" },
  { name: "Safety Procedures & Best Practices", size: "1.2 MB" },
  { name: "Warranty Documentation Template", size: "680 KB" }
];

export const ContractorResources = () => {
  const { toast } = useToast();

  const handleDownload = (fileName: string) => {
    toast({
      title: "Download Started",
      description: `Downloading ${fileName}...`
    });
  };

  return (
    <section className="py-20 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Resources for <span className="text-primary">Contractors</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to become a coating expert and grow your business
          </p>
        </div>

        {/* Resource Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
          {resources.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2">
                    {resource.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Downloadable Guides */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Downloadable Application Guides
              </CardTitle>
              <CardDescription>
                Comprehensive PDF guides for professional coating applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {guides.map((guide, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{guide.name}</p>
                        <p className="text-sm text-muted-foreground">{guide.size}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(guide.name)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Become a Partner CTA */}
        <div className="mt-12 text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="pt-8 pb-8">
              <h3 className="text-2xl font-bold mb-4">Become a Coating Kings Partner</h3>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Join our network of certified applicators and get access to exclusive training, 
                preferred pricing, and marketing support.
              </p>
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Apply for Partnership
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};