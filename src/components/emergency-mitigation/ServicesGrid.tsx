import { AlertTriangle, Droplets, Wind, Home, FlaskConical, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ServicesGrid = () => {
  const services = [
    {
      icon: AlertTriangle,
      title: "Mold Remediation",
      description: "Comprehensive removal of mold colonies, contaminated material disposal, disinfection, and prevention. HEPA air filtration and antimicrobial treatments.",
      priceRange: "$10 - $25 per sq ft",
      examples: "Small area: $500-$1,200 | Room: $2,000-$4,000 | Whole home: $10,000+",
      color: "bg-red-600",
      bgColor: "bg-red-50"
    },
    {
      icon: FlaskConical,
      title: "Air Quality Testing",
      description: "Professional mold inspections and indoor air quality testing to identify mold species and spore levels. Detailed lab reports included.",
      priceRange: "$300 - $600",
      examples: "Testing fees credited toward remediation if you proceed with us",
      color: "bg-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: Droplets,
      title: "Water Mitigation",
      description: "24/7 rapid response to water leaks, floods, or storm water intrusion. Immediate extraction, industrial drying, and moisture monitoring.",
      priceRange: "$3 - $7 per sq ft",
      examples: "Most homeowners pay $1,500-$6,000 | Immediate action saves thousands",
      color: "bg-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Wind,
      title: "Storm Damage Cleanup",
      description: "Complete cleanup after hurricanes or severe storms. Debris removal, structural drying, board-up repairs, and insurance coordination.",
      priceRange: "Variable",
      examples: "Minor: $2,000-$5,000 | Major hurricane: $10,000-$20,000+ (often covered by insurance)",
      color: "bg-slate-700",
      bgColor: "bg-slate-50"
    },
    {
      icon: Home,
      title: "Roof Tarping & Leak Repair",
      description: "Emergency roof tarp installation to quickly stop active leaks. Heavy-duty tarps with proper anchoring to code. Quick deployment within hours.",
      priceRange: "$0.70 - $2.80 per sq ft",
      examples: "Standard: $500-$1,500 | Emergency after-hours rates apply",
      color: "bg-amber-600",
      bgColor: "bg-amber-50"
    }
  ];

  const scrollToEstimate = () => {
    document.getElementById("estimate")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="services" className="py-20 bg-white">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Our Emergency Services
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From mold remediation to storm damage cleanup, we handle every aspect of your emergency 
            with certified expertise and transparent pricing.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.title}
              className={`${service.bgColor} rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all`}
            >
              <div className={`${service.color} inline-flex p-3 rounded-lg mb-4`}>
                <service.icon className="h-6 w-6 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {service.title}
              </h3>
              
              <p className="text-slate-600 text-sm mb-4">
                {service.description}
              </p>
              
              <div className="border-t border-slate-200 pt-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-700">{service.priceRange}</span>
                </div>
                <p className="text-xs text-slate-500">{service.examples}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            onClick={scrollToEstimate}
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white px-8"
          >
            Get Your Free Estimate
          </Button>
          <p className="text-sm text-slate-500 mt-3">
            Free on-site assessment provides detailed, written estimates
          </p>
        </div>
      </div>
    </section>
  );
};
