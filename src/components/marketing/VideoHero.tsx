import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";

const VideoHero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Gradient Background (Video Placeholder) */}
      <div className="absolute inset-0 bg-gcn-black">
        {/* Cinematic gradient overlay simulating video */}
        <div 
          className="absolute inset-0 animate-gradient-shift"
          style={{
            background: `
              linear-gradient(
                135deg,
                hsl(0 0% 8%) 0%,
                hsl(0 0% 12%) 25%,
                hsl(45 30% 15%) 50%,
                hsl(0 0% 10%) 75%,
                hsl(0 0% 8%) 100%
              )
            `,
            backgroundSize: "400% 400%",
          }}
        />
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(hsla(45, 100%, 51%, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, hsla(45, 100%, 51%, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Video overlay gradient */}
        <div className="video-overlay absolute inset-0" />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-1/4 left-10 w-2 h-2 bg-gcn-gold rounded-full animate-float opacity-60" />
      <div className="absolute top-1/3 right-20 w-3 h-3 bg-gcn-gold rounded-full animate-float delay-300 opacity-40" />
      <div className="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 bg-gcn-gold rounded-full animate-float delay-500 opacity-50" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect text-gcn-gold text-sm font-medium mb-8 animate-fade-in-up">
          <span className="w-2 h-2 bg-gcn-gold rounded-full animate-pulse" />
          Trusted by 10,000+ Contractors Nationwide
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gcn-white mb-6 animate-fade-in-up delay-100 leading-tight">
          Your All-In-One Solution for
          <br />
          <span className="text-gradient-gold">Every Contractor Need.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-gcn-white-muted text-lg md:text-xl max-w-3xl mx-auto mb-8 animate-fade-in-up delay-200">
          Roofing • Coatings • Permits • Supplements • Windows & Doors • Emergency Mitigation • Landscaping • Mold Removal • And More
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-300">
          <Button
            onClick={() => navigate("/roofing")}
            size="lg"
            className="bg-gcn-gold hover:bg-gcn-gold-dark text-gcn-black font-bold text-lg px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-all animate-glow-pulse group"
          >
            Get an Instant Quote
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            onClick={() => navigate("/join")}
            size="lg"
            variant="outline"
            className="border-gcn-white/30 text-gcn-white hover:bg-gcn-white/10 hover:border-gcn-gold font-semibold text-lg px-8 py-6 rounded-lg transition-all group"
          >
            <Users className="w-5 h-5 mr-2" />
            Join the Network (Free)
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 flex flex-wrap justify-center items-center gap-8 animate-fade-in-up delay-500 opacity-60">
          <div className="flex items-center gap-2 text-gcn-white-muted text-sm">
            <div className="w-8 h-8 rounded-full bg-gcn-charcoal-light flex items-center justify-center">
              ⭐
            </div>
            <span>4.9/5 Rating</span>
          </div>
          <div className="flex items-center gap-2 text-gcn-white-muted text-sm">
            <div className="w-8 h-8 rounded-full bg-gcn-charcoal-light flex items-center justify-center">
              🏆
            </div>
            <span>Licensed & Insured</span>
          </div>
          <div className="flex items-center gap-2 text-gcn-white-muted text-sm">
            <div className="w-8 h-8 rounded-full bg-gcn-charcoal-light flex items-center justify-center">
              ✓
            </div>
            <span>100% Satisfaction</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-gcn-white/30 rounded-full flex justify-center">
          <div className="w-1.5 h-3 bg-gcn-gold rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default VideoHero;