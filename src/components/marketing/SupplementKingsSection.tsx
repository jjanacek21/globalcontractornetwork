import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  FileText,
  Upload,
  Calculator,
  Scale,
  Mail,
  Satellite,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const SupplementKingsSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const services = [
    { icon: Calculator, label: "Xactimate Estimates", highlight: "Flat Fee" },
    { icon: FileText, label: "Supplement Support", highlight: "10% Fee" },
    { icon: Scale, label: "Engineering Reports", highlight: "Expert" },
    { icon: Mail, label: "Magic Letter Service", highlight: "Exclusive" },
    { icon: Satellite, label: "Satellite Measurements", highlight: "Accurate" },
    { icon: Upload, label: "Photo Upload Portal", highlight: "Easy" },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-24 bg-gcn-black overflow-hidden"
    >
      {/* Gold accent background */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gcn-gold to-transparent" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Service Cards */}
          <div
            className={`transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            }`}
          >
            <div className="grid grid-cols-2 gap-4">
              {services.map((service, index) => (
                <div
                  key={service.label}
                  className="group p-5 bg-gcn-charcoal-light/50 rounded-xl border border-gcn-charcoal-light hover:border-gcn-gold/50 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    transitionDelay: `${index * 50}ms`,
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gcn-gold/10 flex items-center justify-center group-hover:bg-gcn-gold/20 transition-colors">
                      <service.icon className="w-5 h-5 text-gcn-gold" />
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-gcn-gold/10 text-gcn-gold font-medium">
                      {service.highlight}
                    </span>
                  </div>
                  <h3 className="text-gcn-white font-semibold text-sm group-hover:text-gcn-gold transition-colors">
                    {service.label}
                  </h3>
                </div>
              ))}
            </div>

            {/* Stats bar */}
            <div className="mt-8 grid grid-cols-3 gap-4 p-4 bg-gcn-charcoal-light/30 rounded-xl">
              {[
                { value: "$50M+", label: "Recovered" },
                { value: "5,000+", label: "Claims" },
                { value: "95%", label: "Success Rate" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-xl font-bold text-gradient-gold">
                    {stat.value}
                  </p>
                  <p className="text-gcn-white-muted text-xs">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content */}
          <div
            className={`transition-all duration-1000 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
            }`}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-gcn-gold/10 text-gcn-gold text-sm font-medium mb-4">
              Supplement Kings
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gcn-white mb-6">
              Insurance Estimates, Supplements &{" "}
              <span className="text-gradient-gold">Claim Support</span>
            </h2>
            <p className="text-gcn-white-muted text-lg mb-8 leading-relaxed">
              Maximize your insurance settlements with our expert supplementing
              services. From initial estimates to final recovery, we fight for
              every dollar you deserve.
            </p>

            {/* Feature list */}
            <div className="space-y-3 mb-8">
              {[
                "Flat-fee Xactimate estimates",
                "Supplement support (10% of settlement increase)",
                "Engineering reports & documentation",
                "Attorney connections for disputed claims",
                "Appraisal guidance & support",
                'Exclusive "Magic Letter" service',
                "Line-item satellite roof measurement package",
              ].map((feature, index) => (
                <div
                  key={feature}
                  className="flex items-center gap-3"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CheckCircle className="w-5 h-5 text-gcn-gold shrink-0" />
                  <span className="text-gcn-white-muted text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => navigate("/supplement-kings")}
              size="lg"
              className="bg-gcn-gold hover:bg-gcn-gold-dark text-gcn-black font-bold px-8 group"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Get Started
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SupplementKingsSection;