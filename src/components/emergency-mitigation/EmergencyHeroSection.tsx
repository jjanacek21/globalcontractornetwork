import { Button } from "@/components/ui/button";
import { Phone, Clock, Shield, ArrowRight } from "lucide-react";

export const EmergencyHeroSection = () => {
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,_hsl(0_84%_60%/0.3)_0%,_transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,_hsl(200_80%_50%/0.2)_0%,_transparent_50%)]" />
      </div>

      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          {/* Urgency Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-red-600/20 border border-red-500/50 px-4 py-2 text-sm font-medium text-red-400 animate-pulse">
            <Clock className="h-4 w-4" />
            <span>24/7 Emergency Response Available</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            Mold, Water, or Storm{" "}
            <span className="text-red-500">Emergency?</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
            South Florida's trusted 24/7 rapid response team. Certified experts on-site 
            within an hour to protect your home and health.
          </p>

          {/* Key Benefits */}
          <div className="flex flex-wrap justify-center gap-6 text-sm md:text-base">
            <div className="flex items-center gap-2 text-slate-300">
              <Shield className="h-5 w-5 text-green-500" />
              <span>IICRC Certified</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="h-5 w-5 text-blue-400" />
              <span>1-Hour Response</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Shield className="h-5 w-5 text-amber-500" />
              <span>Licensed & Insured</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a
              href="tel:2149982879"
              className="inline-flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-red-600/30 hover:shadow-red-600/50"
            >
              <Phone className="h-5 w-5" />
              Call Now: (214) 998-2879
            </a>
            <Button
              onClick={scrollToContact}
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-slate-900 px-8 py-4 text-lg h-auto"
            >
              Get Free Consultation
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Urgency Message */}
          <p className="text-sm text-slate-400 pt-4">
            <span className="text-red-400 font-semibold">Don't wait</span> – black mold and water damage can 
            escalate within 24-48 hours. Let our licensed team stop the damage today.
          </p>
        </div>
      </div>
    </section>
  );
};
