import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calculator, DollarSign, ArrowRight } from "lucide-react";

interface ServiceOption {
  id: string;
  name: string;
  price: number;
  priceType: "monthly" | "one-time";
  category: string;
}

const serviceOptions: ServiceOption[] = [
  // Monthly Services
  { id: "google-ads", name: "Google/YouTube Ads + GMB & GLS", price: 1699, priceType: "monthly", category: "Advertising" },
  { id: "fb-ads", name: "Facebook/Instagram Ads", price: 1399, priceType: "monthly", category: "Advertising" },
  { id: "crm-mgmt", name: "CRM Management", price: 800, priceType: "monthly", category: "CRM" },
  { id: "seo", name: "SEO & Website Optimization", price: 1399, priceType: "monthly", category: "SEO" },
  { id: "email-sms", name: "Email & SMS Drip Campaigns", price: 1749, priceType: "monthly", category: "Email" },
  { id: "design", name: "Design on Demand", price: 699, priceType: "monthly", category: "Design" },
  { id: "social", name: "Social Media Growth", price: 1650, priceType: "monthly", category: "Social" },
  { id: "newsletter", name: "Email Newsletter Management", price: 1299, priceType: "monthly", category: "Email" },
  // One-time Services
  { id: "crm-setup", name: "CRM Setup", price: 1499, priceType: "one-time", category: "CRM" },
  { id: "website", name: "Website Design & Development", price: 3499, priceType: "one-time", category: "Web" },
  { id: "landing", name: "Landing Page Creation", price: 449, priceType: "one-time", category: "Web" },
  { id: "branding", name: "Branding Package", price: 2499, priceType: "one-time", category: "Design" },
];

export function PricingCalculator() {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const toggleService = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const totals = useMemo(() => {
    const selected = serviceOptions.filter(s => selectedServices.includes(s.id));
    const monthlyTotal = selected.filter(s => s.priceType === "monthly").reduce((sum, s) => sum + s.price, 0);
    const oneTimeTotal = selected.filter(s => s.priceType === "one-time").reduce((sum, s) => sum + s.price, 0);
    return { monthlyTotal, oneTimeTotal };
  }, [selectedServices]);

  const scrollToForm = () => {
    document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const monthlyServices = serviceOptions.filter(s => s.priceType === "monthly");
  const oneTimeServices = serviceOptions.filter(s => s.priceType === "one-time");

  return (
    <section id="pricing-calculator" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 rounded-full px-4 py-2 mb-4">
            <Calculator className="h-4 w-4 text-blue-600" />
            <span className="text-blue-600 text-sm font-medium">Interactive Pricing Calculator</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            Build Your Custom Package
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Select the services you need and see your estimated investment in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Service Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Monthly Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700">Monthly</Badge>
                  Recurring Services
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {monthlyServices.map((service) => (
                  <div
                    key={service.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedServices.includes(service.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => toggleService(service.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        checked={selectedServices.includes(service.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{service.name}</div>
                        <div className="text-lg font-bold text-blue-600">${service.price.toLocaleString()}/mo</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* One-time Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary">One-Time</Badge>
                  Setup & Development
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {oneTimeServices.map((service) => (
                  <div
                    key={service.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedServices.includes(service.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => toggleService(service.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        checked={selectedServices.includes(service.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{service.name}</div>
                        <div className="text-lg font-bold text-green-600">${service.price.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Totals Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 bg-gradient-to-b from-slate-900 to-slate-800 text-white border-0 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <DollarSign className="h-5 w-5 text-amber-400" />
                  Your Investment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedServices.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">
                    Select services to see your estimated costs
                  </p>
                ) : (
                  <>
                    <div className="space-y-4">
                      {totals.monthlyTotal > 0 && (
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <div className="text-sm text-slate-400 mb-1">Monthly Investment</div>
                          <div className="text-3xl font-bold text-white">
                            ${totals.monthlyTotal.toLocaleString()}
                            <span className="text-lg text-slate-400">/mo</span>
                          </div>
                        </div>
                      )}
                      
                      {totals.oneTimeTotal > 0 && (
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <div className="text-sm text-slate-400 mb-1">One-Time Investment</div>
                          <div className="text-3xl font-bold text-white">
                            ${totals.oneTimeTotal.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-700 pt-4">
                      <div className="text-sm text-slate-400 mb-2">
                        {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
                      </div>
                      <ul className="space-y-1">
                        {serviceOptions
                          .filter(s => selectedServices.includes(s.id))
                          .map(s => (
                            <li key={s.id} className="text-sm text-slate-300 flex justify-between">
                              <span className="truncate mr-2">{s.name}</span>
                              <span>${s.price.toLocaleString()}</span>
                            </li>
                          ))
                        }
                      </ul>
                    </div>

                    <Button 
                      onClick={scrollToForm}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    >
                      Get Custom Quote
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
