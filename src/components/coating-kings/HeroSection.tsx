import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Building2, Home } from "lucide-react";
import coatingKingsLogo from "@/assets/coating-kings-logo.png";

interface HeroSectionProps {
  onGetQuote: () => void;
  onLearnMore: () => void;
  propertyType?: string | null;
}

export const HeroSection = ({ onGetQuote, onLearnMore, propertyType }: HeroSectionProps) => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 mx-auto text-center">
        <img 
          src={coatingKingsLogo} 
          alt="Coating Kings Logo" 
          className="h-36 mx-auto mb-6 animate-fade-in"
        />
        
        {/* Property Type Badge */}
        {propertyType && (
          <Badge variant="outline" className="mb-4 text-base px-4 py-2 animate-fade-in">
            {propertyType === 'commercial' ? <Building2 className="mr-2 h-4 w-4" /> : <Home className="mr-2 h-4 w-4" />}
            {propertyType === 'commercial' ? 'Commercial Property' : 'Residential Property'}
          </Badge>
        )}
        
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-primary/10 border border-primary/20 animate-fade-in">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">South Florida's Premier Roof Coating Specialists</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-primary">
          Extend Your Roof's Life with
          <br />
          <span className="text-primary">Professional Coating Systems</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-fade-in">
          Protect your property with industry-leading coating systems. 
          Enhance energy efficiency and extend roof life by 10-20+ years.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
          <Button 
            size="lg" 
            onClick={onGetQuote}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg group"
          >
            Get Instant Roof Quote
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={onLearnMore}
            className="px-8 py-6 text-lg border-2"
          >
            Schedule Consultation
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto animate-fade-in">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">15+</div>
            <div className="text-sm text-muted-foreground">Years Experience</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">2000+</div>
            <div className="text-sm text-muted-foreground">Projects Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">100%</div>
            <div className="text-sm text-muted-foreground">Licensed & Insured</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">20+</div>
            <div className="text-sm text-muted-foreground">Year Warranties</div>
          </div>
        </div>
      </div>
    </section>
  );
};