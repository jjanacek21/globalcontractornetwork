import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  BarChart3,
  Target,
  Megaphone,
  Code,
  Users,
  ArrowRight,
} from "lucide-react";

const BusinessServicesSection = () => {
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
    {
      icon: Target,
      title: "Digital Advertising",
      description: "Targeted campaigns that bring qualified leads",
    },
    {
      icon: BarChart3,
      title: "Data Analytics",
      description: "Track performance and optimize ROI",
    },
    {
      icon: Code,
      title: "CRM Development",
      description: "Custom systems for your workflow",
    },
    {
      icon: Megaphone,
      title: "Brand Strategy",
      description: "Build a memorable industry presence",
    },
    {
      icon: TrendingUp,
      title: "AI Automation",
      description: "Streamline operations with smart tech",
    },
    {
      icon: Users,
      title: "Lead Generation",
      description: "Consistent flow of quality prospects",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-24 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, hsl(0 0% 8%) 0%, hsl(0 0% 12%) 50%, hsl(45 20% 10%) 100%)`,
      }}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                hsla(45, 100%, 51%, 0.1) 10px,
                hsla(45, 100%, 51%, 0.1) 20px
              )
            `,
          }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        {/* Section Header */}
        <div
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-gcn-gold/10 text-gcn-gold text-sm font-medium mb-4">
            B2B Services
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gcn-white mb-6">
            Marketing & Consulting for{" "}
            <span className="text-gradient-gold">Blue Collar Businesses</span>
          </h2>
          <p className="text-gcn-white-muted text-lg leading-relaxed">
            We help trades and contractors scale through data-driven marketing, AI
            automation, CRM development, branding, and digital advertising. Whether
            you're a startup or a multi-million-dollar operation, we help you grow.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {services.map((service, index) => (
            <div
              key={service.title}
              className={`group p-6 rounded-xl bg-gcn-charcoal/50 border border-gcn-charcoal-light hover:border-gcn-gold/30 transition-all duration-500 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100 + 200}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gcn-gold/10 flex items-center justify-center shrink-0 group-hover:bg-gcn-gold/20 transition-colors">
                  <service.icon className="w-6 h-6 text-gcn-gold" />
                </div>
                <div>
                  <h3 className="text-gcn-white font-semibold text-lg mb-1 group-hover:text-gcn-gold transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-gcn-white-muted text-sm">
                    {service.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className={`text-center transition-all duration-1000 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <Button
            onClick={() => navigate("/digital-marketing")}
            size="lg"
            className="bg-gcn-gold hover:bg-gcn-gold-dark text-gcn-black font-bold px-8 group"
          >
            Explore Marketing Services
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BusinessServicesSection;