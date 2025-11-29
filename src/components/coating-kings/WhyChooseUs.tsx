import { Card, CardContent } from "@/components/ui/card";
import { Shield, Sun, Droplets, DollarSign, Clock, Award } from "lucide-react";

const benefits = [
  {
    icon: Sun,
    title: "Built for South Florida",
    description: "Our coatings are specifically designed to withstand intense UV rays, hurricanes, and tropical storms that are common in South Florida."
  },
  {
    icon: Shield,
    title: "Hurricane & Storm Resistant",
    description: "Proven protection against wind-driven rain, hail, and severe weather. Our systems have weathered multiple Category 5 hurricanes."
  },
  {
    icon: Droplets,
    title: "Ponding Water Solution",
    description: "Advanced silicone systems resist ponding water that destroys traditional roofs. Perfect for flat roofs with drainage challenges."
  },
  {
    icon: Clock,
    title: "Extend Roof Life 10-20+ Years",
    description: "Transform an aging roof into a durable, weatherproof system without expensive tear-off and replacement costs."
  },
  {
    icon: DollarSign,
    title: "Dramatic Energy Savings",
    description: "Reflective coatings reduce cooling costs by up to 30%, paying for themselves through energy savings in just a few years."
  },
  {
    icon: Award,
    title: "Licensed & Insured Experts",
    description: "Fully licensed, bonded, and insured with decades of combined experience in roof coating applications."
  }
];

export const WhyChooseUs = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Choose <span className="text-primary">Coating Kings</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The smart alternative to roof replacement with benefits that last decades
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mb-16">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-all hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 rounded-full bg-primary/10">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* No Tear-Off Section */}
        <div className="max-w-5xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Minimal Disruption</span>
                </div>
                
                <h3 className="text-3xl font-bold">No Tear-Off Required</h3>
                
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Unlike traditional roof replacement, our coating systems are applied directly over your existing roof. 
                  This means no messy tear-off, no debris removal, and your building stays operational throughout the process.
                </p>

                <div className="grid md:grid-cols-3 gap-8 pt-8">
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">75%</div>
                    <div className="text-sm text-muted-foreground">Less Disruption</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">60%</div>
                    <div className="text-sm text-muted-foreground">Cost Savings</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">90%</div>
                    <div className="text-sm text-muted-foreground">Less Waste</div>
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