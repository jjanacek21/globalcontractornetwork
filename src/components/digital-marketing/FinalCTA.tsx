import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

export function FinalCTA() {
  const scrollToForm = () => {
    document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPackages = () => {
    document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToCalculator = () => {
    document.getElementById('pricing-calculator')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-orange-600 to-red-600" />
      
      {/* Animated overlay elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      </div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Ready to Scale Your Brand,
          <span className="block">Leads & Revenue?</span>
        </h2>
        
        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-10">
          Join hundreds of contractors who've transformed their business with 
          data-driven marketing and automation.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={scrollToForm}
            className="bg-white text-orange-600 hover:bg-white/90 text-lg px-8 py-6 shadow-xl"
          >
            <Phone className="mr-2 h-5 w-5" />
            Book a Free Strategy Call
          </Button>
        </div>

        <p className="mt-8 text-white/70 text-sm">
          No commitment required. Get a personalized strategy session with our marketing experts.
        </p>
      </div>
    </section>
  );
}
