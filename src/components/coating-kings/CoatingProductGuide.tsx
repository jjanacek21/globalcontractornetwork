import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets, Shield, Zap, Sun, Cloud, Building2, Home } from "lucide-react";

const coatings = [
  {
    name: "Acrylic",
    icon: Droplets,
    description: "UV-resistant, breathable coating ideal for moderate climates",
    idealFor: ["Flat roofs", "Low-slope commercial"],
    priceRange: "$2.00 - $3.00/SF",
    durability: "10-15 years",
    benefits: ["Excellent UV resistance", "Breathable", "Cost-effective"],
    color: "text-blue-500"
  },
  {
    name: "Acrylic + Base",
    icon: Droplets,
    description: "Enhanced acrylic system with primer for better adhesion",
    idealFor: ["Aged flat roofs", "Previously coated surfaces"],
    priceRange: "$3.25 - $4.00/SF",
    durability: "12-17 years",
    benefits: ["Better adhesion", "Enhanced protection", "Longer lifespan"],
    color: "text-blue-600"
  },
  {
    name: "Elastomeric",
    icon: Shield,
    description: "Flexible coating that expands and contracts with temperature",
    idealFor: ["Metal roofs", "Concrete surfaces"],
    priceRange: "$3.00 - $4.00/SF",
    durability: "12-18 years",
    benefits: ["High flexibility", "Crack bridging", "Weather resistant"],
    color: "text-purple-500"
  },
  {
    name: "Silicone",
    icon: Cloud,
    description: "Premium ponding water resistance and UV protection",
    idealFor: ["Flat roofs", "Low-slope with ponding"],
    priceRange: "$3.75 - $4.50/SF",
    durability: "15-20 years",
    benefits: ["Ponding water resistance", "No chalking", "Superior UV protection"],
    color: "text-cyan-500"
  },
  {
    name: "Silicone + Base",
    icon: Cloud,
    description: "Ultimate protection with primer for maximum performance",
    idealFor: ["High-performance commercial", "Critical structures"],
    priceRange: "$4.50 - $7.00/SF",
    durability: "20+ years",
    benefits: ["Maximum durability", "Best ponding protection", "Premium warranty"],
    color: "text-cyan-600"
  },
  {
    name: "Polyurethane",
    icon: Zap,
    description: "Impact-resistant coating for high-traffic and hail-prone areas",
    idealFor: ["Commercial roofs", "Hail-prone areas"],
    priceRange: "$4.50 - $7.00/SF",
    durability: "15-25 years",
    benefits: ["Hail resistant", "High impact strength", "Chemical resistant"],
    color: "text-orange-500"
  },
  {
    name: "Rubber (EPDM)",
    icon: Shield,
    description: "Heavy-duty membrane system for extreme durability",
    idealFor: ["Commercial buildings", "Industrial facilities"],
    priceRange: "$6.00 - $8.00/SF",
    durability: "20-30 years",
    benefits: ["Extreme durability", "Seamless application", "Weather proof"],
    color: "text-gray-600"
  }
];

export const CoatingProductGuide = () => {
  return (
    <section id="products" className="py-20 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your <span className="text-primary">Coating System</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We offer a complete range of coating systems tailored to South Florida's unique climate
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {coatings.map((coating, index) => {
            const Icon = coating.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-muted ${coating.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary">{coating.priceRange}</Badge>
                  </div>
                  <CardTitle className="text-xl">{coating.name}</CardTitle>
                  <CardDescription>{coating.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold mb-2 text-muted-foreground">Ideal For:</p>
                    <div className="flex flex-wrap gap-2">
                      {coating.idealFor.map((item, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2 text-muted-foreground">Expected Durability:</p>
                    <p className="text-sm font-medium">{coating.durability}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2 text-muted-foreground">Key Benefits:</p>
                    <ul className="text-sm space-y-1">
                      {coating.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Comparison Section */}
        <div className="mt-16 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Property Type Recommendations</CardTitle>
              <CardDescription>Quick guide to help you choose the right coating</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="w-6 h-6 text-primary" />
                    <h3 className="font-semibold text-lg">Commercial Properties</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>Best Choice:</strong> Silicone or Polyurethane</p>
                    <p><strong>Why:</strong> Superior ponding water resistance, long warranties, minimal maintenance</p>
                    <p><strong>ROI:</strong> 5-7 years through energy savings</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-4">
                    <Home className="w-6 h-6 text-primary" />
                    <h3 className="font-semibold text-lg">Residential Properties</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>Best Choice:</strong> Acrylic or Elastomeric</p>
                    <p><strong>Why:</strong> Cost-effective, excellent UV protection, proven durability</p>
                    <p><strong>ROI:</strong> 3-5 years through reduced cooling costs</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};