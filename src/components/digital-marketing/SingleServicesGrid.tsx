import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  Search, 
  MessageSquare, 
  Mail, 
  Palette, 
  FileText,
  Database,
  Settings,
  TrendingUp,
  Smartphone,
  Video,
  Zap
} from "lucide-react";

interface Service {
  icon: React.ReactNode;
  name: string;
  price: string;
  priceType: "monthly" | "one-time";
  description: string;
  features: string[];
}

const services: Service[] = [
  {
    icon: <Globe className="h-8 w-8" />,
    name: "Google/YouTube Ads + GMB & GLS",
    price: "$1,699",
    priceType: "monthly",
    description: "Complete Google advertising with GMB optimization",
    features: ["Ad Campaign Setup", "GMB Optimization", "YouTube Ads", "Monthly Reporting", "Keyword Research", "Landing Page Integration"]
  },
  {
    icon: <Smartphone className="h-8 w-8" />,
    name: "Facebook/Instagram Ads",
    price: "$1,399",
    priceType: "monthly",
    description: "Social media advertising for maximum reach",
    features: ["Campaign Strategy", "Ad Creative Design", "Audience Targeting", "A/B Testing", "Performance Analytics", "Retargeting Setup"]
  },
  {
    icon: <Database className="h-8 w-8" />,
    name: "CRM Setup",
    price: "$1,499",
    priceType: "one-time",
    description: "Complete CRM implementation and customization",
    features: ["Platform Setup", "Pipeline Configuration", "Automation Setup", "Team Training", "Data Import", "Custom Fields"]
  },
  {
    icon: <Settings className="h-8 w-8" />,
    name: "CRM Management",
    price: "$800",
    priceType: "monthly",
    description: "Ongoing CRM optimization and support",
    features: ["Daily Monitoring", "Lead Management", "Report Generation", "System Updates", "User Support"]
  },
  {
    icon: <FileText className="h-8 w-8" />,
    name: "Website Design & Development",
    price: "$3,499",
    priceType: "one-time",
    description: "Professional, conversion-focused website",
    features: ["Custom Design", "Mobile Responsive", "SEO Foundation", "Contact Forms", "Speed Optimization", "SSL Certificate"]
  },
  {
    icon: <Zap className="h-8 w-8" />,
    name: "Landing Page Creation",
    price: "$449",
    priceType: "one-time",
    description: "High-converting landing pages for campaigns",
    features: ["Custom Design", "A/B Testing Ready", "Form Integration", "Mobile Optimized", "Fast Loading"]
  },
  {
    icon: <Search className="h-8 w-8" />,
    name: "SEO & Website Optimization",
    price: "$1,399",
    priceType: "monthly",
    description: "Improve search rankings and visibility",
    features: ["Technical SEO Audit", "Content Optimization", "Backlink Strategy", "Monthly Reporting"]
  },
  {
    icon: <Palette className="h-8 w-8" />,
    name: "Branding Package",
    price: "$2,499",
    priceType: "one-time",
    description: "Complete brand identity development",
    features: ["Logo Design", "Brand Guidelines", "Color Palette", "Typography", "Brand Voice", "Collateral Templates"]
  },
  {
    icon: <MessageSquare className="h-8 w-8" />,
    name: "Email & SMS Drip Campaigns",
    price: "$1,749+",
    priceType: "monthly",
    description: "Automated follow-up sequences",
    features: ["Campaign Strategy", "Sequence Creation", "A/B Testing", "Analytics Dashboard", "Personalization"]
  },
  {
    icon: <Video className="h-8 w-8" />,
    name: "Design on Demand",
    price: "$699+",
    priceType: "monthly",
    description: "Unlimited design requests",
    features: ["Unlimited Requests", "Quick Turnaround", "Social Graphics", "Print Materials"]
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    name: "Social Media Growth",
    price: "$1,650",
    priceType: "monthly",
    description: "Organic social media management",
    features: ["Content Creation", "Community Management", "Hashtag Strategy", "Analytics Reports"]
  },
  {
    icon: <Mail className="h-8 w-8" />,
    name: "Email Newsletter Management",
    price: "$1,299",
    priceType: "monthly",
    description: "Professional email marketing",
    features: ["Newsletter Design", "Content Creation", "List Management", "A/B Testing", "Segmentation", "Automation", "Analytics", "Template Design"]
  }
];

export function SingleServicesGrid() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            À La Carte Services
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Pick and choose exactly what you need. Each service is designed to deliver measurable results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-slate-200 bg-white"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 bg-amber-100 rounded-xl text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    {service.icon}
                  </div>
                  <Badge variant={service.priceType === "monthly" ? "default" : "secondary"} className="text-xs">
                    {service.priceType === "monthly" ? "/month" : "One-Time"}
                  </Badge>
                </div>
                <CardTitle className="text-lg leading-tight">{service.name}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600 mb-4">{service.price}</div>
                <ul className="space-y-2">
                  {service.features.slice(0, 4).map((feature, idx) => (
                    <li key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      {feature}
                    </li>
                  ))}
                  {service.features.length > 4 && (
                    <li className="text-sm text-amber-600 font-medium">
                      +{service.features.length - 4} more features
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
