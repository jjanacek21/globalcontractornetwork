import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, ArrowRight } from "lucide-react";

interface Package {
  name: string;
  price: string;
  description: string;
  idealFor: string;
  features: string[];
  popular?: boolean;
}

const packages: Package[] = [
  {
    name: "Local Essentials",
    price: "$1,799",
    description: "Build a solid local presence and start generating leads",
    idealFor: "Smaller businesses seeking local presence",
    features: [
      "Google Business Profile (GMB) Management",
      "Local SEO Audit & Optimization",
      "Standard Google Ads Campaign",
      "Monthly Reporting & Analytics",
      "Dedicated Account Manager",
      "Email Support"
    ]
  },
  {
    name: "Digital Growth",
    price: "$2,399",
    description: "Scale your lead generation with multi-channel marketing",
    idealFor: "Established companies scaling lead generation",
    popular: true,
    features: [
      "Everything in Local Essentials",
      "Enhanced Google Ads Management",
      "Facebook/Instagram Ads",
      "Local SEO & GMB Optimization",
      "CRM Integration & Lead Automation",
      "Monthly Strategy & Growth Report",
      "Bi-Weekly Strategy Calls",
      "Priority Support"
    ]
  },
  {
    name: "Complete Domination",
    price: "$3,699",
    description: "Full-service marketing for maximum market share",
    idealFor: "Companies aiming for market domination",
    features: [
      "Everything in Digital Growth",
      "All-Inclusive Paid Ads (Google, YouTube, FB, IG)",
      "Full Local SEO & Content Strategy",
      "Website Maintenance & Growth",
      "CRM & Sales Pipeline Management",
      "Email/SMS Drip Campaigns",
      "Reputation Management & Branding",
      "Detailed Performance Reports",
      "Weekly Strategy Sessions",
      "Dedicated Success Manager"
    ]
  }
];

export function MarketingPackages() {
  const scrollToForm = () => {
    document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 mb-4">
            Marketing Packages
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            Choose Your Growth Path
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            All-in-one packages designed to help contractors grow their business at every stage.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {packages.map((pkg, index) => (
            <Card 
              key={index}
              className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-2 ${
                pkg.popular 
                  ? 'bg-white border-2 border-amber-500 shadow-2xl shadow-amber-500/20' 
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              {pkg.popular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    MOST POPULAR
                  </div>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-slate-900">{pkg.name}</CardTitle>
                <CardDescription className="text-slate-600">{pkg.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div>
                  <span className="text-4xl font-bold text-slate-900">{pkg.price}</span>
                  <span className="text-slate-600">/month</span>
                </div>
                
                <div className={`rounded-lg p-3 ${pkg.popular ? 'bg-amber-50' : 'bg-slate-100'}`}>
                  <p className="text-sm font-medium text-amber-600">Ideal for:</p>
                  <p className="text-sm text-slate-700">{pkg.idealFor}</p>
                </div>
                
                <ul className="space-y-3">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className={`h-5 w-5 mt-0.5 flex-shrink-0 ${pkg.popular ? 'text-amber-500' : 'text-green-500'}`} />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={scrollToForm}
                  className={`w-full ${
                    pkg.popular 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white' 
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
