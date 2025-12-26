import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Star, Shield, ArrowRight } from "lucide-react";

const DirectorySection = () => {
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

  const contractors = [
    {
      name: "Elite Roofing Co.",
      specialty: "Commercial Roofing",
      rating: 4.9,
      reviews: 127,
      verified: true,
    },
    {
      name: "Storm Shield Pros",
      specialty: "Emergency Services",
      rating: 4.8,
      reviews: 89,
      verified: true,
    },
    {
      name: "Coastal Windows",
      specialty: "Impact Windows",
      rating: 5.0,
      reviews: 64,
      verified: true,
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="directory"
      className="relative py-24 bg-gcn-black overflow-hidden"
    >
      {/* Map-like background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, hsl(45 100% 51% / 0.3) 0%, transparent 25%),
              radial-gradient(circle at 75% 75%, hsl(45 100% 51% / 0.2) 0%, transparent 25%),
              radial-gradient(circle at 50% 50%, hsl(45 100% 51% / 0.1) 0%, transparent 50%)
            `,
          }}
        />
        {/* Grid lines simulating map */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(hsla(45, 100%, 51%, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, hsla(45, 100%, 51%, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: "100px 100px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Map Preview */}
          <div
            className={`transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            }`}
          >
            <div className="relative bg-gcn-charcoal-light rounded-2xl p-6 border border-gcn-charcoal-light overflow-hidden">
              {/* Map placeholder with pins */}
              <div className="aspect-square relative bg-gcn-charcoal rounded-xl overflow-hidden">
                {/* Simulated map grid */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `
                      linear-gradient(hsla(45, 100%, 51%, 0.1) 1px, transparent 1px),
                      linear-gradient(90deg, hsla(45, 100%, 51%, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: "40px 40px",
                  }}
                />

                {/* Map pins */}
                {[
                  { top: "20%", left: "30%" },
                  { top: "40%", left: "60%" },
                  { top: "60%", left: "25%" },
                  { top: "35%", left: "45%" },
                  { top: "70%", left: "70%" },
                ].map((position, index) => (
                  <div
                    key={index}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                    style={{
                      top: position.top,
                      left: position.left,
                      animationDelay: `${index * 200}ms`,
                    }}
                  >
                    <MapPin className="w-8 h-8 text-gcn-gold drop-shadow-lg" />
                  </div>
                ))}

                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gcn-gold text-4xl font-bold">10,000+</p>
                    <p className="text-gcn-white-muted text-sm">
                      Verified Contractors
                    </p>
                  </div>
                </div>
              </div>

              {/* Search bar preview */}
              <div className="mt-4 flex items-center gap-3 bg-gcn-charcoal rounded-lg px-4 py-3">
                <Search className="w-5 h-5 text-gcn-white-muted" />
                <span className="text-gcn-white-muted text-sm">
                  Search by location or service...
                </span>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div
            className={`transition-all duration-1000 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
            }`}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-gcn-gold/10 text-gcn-gold text-sm font-medium mb-4">
              Contractor Directory
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gcn-white mb-6">
              Find the Best Contractors—
              <span className="text-gradient-gold">All in One Place</span>
            </h2>
            <p className="text-gcn-white-muted text-lg mb-8 leading-relaxed">
              Our mission is to partner with the top companies in each region to
              lower customer acquisition cost and pass those savings directly to
              homeowners and businesses. We also work with a trusted network of
              subcontractors, eliminating unnecessary middlemen and speeding up
              project delivery.
            </p>

            {/* Contractor Preview Cards */}
            <div className="space-y-4 mb-8">
              {contractors.map((contractor, index) => (
                <div
                  key={contractor.name}
                  className="flex items-center gap-4 p-4 bg-gcn-charcoal-light/50 rounded-lg border border-gcn-charcoal-light hover:border-gcn-gold/30 transition-colors"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-full bg-gcn-gold/10 flex items-center justify-center">
                    <span className="text-gcn-gold font-bold">
                      {contractor.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-gcn-white font-semibold">
                        {contractor.name}
                      </h4>
                      {contractor.verified && (
                        <Shield className="w-4 h-4 text-gcn-gold" />
                      )}
                    </div>
                    <p className="text-gcn-white-muted text-sm">
                      {contractor.specialty}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-gcn-gold">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-semibold">{contractor.rating}</span>
                    </div>
                    <p className="text-gcn-white-muted text-xs">
                      {contractor.reviews} reviews
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={() => navigate("/directory")}
              size="lg"
              className="bg-gcn-gold hover:bg-gcn-gold-dark text-gcn-black font-bold px-8 group"
            >
              Browse Directory
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DirectorySection;