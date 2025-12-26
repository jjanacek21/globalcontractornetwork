import { useEffect, useRef, useState } from "react";
import { Globe, Shield, Zap, Award } from "lucide-react";

const MiniIntro = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

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

  const features = [
    {
      icon: Globe,
      title: "Nationwide Network",
      description: "Access top contractors across all 50 states",
    },
    {
      icon: Shield,
      title: "Fully Vetted",
      description: "Licensed, insured, and background-checked",
    },
    {
      icon: Zap,
      title: "Instant Quotes",
      description: "AI-powered estimates in under 60 seconds",
    },
    {
      icon: Award,
      title: "Quality Guaranteed",
      description: "Satisfaction guaranteed on every project",
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative py-24 bg-gcn-charcoal overflow-hidden"
    >
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, hsl(45 100% 51% / 0.2) 0%, transparent 50%),
                             radial-gradient(circle at 80% 50%, hsl(45 100% 51% / 0.1) 0%, transparent 50%)`,
          }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        {/* Main intro text */}
        <div
          className={`max-w-4xl mx-auto text-center mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gcn-white mb-6">
            One Platform.{" "}
            <span className="text-gradient-gold">Every Service.</span>
          </h2>
          <p className="text-gcn-white-muted text-lg md:text-xl leading-relaxed">
            The Global Contractor Network connects homeowners, property managers,
            and business owners with the top contractors, engineers, specialists,
            and service providers nationwide. From roofing to mold remediation,
            from permit expediting to insurance claims—we handle it all under one
            powerful platform.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group p-6 rounded-xl bg-gcn-charcoal-light/50 border border-gcn-charcoal-light hover:border-gcn-gold/50 transition-all duration-500 premium-card ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100 + 200}ms` }}
            >
              <div className="w-14 h-14 rounded-lg bg-gcn-gold/10 flex items-center justify-center mb-4 group-hover:bg-gcn-gold/20 transition-colors">
                <feature.icon className="w-7 h-7 text-gcn-gold" />
              </div>
              <h3 className="text-gcn-white font-semibold text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-gcn-white-muted text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div
          className={`mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-t border-b border-gcn-charcoal-light transition-all duration-1000 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {[
            { value: "10K+", label: "Contractors" },
            { value: "$50M+", label: "Projects Completed" },
            { value: "50", label: "States Covered" },
            { value: "98%", label: "Satisfaction Rate" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient-gold mb-1">
                {stat.value}
              </div>
              <div className="text-gcn-white-muted text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MiniIntro;