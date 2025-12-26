import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Users,
  Target,
  Headphones,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const FranchiseSection = () => {
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

  const benefits = [
    {
      icon: Target,
      title: "Exclusive Leads",
      description: "Qualified leads delivered directly to you",
    },
    {
      icon: TrendingUp,
      title: "Marketing Systems",
      description: "Proven campaigns that generate results",
    },
    {
      icon: Users,
      title: "Network Access",
      description: "Connect with 10,000+ contractors",
    },
    {
      icon: Headphones,
      title: "Operational Support",
      description: "Training, tools, and ongoing assistance",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-24 bg-gcn-black overflow-hidden"
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, hsl(45 100% 51% / 0.1) 0%, transparent 50%),
            linear-gradient(180deg, hsl(0 0% 8%) 0%, hsl(0 0% 10%) 100%)
          `,
        }}
      />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div
            className={`transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            }`}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-gcn-gold/10 text-gcn-gold text-sm font-medium mb-4">
              Franchise Opportunity
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gcn-white mb-6">
              <span className="text-gradient-gold">Grow With Us.</span>
            </h2>
            <p className="text-gcn-white-muted text-lg mb-8 leading-relaxed">
              Are you a skilled roofer or contractor wanting to scale your
              revenue? Partner with GCN and unlock exclusive leads, marketing
              systems, and operational support that accelerate your growth.
            </p>

            {/* Benefits list */}
            <div className="space-y-4 mb-8">
              {[
                "Instant access to our lead generation network",
                "Full marketing and branding support",
                "CRM and operational tools included",
                "Training programs for you and your team",
                "Preferred vendor pricing on materials",
                "Ongoing coaching and business development",
              ].map((benefit, index) => (
                <div
                  key={benefit}
                  className="flex items-center gap-3"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CheckCircle className="w-5 h-5 text-gcn-gold shrink-0" />
                  <span className="text-gcn-white-muted">{benefit}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => navigate("/franchise")}
              size="lg"
              className="bg-gcn-gold hover:bg-gcn-gold-dark text-gcn-black font-bold px-8 group"
            >
              Request Franchise Info
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Right - Benefit Cards */}
          <div
            className={`transition-all duration-1000 delay-300 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
            }`}
          >
            <div className="grid grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div
                  key={benefit.title}
                  className="group p-6 rounded-xl bg-gcn-charcoal-light/50 border border-gcn-charcoal-light hover:border-gcn-gold/50 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    transitionDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="w-12 h-12 rounded-lg bg-gcn-gold/10 flex items-center justify-center mb-4 group-hover:bg-gcn-gold/20 transition-colors">
                    <benefit.icon className="w-6 h-6 text-gcn-gold" />
                  </div>
                  <h3 className="text-gcn-white font-semibold text-lg mb-2 group-hover:text-gcn-gold transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-gcn-white-muted text-sm">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Success metric */}
            <div className="mt-6 p-6 bg-gcn-gold/10 rounded-xl border border-gcn-gold/30 text-center">
              <p className="text-4xl font-bold text-gradient-gold mb-2">200%</p>
              <p className="text-gcn-white-muted text-sm">
                Average revenue growth in first year
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FranchiseSection;