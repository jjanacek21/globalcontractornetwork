import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Images, UserPlus } from "lucide-react";

const FinalHeroSection = () => {
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

  return (
    <section
      ref={sectionRef}
      className="relative py-32 overflow-hidden"
    >
      {/* Cinematic background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 animate-gradient-shift"
          style={{
            background: `
              linear-gradient(
                135deg,
                hsl(0 0% 6%) 0%,
                hsl(0 0% 10%) 25%,
                hsl(45 30% 12%) 50%,
                hsl(0 0% 8%) 75%,
                hsl(0 0% 6%) 100%
              )
            `,
            backgroundSize: "400% 400%",
          }}
        />
        {/* Gold accent overlays */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gcn-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gcn-gold/5 rounded-full blur-3xl" />
        {/* Video overlay gradient */}
        <div className="video-overlay absolute inset-0" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gcn-gold rounded-full animate-float opacity-40"
            style={{
              top: `${20 + i * 15}%`,
              left: `${10 + i * 15}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div
          className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect text-gcn-gold text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-gcn-gold rounded-full animate-pulse" />
            Coming Soon: Mobile App & New Features
          </div>

          {/* Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gcn-white mb-6">
            Much More{" "}
            <span className="text-gradient-gold">On The Way.</span>
          </h2>

          {/* Description */}
          <p className="text-gcn-white-muted text-lg md:text-xl mb-12 max-w-2xl mx-auto">
            Join the Global Contractor Network today and get access to instant
            quotes, contractor tools, permit services, insurance support, and
            more. The future of contracting starts here.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => navigate("/join")}
              size="lg"
              className="bg-gcn-gold hover:bg-gcn-gold-dark text-gcn-black font-bold text-lg px-10 py-6 rounded-lg shadow-lg animate-glow-pulse group"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Sign Up Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={() => navigate("/directory")}
              size="lg"
              variant="outline"
              className="border-gcn-white/30 text-gcn-white hover:bg-gcn-white/10 hover:border-gcn-gold font-semibold text-lg px-10 py-6 rounded-lg group"
            >
              <Images className="w-5 h-5 mr-2" />
              View Gallery
            </Button>
          </div>

          {/* Future features preview */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Mobile App",
              "AI Assistant",
              "Video Inspections",
              "Smart Scheduling",
            ].map((feature, index) => (
              <div
                key={feature}
                className={`p-4 rounded-lg glass-effect text-center transition-all duration-500 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 100 + 500}ms` }}
              >
                <p className="text-gcn-white-muted text-sm font-medium">
                  {feature}
                </p>
                <p className="text-gcn-gold text-xs mt-1">Coming Soon</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalHeroSection;