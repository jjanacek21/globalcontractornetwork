import { Button } from "@/components/ui/button";
import { ArrowRight, Award, Clock, Shield } from "lucide-react";
import gallery1 from "@/assets/northern-landscaping/gallery-1.jpg";

const NorthernLandscapingHero = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${gallery1})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 via-green-900/70 to-transparent" />
      </div>

      <div className="container relative z-10 py-20">
        <div className="max-w-2xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-2 text-white/90 text-sm">
            <Award className="h-4 w-4 text-green-400" />
            <span>Licensed & Insured · Certified Arborists</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            Luxury Tree &{" "}
            <span className="text-green-400">Landscaping Services</span>{" "}
            for South Florida
          </h1>

          <p className="text-xl text-white/80 max-w-xl">
            From precision tree care to stunning landscape design, we bring
            expertise and elegance to every property. Serving Miami, Palm Beach,
            Broward & Naples.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              onClick={() => scrollToSection("estimate")}
              className="bg-green-500 hover:bg-green-600 text-white gap-2 text-lg px-8"
            >
              Get Instant Estimate
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection("gallery")}
              className="border-white text-white hover:bg-white/10 text-lg px-8"
            >
              View Our Work
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20 mt-8">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Shield className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-white/90 font-semibold">$2M+ Insured</p>
              <p className="text-white/60 text-sm">Full Coverage</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Award className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-white/90 font-semibold">ISA Certified</p>
              <p className="text-white/60 text-sm">Arborists on Staff</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Clock className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-white/90 font-semibold">Same Day</p>
              <p className="text-white/60 text-sm">Emergency Service</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NorthernLandscapingHero;
