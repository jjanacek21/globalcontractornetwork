import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, CheckCircle2, Star, Shield, Zap, Droplets, Wind, Sun, Layers, Wrench } from "lucide-react";

interface ProductCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  products: Product[];
}

interface Product {
  name: string;
  description: string;
  pros: string[];
  lifespan?: string;
  bestFor?: string;
  popular?: boolean;
}

const productCategories: ProductCategory[] = [
  {
    id: "shingles",
    title: "Asphalt Shingles",
    icon: <Shield className="h-5 w-5" />,
    description: "The most popular roofing material in America, offering great value and variety",
    products: [
      {
        name: "Architectural Shingles",
        description: "Multi-dimensional shingles with enhanced durability and aesthetics",
        pros: ["30-50 year lifespan", "Wind resistance up to 130 mph", "Dimensional appearance"],
        lifespan: "30-50 years",
        bestFor: "Most residential homes",
        popular: true
      },
      {
        name: "Designer/Luxury Shingles",
        description: "Premium shingles mimicking slate or cedar shake appearance",
        pros: ["Maximum curb appeal", "50+ year lifespan", "Enhanced warranties"],
        lifespan: "50+ years",
        bestFor: "High-end homes"
      }
    ]
  },
  {
    id: "metal",
    title: "Metal Roofing",
    icon: <Zap className="h-5 w-5" />,
    description: "Durable, energy-efficient roofing with a modern or traditional look",
    products: [
      {
        name: "Standing Seam Metal",
        description: "Premium metal panels with concealed fasteners and clean lines",
        pros: ["50+ year lifespan", "No exposed fasteners", "Superior weather resistance"],
        lifespan: "50-70 years",
        bestFor: "Modern aesthetics, coastal areas",
        popular: true
      },
      {
        name: "5V Crimp Metal",
        description: "Economical exposed-fastener metal roofing with classic ribbed profile",
        pros: ["Cost-effective metal option", "Easy installation", "Good durability"],
        lifespan: "40-50 years",
        bestFor: "Agricultural, residential, budget metal"
      },
      {
        name: "Stone-Coated Steel",
        description: "Steel panels coated with stone granules for tile-like appearance",
        pros: ["Looks like tile, weighs less", "Impact resistant", "Energy efficient"],
        lifespan: "50+ years",
        bestFor: "Tile look without the weight"
      }
    ]
  },
  {
    id: "tile",
    title: "Tile Roofing",
    icon: <Sun className="h-5 w-5" />,
    description: "Classic Florida roofing with exceptional longevity and hurricane resistance",
    products: [
      {
        name: "Concrete Tile",
        description: "Heavy-duty tiles offering classic Mediterranean or flat profiles",
        pros: ["Extremely durable", "Hurricane rated", "Fire resistant"],
        lifespan: "50-75 years",
        bestFor: "Florida homes, Spanish style",
        popular: true
      },
      {
        name: "Clay Tile",
        description: "Traditional terracotta tiles with timeless beauty",
        pros: ["Authentic appearance", "100+ year potential", "Excellent insulation"],
        lifespan: "75-100 years",
        bestFor: "Historic homes, luxury properties"
      },
      {
        name: "Synthetic Tile",
        description: "Lightweight alternatives made from composite materials",
        pros: ["Lighter weight", "Lower cost than clay", "Impact resistant"],
        lifespan: "40-50 years",
        bestFor: "Tile look on older structures"
      }
    ]
  },
  {
    id: "flat",
    title: "Flat Roof Systems",
    icon: <Layers className="h-5 w-5" />,
    description: "Commercial and residential low-slope roofing solutions",
    products: [
      {
        name: "TPO (Thermoplastic Polyolefin)",
        description: "Single-ply membrane known for heat-reflective properties",
        pros: ["Energy efficient", "UV resistant", "Weldable seams"],
        lifespan: "20-30 years",
        bestFor: "Commercial buildings, flat residential roofs",
        popular: true
      },
      {
        name: "EPDM Rubber Roofing",
        description: "Durable synthetic rubber membrane for flat roofs",
        pros: ["Excellent durability", "Low maintenance", "Cost-effective"],
        lifespan: "25-30 years",
        bestFor: "Large flat roof areas"
      },
      {
        name: "Modified Bitumen",
        description: "Asphalt-based roofing with added modifiers for flexibility",
        pros: ["Multi-layer protection", "Easy repairs", "Good flexibility"],
        lifespan: "20-25 years",
        bestFor: "Low-slope residential and commercial"
      },
      {
        name: "PVC Membrane",
        description: "Highly durable thermoplastic roofing membrane",
        pros: ["Chemical resistant", "Fire resistant", "Long-lasting seams"],
        lifespan: "25-35 years",
        bestFor: "Restaurants, commercial kitchens"
      },
      {
        name: "Built-Up Roofing (BUR)",
        description: "Traditional multi-layer roofing with alternating asphalt and ply sheets",
        pros: ["Time-tested performance", "Excellent waterproofing", "Gravel surfacing options"],
        lifespan: "20-30 years",
        bestFor: "Commercial flat roofs"
      }
    ]
  },
  {
    id: "underlayment",
    title: "Underlayment",
    icon: <Droplets className="h-5 w-5" />,
    description: "Critical secondary water barrier protecting your roof deck",
    products: [
      {
        name: "Synthetic Underlayment",
        description: "Woven polyethylene or polypropylene sheets for basic protection",
        pros: ["Lightweight", "Easy to install", "Tear resistant"],
        bestFor: "Standard shingle installations"
      },
      {
        name: "Peel-and-Stick (Self-Adhering)",
        description: "Modified bitumen membrane that seals around fasteners",
        pros: ["Superior waterproofing", "Seals around nails", "Ice dam protection"],
        bestFor: "Valleys, eaves, low-slope areas",
        popular: true
      },
      {
        name: "High-Temperature Underlayment",
        description: "Specialized underlayment for metal and tile roofs",
        pros: ["Withstands high heat", "Extended lifespan", "Required for metal roofs"],
        bestFor: "Metal and tile installations"
      }
    ]
  },
  {
    id: "accessories",
    title: "Roof Accessories",
    icon: <Wrench className="h-5 w-5" />,
    description: "Essential components for proper ventilation, sealing, and aesthetics",
    products: [
      {
        name: "Ridge Vents",
        description: "Continuous vents installed along the roof peak",
        pros: ["Invisible from ground", "Even ventilation", "No moving parts"],
        bestFor: "Most residential roofs",
        popular: true
      },
      {
        name: "Solar Attic Fans",
        description: "Powered exhaust fans using solar energy",
        pros: ["Active ventilation", "No electricity cost", "Reduces cooling bills"],
        bestFor: "Hot climates, large attics"
      },
      {
        name: "Exhaust Vents (Box Vents)",
        description: "Static exhaust vents for attic ventilation",
        pros: ["No moving parts", "Affordable", "Easy to install"],
        bestFor: "Supplemental ventilation"
      },
      {
        name: "Turbine Vents",
        description: "Wind-powered rotating vents for active air movement",
        pros: ["No electricity needed", "Good airflow", "Durable construction"],
        bestFor: "Windy areas, barns, workshops"
      },
      {
        name: "Pipe Jacks / Pipe Boots",
        description: "Rubber or metal flanges that seal around plumbing vents",
        pros: ["Prevents leaks", "UV resistant options", "Easy replacement"],
        bestFor: "All roof types with plumbing penetrations",
        popular: true
      },
      {
        name: "Skylights",
        description: "Natural light windows installed in the roof",
        pros: ["Brings in natural light", "Energy efficient options", "Ventilating models available"],
        bestFor: "Dark interior spaces, bathrooms"
      },
      {
        name: "Roof Flashing",
        description: "Metal strips that prevent water intrusion at joints and edges",
        pros: ["Critical leak prevention", "Multiple materials available", "Custom fabrication"],
        bestFor: "Valleys, walls, chimneys, edges"
      }
    ]
  }
];

