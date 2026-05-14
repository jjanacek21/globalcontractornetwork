import { useEffect, useRef, useState } from "react";
import {
  Home,
  Paintbrush,
  FileCheck,
  DollarSign,
  SquareAsterisk,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import ServicePanel from "./ServicePanel";

const CategoryGrid = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const services = [
    {
      icon: Home,
      title: "Roofing Services",
      description:
        "Complete roofing solutions including shingles, tile, metal, commercial roofing, repairs, and full replacements.",
      link: "/roofing",
    },
    {
      icon: Paintbrush,
      title: "Coating Kingz",
      description:
        "High-performance roof coatings, cool-roof systems, and commercial flat roof restoration by certified specialists.",
      link: "/coating-kings",
    },
    {
      icon: FileCheck,
      title: "Permit Queens",
      description:
        "Expert permit expediting and full submission support. We handle the paperwork so you can focus on the work.",
      link: "/permit-queens",
    },
    {
      icon: DollarSign,
      title: "Estimating & Supplementing",
      description:
        "Insurance supplementing, Xactimate estimates, claim management, and maximum settlement recovery.",
      link: "/contractor/estimating",
    },
    {
      icon: SquareAsterisk,
      title: "Windows & Doors",
      description:
        "Impact windows, hurricane doors, energy-efficient options, and expert installation services.",
      link: "/services",
    },
    {
      icon: AlertTriangle,
      title: "Emergency Services",
      description:
        "24/7 water damage, mold remediation, tarping, tree removal, and storm cleanup response team.",
      link: "/emergency-mitigation",
    },
    {
      icon: TrendingUp,
      title: "Digital Marketing",
      description:
        "Full-service marketing, social media management, CRM setup, website design, and lead generation.",
      link: "/digital-marketing",
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="services"
      className="relative py-24 bg-gcn-black overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gcn-gold/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gcn-gold/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        {/* Section header */}
        <div
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-gcn-gold/10 text-gcn-gold text-sm font-medium mb-4">
            Our Services
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gcn-white mb-4">
            Everything You Need,{" "}
            <span className="text-gradient-gold">All in One Place</span>
          </h2>
          <p className="text-gcn-white-muted text-lg max-w-2xl mx-auto">
            From roofing to restoration, permits to payments—we've got every
            aspect of your project covered.
          </p>
        </div>

        {/* Service Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <ServicePanel
              key={service.title}
              icon={service.icon}
              title={service.title}
              description={service.description}
              link={service.link}
              delay={index * 100}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;