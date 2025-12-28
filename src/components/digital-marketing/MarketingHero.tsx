import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket, TrendingUp, Users, BarChart3, Mail, Globe, LayoutDashboard } from "lucide-react";

export function MarketingHero() {
  const scrollToForm = () => {
    document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Dashboard Button - Fixed position */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Link to="/member/dashboard">
            <LayoutDashboard className="h-4 w-4 mr-1" />
            Dashboard
          </Link>
        </Button>
      </div>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
        {/* Moving gradient orbs */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '8s', animationDelay: '2s' }} />
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Floating UI Elements */}
      <div className="absolute top-32 left-8 hidden lg:block animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Monthly Leads</p>
              <p className="text-lg font-bold text-white">+247%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-48 right-12 hidden lg:block animate-fade-in" style={{ animationDelay: '0.8s' }}>
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Mail className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Email Open Rate</p>
              <p className="text-lg font-bold text-white">42.8%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-40 left-16 hidden lg:block animate-fade-in" style={{ animationDelay: '1.1s' }}>
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Globe className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Website Traffic</p>
              <p className="text-lg font-bold text-white">+180%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-8 animate-fade-in">
          <Rocket className="h-4 w-4 text-amber-400" />
          <span className="text-amber-400 text-sm font-medium">GCN Marketing Suite – Full-Service Digital Agency</span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Fuel Your Business Growth with
          <span className="block bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
            Modern Marketing & Automation
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          Full-service social media, paid advertising, SEO, website development, CRM automation, 
          and brand management—built for contractors, roofers, and blue-collar businesses.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <Button 
            size="lg" 
            onClick={scrollToForm}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg px-8 py-6 shadow-lg shadow-amber-500/25"
          >
            Book a Free Strategy Call
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })}
            className="border-slate-600 text-white hover:bg-slate-800 text-lg px-8 py-6"
          >
            Explore Packages
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-amber-500/30 transition-colors">
            <TrendingUp className="h-8 w-8 text-amber-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white mb-1">300%</div>
            <div className="text-slate-400">Average ROI Increase</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-amber-500/30 transition-colors">
            <Users className="h-8 w-8 text-amber-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white mb-1">500+</div>
            <div className="text-slate-400">Contractors Served</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-amber-500/30 transition-colors">
            <Rocket className="h-8 w-8 text-amber-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white mb-1">10+</div>
            <div className="text-slate-400">Years Experience</div>
          </div>
        </div>
      </div>
    </section>
  );
}
