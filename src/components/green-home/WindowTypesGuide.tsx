import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";

export const WindowTypesGuide = () => {
  const tiers = [
    {
      name: "Good",
      subtitle: "Standard Grade",
      description: "Reliable hurricane protection at an affordable price",
      priceRange: "$1,100 - $2,500",
      color: "bg-emerald-100 border-emerald-300",
      badgeColor: "bg-emerald-500",
      features: [
        "Basic impact-resistant glass",
        "Standard aluminum frame",
        "2-point locking system",
        "5-year warranty",
        "Meets FL building code"
      ]
    },
    {
      name: "Better",
      subtitle: "Enhanced Grade",
      description: "Superior efficiency and durability for most homes",
      priceRange: "$1,500 - $3,500",
      color: "bg-yellow-100 border-yellow-300",
      badgeColor: "bg-yellow-500",
      popular: true,
      features: [
        "Low-E energy efficient glass",
        "Reinforced aluminum frame",
        "Multi-point locking system",
        "10-year warranty",
        "Enhanced noise reduction",
        "Better insulation value"
      ]
    },
    {
      name: "Best",
      subtitle: "Premium Grade",
      description: "Maximum protection, efficiency, and home value",
      priceRange: "$2,000 - $5,000",
      color: "bg-purple-100 border-purple-300",
      badgeColor: "bg-purple-500",
      features: [
        "Triple Low-E premium glass",
        "Heavy-duty reinforced frame",
        "Advanced security locking",
        "Lifetime warranty",
        "Maximum UV protection",
        "Superior noise blocking",
        "Highest energy savings",
        "Premium aesthetics"
      ]
    }
  ];

  return (
    <section id="windows" className="py-20 bg-gray-50">
      <div className="container">
        <div className="text-center mb-16">
          <Badge className="bg-emerald-100 text-emerald-700 mb-4">Window Options</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Good, Better, Best Options</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the protection level that's right for your home and budget. 
            All options meet Florida building codes for hurricane protection.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <Card key={tier.name} className={`relative overflow-hidden border-2 ${tier.color} ${tier.popular ? 'scale-105 shadow-xl' : 'shadow-lg'}`}>
              {tier.popular && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-yellow-500 text-white flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <Badge className={`w-fit ${tier.badgeColor} text-white`}>{tier.name}</Badge>
                <CardTitle className="text-2xl mt-2">{tier.subtitle}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="text-3xl font-bold text-emerald-600 mt-4">
                  {tier.priceRange}
                  <span className="text-sm font-normal text-gray-500 block">per window (installed)</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Not sure which option is right for you?{" "}
            <a href="#quote" className="text-emerald-600 font-medium hover:underline">
              Get a free consultation
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};
