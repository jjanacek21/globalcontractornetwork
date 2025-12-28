import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket, TrendingUp, Users } from "lucide-react";

export function MarketingHero() {
  const scrollToForm = () => {
    document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-8">
          <Rocket className="h-4 w-4 text-amber-400" />
          <span className="text-amber-400 text-sm font-medium">Full-Service Digital Marketing Agency</span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          Dominate Your Market with
          <span className="block bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
            Digital Marketing & CRM
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10">
          Professional marketing, web design, and CRM solutions tailored for contractors. 
          Grow your business with proven strategies that deliver real results.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button 
            size="lg" 
            onClick={scrollToForm}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg px-8 py-6 shadow-lg shadow-amber-500/25"
          >
            Get Free Consultation
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => document.getElementById('pricing-calculator')?.scrollIntoView({ behavior: 'smooth' })}
            className="border-slate-600 text-white hover:bg-slate-800 text-lg px-8 py-6"
          >
            Calculate Your Investment
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <TrendingUp className="h-8 w-8 text-amber-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white mb-1">300%</div>
            <div className="text-slate-400">Average ROI Increase</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <Users className="h-8 w-8 text-amber-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white mb-1">500+</div>
            <div className="text-slate-400">Contractors Served</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <Rocket className="h-8 w-8 text-amber-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white mb-1">10+</div>
            <div className="text-slate-400">Years Experience</div>
          </div>
        </div>
      </div>
    </section>
  );
}
