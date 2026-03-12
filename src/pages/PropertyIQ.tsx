import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyIQHeader } from "@/components/property-iq/PropertyIQHeader";
import { PropertyIQFooter } from "@/components/property-iq/PropertyIQFooter";
import { ReturnHomeButton } from "@/components/layout/ReturnHomeButton";
import { Search, FileText, Users, CloudRain, Building2, Check } from "lucide-react";

const features = [
  { icon: FileText, title: "Property Reports", description: "Comprehensive Carfax-style reports with building intelligence, roof condition, and investment scores." },
  { icon: Users, title: "Owner Networks", description: "Full owner intelligence including phone numbers, emails, social media, and corporate entity details." },
  { icon: Building2, title: "Roof Intelligence", description: "AI-powered roof condition scoring, remaining life analysis, and replacement urgency ratings." },
  { icon: CloudRain, title: "Storm History", description: "Complete storm exposure history with damage reports, insurance claims, and vulnerability analysis." },
];

const pricingTiers = [
  { name: "Basic", price: "$49", period: "/mo", features: ["10 Property Reports", "Basic Owner Info", "Roof Scores", "Email Support"], highlight: false },
  { name: "Pro", price: "$99", period: "/mo", features: ["50 Property Reports", "Full Owner Intelligence", "Storm History", "API Access", "Priority Support"], highlight: true },
  { name: "Enterprise", price: "$299", period: "/mo", features: ["Unlimited Reports", "Full Owner Networks", "Bulk Lookups", "Custom Integrations", "Dedicated Account Manager"], highlight: false },
];

const PropertyIQ = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/property-iq/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PropertyIQHeader />

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-3xl text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Property Intelligence,{" "}
            <span className="text-primary">Delivered</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Carfax-style property reports with owner intelligence, roof condition scoring, and contractor opportunity analysis for South Florida commercial properties.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter a property address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-10">What You Get</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="text-center">
                <CardContent className="pt-6 space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-10">Pricing</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {pricingTiers.map((tier) => (
              <Card key={tier.name} className={tier.highlight ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''}>
                <CardHeader className="text-center">
                  <CardTitle>{tier.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tier.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </div>
                  ))}
                  <Button className="w-full mt-4" variant={tier.highlight ? 'default' : 'outline'} onClick={() => navigate('/property-iq/auth')}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <PropertyIQFooter />
    </div>
  );
};

export default PropertyIQ;
