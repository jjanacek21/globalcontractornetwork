import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Instagram, Plus } from "lucide-react";

interface SocialPackage {
  name: string;
  price: string;
  platforms: string;
  features: string[];
  popular?: boolean;
}

const socialPackages: SocialPackage[] = [
  {
    name: "Essential Presence",
    price: "$850",
    platforms: "1 Platform",
    features: [
      "8 Custom Posts/Month (branded graphics + captions)",
      "Hashtag Research & Post Scheduling",
      "Profile Optimization",
      "Monthly Performance Report",
      "Phone/Text Support Included",
      "Optional: TikTok/Reels Editing +$75/piece"
    ]
  },
  {
    name: "Growth Plan",
    price: "$1,350",
    platforms: "2 Platforms",
    popular: true,
    features: [
      "15 Custom Posts/Month",
      "Community Engagement (3x/Week)",
      "Full Monthly Analytics + Strategy Call",
      "Profile Optimization",
      "Phone/Text Support Included",
      "Optional: Video/Reel Editing +$75/piece"
    ]
  },
  {
    name: "Brand Expansion",
    price: "$1,750",
    platforms: "3 Platforms",
    features: [
      "20 Custom Posts/Month",
      "Up to 6 Edited Videos/Reels/Month",
      "Custom Story Content (10/month)",
      "Advanced Hashtag Strategy",
      "Full Community Engagement (5x/Week)",
      "Bi-Weekly Strategy Calls",
      "Full Performance Reporting",
      "Priority Phone/Text Support"
    ]
  }
];

const addOns = [
  { name: "Additional Platform", price: "+$100/month" },
  { name: "Video or Reel Editing", price: "+$75 each" }
];

export function SocialMediaPackages() {
  const scrollToForm = () => {
    document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-pink-500/20 rounded-full px-4 py-2 mb-4">
            <Instagram className="h-4 w-4 text-pink-400" />
            <span className="text-pink-400 text-sm font-medium">Social Media Management</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Grow Your Social Presence
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Professional social media management that builds your brand and engages your audience.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {socialPackages.map((pkg, index) => (
            <Card 
              key={index}
              className={`relative transition-all duration-300 hover:-translate-y-2 ${
                pkg.popular 
                  ? 'bg-white border-pink-500 shadow-xl shadow-pink-500/10' 
                  : 'bg-slate-800/50 border-slate-700'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4">
                    BEST VALUE
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <Badge variant="outline" className={`w-fit mx-auto mb-3 ${pkg.popular ? 'border-slate-300' : 'border-slate-600 text-slate-300'}`}>
                  {pkg.platforms}
                </Badge>
                <CardTitle className={`text-2xl ${pkg.popular ? 'text-slate-900' : 'text-white'}`}>{pkg.name}</CardTitle>
                <div className="mt-4">
                  <span className={`text-4xl font-bold ${pkg.popular ? 'text-slate-900' : 'text-white'}`}>{pkg.price}</span>
                  <span className={pkg.popular ? 'text-slate-500' : 'text-slate-400'}>/month</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className={`h-5 w-5 mt-0.5 flex-shrink-0 ${pkg.popular ? 'text-pink-500' : 'text-green-400'}`} />
                      <span className={`text-sm ${pkg.popular ? 'text-slate-600' : 'text-slate-300'}`}>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={scrollToForm}
                  className={`w-full ${
                    pkg.popular 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white' 
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add-ons */}
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-pink-400" />
            Available Add-Ons
          </h3>
          <div className="flex flex-wrap gap-4">
            {addOns.map((addon, index) => (
              <div key={index} className="bg-slate-700/50 rounded-lg px-4 py-3 flex items-center gap-3 border border-slate-600">
                <span className="text-slate-300">{addon.name}</span>
                <Badge variant="secondary" className="bg-pink-500/20 text-pink-400">
                  {addon.price}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
