import { Check, X, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Feature {
  name: string;
  localEssentials: boolean | string;
  digitalGrowth: boolean | string;
  completeDomination: boolean | string;
}

const features: Feature[] = [
  { name: "Google Business Profile Management", localEssentials: true, digitalGrowth: true, completeDomination: true },
  { name: "Local SEO Audit & Optimization", localEssentials: true, digitalGrowth: true, completeDomination: true },
  { name: "Google Ads Campaign", localEssentials: "Standard", digitalGrowth: "Enhanced", completeDomination: "All-Inclusive" },
  { name: "Facebook/Instagram Ads", localEssentials: false, digitalGrowth: true, completeDomination: true },
  { name: "YouTube Ads", localEssentials: false, digitalGrowth: false, completeDomination: true },
  { name: "CRM Integration", localEssentials: false, digitalGrowth: true, completeDomination: true },
  { name: "Lead Automation", localEssentials: false, digitalGrowth: true, completeDomination: true },
  { name: "Website Maintenance", localEssentials: false, digitalGrowth: false, completeDomination: true },
  { name: "Email/SMS Drip Campaigns", localEssentials: false, digitalGrowth: false, completeDomination: true },
  { name: "Reputation Management", localEssentials: false, digitalGrowth: false, completeDomination: true },
  { name: "Monthly Reporting", localEssentials: "Basic", digitalGrowth: "Detailed", completeDomination: "Comprehensive" },
  { name: "Strategy Calls", localEssentials: "Monthly Email", digitalGrowth: "Bi-Weekly", completeDomination: "Weekly" },
  { name: "Account Manager", localEssentials: "Shared", digitalGrowth: "Dedicated", completeDomination: "Success Manager" },
  { name: "Support Level", localEssentials: "Email", digitalGrowth: "Priority", completeDomination: "24/7 Priority" },
];

export function PackageComparisonTable() {
  const scrollToForm = () => {
    document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderValue = (value: boolean | string, isPopular: boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className={`h-5 w-5 ${isPopular ? 'text-amber-500' : 'text-green-500'}`} />
      ) : (
        <X className="h-5 w-5 text-slate-300" />
      );
    }
    return <span className={`text-sm font-medium ${isPopular ? 'text-amber-600' : 'text-slate-700'}`}>{value}</span>;
  };

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            Compare Marketing Packages
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            See exactly what's included in each package to make the right choice for your business.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="text-left p-6 font-semibold">Features</th>
                <th className="p-6 text-center">
                  <div className="font-semibold">Local Essentials</div>
                  <div className="text-amber-400 text-2xl font-bold mt-1">$1,799/mo</div>
                </th>
                <th className="p-6 text-center bg-amber-500/20 relative">
                  <div className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Badge className="bg-amber-500 text-white flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      POPULAR
                    </Badge>
                  </div>
                  <div className="font-semibold">Digital Growth</div>
                  <div className="text-amber-400 text-2xl font-bold mt-1">$2,399/mo</div>
                </th>
                <th className="p-6 text-center">
                  <div className="font-semibold">Complete Domination</div>
                  <div className="text-amber-400 text-2xl font-bold mt-1">$3,699/mo</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr 
                  key={index}
                  className={`border-b border-slate-100 ${index % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}`}
                >
                  <td className="p-4 font-medium text-slate-700">{feature.name}</td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center">
                      {renderValue(feature.localEssentials, false)}
                    </div>
                  </td>
                  <td className="p-4 text-center bg-amber-50/50">
                    <div className="flex justify-center">
                      {renderValue(feature.digitalGrowth, true)}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center">
                      {renderValue(feature.completeDomination, false)}
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-100">
                <td className="p-6"></td>
                <td className="p-6 text-center">
                  <Button onClick={scrollToForm} variant="outline" className="border-slate-300">
                    Get Started
                  </Button>
                </td>
                <td className="p-6 text-center bg-amber-100/50">
                  <Button 
                    onClick={scrollToForm}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  >
                    Get Started
                  </Button>
                </td>
                <td className="p-6 text-center">
                  <Button onClick={scrollToForm} variant="outline" className="border-slate-300">
                    Get Started
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