export const RoofingProductsGuide = () => {
  const [openCategories, setOpenCategories] = useState<string[]>(["shingles"]);

  const toggleCategory = (id: string) => {
    setOpenCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <Badge variant="secondary" className="text-sm">
            Roofing Materials Guide
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Understanding Your <span className="text-primary">Roofing Options</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore the materials and products included in our roofing packages. 
            Each option is selected for Florida's unique climate demands.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {productCategories.map((category) => (
            <Collapsible
              key={category.id}
              open={openCategories.includes(category.id)}
              onOpenChange={() => toggleCategory(category.id)}
            >
              <Card className="overflow-hidden">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          {category.icon}
                        </div>
                        <div className="text-left">
                          <CardTitle className="text-lg">{category.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openCategories.includes(category.id) ? 'rotate-180' : ''}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-6">
                    <div className="space-y-4">
                      {category.products.map((product, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border ${product.popular ? 'border-primary/50 bg-primary/5' : 'bg-background'}`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{product.name}</h4>
                              {product.popular && (
                                <Badge variant="default" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Popular
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {product.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-4 text-xs">
                            {product.lifespan && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Shield className="h-3 w-3" />
                                {product.lifespan}
                              </div>
                            )}
                            {product.bestFor && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3" />
                                Best for: {product.bestFor}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            {product.pros.map((pro, proIdx) => (
                              <Badge key={proIdx} variant="outline" className="text-xs font-normal">
                                {pro}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground mb-4">
            Not sure which materials are right for your project?
          </p>
          <Button variant="outline" size="lg">
            Talk to a Roofing Expert
          </Button>
        </div>
      </div>
    </section>
  );
};
