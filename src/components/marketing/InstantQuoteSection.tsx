import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Clock, 
  Shield, 
  ArrowRight,
  Home,
  Paintbrush,
  DoorOpen,
  Trees,
  AlertTriangle,
  FileText,
  Ruler
} from "lucide-react";

const InstantQuoteSection = () => {
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

  const quoteTypes = [
    { icon: Home, label: "Roofing" },
    { icon: Paintbrush, label: "Coatings" },
    { icon: DoorOpen, label: "Windows" },
    { icon: Trees, label: "Landscaping" },
    { icon: AlertTriangle, label: "Mitigation" },
    { icon: FileText, label: "Insurance" },
    { icon: Ruler, label: "Engineering" },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-24 bg-gcn-charcoal overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 30% 20%, hsl(45 100% 51% / 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, hsl(45 100% 51% / 0.1) 0%, transparent 50%)
            `,
          }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div
            className={`transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            }`}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-gcn-gold/10 text-gcn-gold text-sm font-medium mb-4">
              AI-Powered Estimates
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gcn-white mb-6">
              Get a No-Obligation Instant Quote in{" "}
              <span className="text-gradient-gold">Under 60 Seconds</span>
            </h2>
            <p className="text-gcn-white-muted text-lg mb-8 leading-relaxed">
              Whether it's roofing, coatings, windows, mold removal, landscaping,
              mitigation, insurance claims, or property maintenance—our AI-powered
              estimator gives you a fast, accurate quote after just a few simple
              questions.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              {[
                { icon: Zap, text: "Instant Results" },
                { icon: Clock, text: "60 Seconds" },
                { icon: Shield, text: "No Obligation" },
              ].map((feature) => (
                <div
                  key={feature.text}
                  className="flex items-center gap-3 text-gcn-white-muted"
                >
                  <div className="w-10 h-10 rounded-lg bg-gcn-gold/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-gcn-gold" />
                  </div>
                  <span className="font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => navigate("/roofing")}
              size="lg"
              className="bg-gcn-gold hover:bg-gcn-gold-dark text-gcn-black font-bold text-lg px-8 py-6 rounded-lg shadow-lg animate-glow-pulse group"
            >
              Start My Instant Quote
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Right Content - Interactive UI Preview */}
          <div
            className={`transition-all duration-1000 delay-300 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
            }`}
          >
            <div className="relative">
              {/* Main Card */}
              <div className="bg-gcn-charcoal-light rounded-2xl border border-gcn-charcoal-light p-8 shadow-2xl">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-4 text-gcn-white-muted text-sm">
                    AI Quote Generator
                  </span>
                </div>

                {/* Quote Type Selection */}
                <div className="mb-6">
                  <p className="text-gcn-white text-sm mb-3">
                    Select your service type:
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {quoteTypes.map((type, index) => (
                      <div
                        key={type.label}
                        className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                          index === 0
                            ? "border-gcn-gold bg-gcn-gold/10 text-gcn-gold"
                            : "border-gcn-charcoal-light text-gcn-white-muted hover:border-gcn-gold/50"
                        }`}
                      >
                        <type.icon className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-xs">{type.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-gcn-white-muted mb-2">
                    <span>Progress</span>
                    <span>Step 1 of 4</span>
                  </div>
                  <div className="h-2 bg-gcn-charcoal rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gcn-gold to-gcn-gold-light rounded-full"
                      style={{ width: "25%" }}
                    />
                  </div>
                </div>

                {/* Animated estimate preview */}
                <div className="bg-gcn-charcoal/50 rounded-lg p-4 border border-gcn-charcoal-light">
                  <p className="text-gcn-white-muted text-sm mb-2">
                    Estimated Range:
                  </p>
                  <p className="text-2xl font-bold text-gradient-gold">
                    $8,500 - $12,000
                  </p>
                  <p className="text-gcn-white-muted text-xs mt-1">
                    Based on 2,400 sq ft roof
                  </p>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gcn-gold/20 rounded-full blur-xl animate-pulse" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gcn-gold/10 rounded-full blur-xl animate-pulse delay-500" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstantQuoteSection;