import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  FileSignature, 
  Upload, 
  Building2, 
  Scale, 
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Clock,
  Shield,
  Users,
  MapPin,
  Hammer,
  Zap,
  Droplets,
  Wrench,
  Sun,
  Home,
  Crown
} from "lucide-react";
import { PermitQueensHeader } from "@/components/permit-queens/PermitQueensHeader";
import { PermitQueensFooter } from "@/components/permit-queens/PermitQueensFooter";
import { BuildingDeptLookup } from "@/components/permit-pros/BuildingDeptLookup";

const PermitQueens = () => {
  const services = [
    {
      icon: FileText,
      title: "Permit Application Preparation",
      description: "We complete all required forms accurately and submit them on your behalf to the local building department."
    },
    {
      icon: FileSignature,
      title: "Virtual Notarizations",
      description: "Get your documents notarized quickly with our convenient virtual notarization service."
    },
    {
      icon: Upload,
      title: "Building Department Submission",
      description: "We handle the submission process to each building department, ensuring all documents are properly filed."
    },
    {
      icon: Building2,
      title: "Contractor Registration",
      description: "Not registered with a building department? We'll handle the registration process for you."
    },
    {
      icon: Scale,
      title: "NOC Recording",
      description: "Notice of Commencement recording and filing with the county recorder's office."
    },
    {
      icon: BookOpen,
      title: "Engineer & Architectural Reviews",
      description: "Coordination with licensed engineers and architects when project requirements demand it."
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Submit Your Project",
      description: "Enter your project address and upload your documents through our secure portal."
    },
    {
      step: "2",
      title: "We Process Everything",
      description: "Our team prepares all paperwork, handles notarizations, and submits to the building department."
    },
    {
      step: "3",
      title: "Track Progress",
      description: "Monitor your permit status in real-time through your client dashboard."
    },
    {
      step: "4",
      title: "Permit Delivered",
      description: "Once approved, we deliver your permit and all documentation directly to you."
    }
  ];

  const industries = [
    { icon: Home, name: "Roofing", description: "Re-roofs, repairs, new construction" },
    { icon: Zap, name: "Electrical", description: "Panel upgrades, rewiring, installations" },
    { icon: Droplets, name: "Plumbing", description: "Repiping, water heaters, fixtures" },
    { icon: Wrench, name: "HVAC", description: "AC replacement, ductwork, ventilation" },
    { icon: Sun, name: "Solar", description: "PV systems, battery storage" },
    { icon: Hammer, name: "General Contracting", description: "Renovations, additions, build-outs" }
  ];

  const counties = [
    { name: "Broward County", cities: "Fort Lauderdale, Hollywood, Pembroke Pines, Coral Springs, Miramar, Sunrise, Plantation, Davie, Weston, Pompano Beach" },
    { name: "Miami-Dade County", cities: "Miami, Miami Beach, Hialeah, Miami Gardens, Homestead, Coral Gables, Doral, Aventura" },
    { name: "Palm Beach County", cities: "West Palm Beach, Boca Raton, Delray Beach, Boynton Beach, Palm Beach Gardens, Jupiter" }
  ];

  const scrollToSection = (id: string) => {
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <PermitQueensHeader />

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-slate-950 to-orange-600/10" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4yIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJWNmgydjEwem0tNiAyNGgtMnYtNGgydjR6bTAtNmgtMnYtNGgydjR6bTAtNmgtMnYtNGgydjR6bTAtNmgtMlY2aDJ2MTB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-500">
              <Crown className="h-4 w-4" />
              <span>Florida's Trusted Permit Expediting Service</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
              Speed Up Your{" "}
              <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                Florida Permits
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              We handle the paperwork so you can focus on your projects. From permit applications to NOC recording, 
              Permit Queens takes the hassle out of Florida building permits.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                onClick={() => scrollToSection("#lookup")}
              >
                Look Up Your Building Department
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-slate-700 text-slate-300 hover:border-amber-500 hover:text-amber-500"
                onClick={() => scrollToSection("#services")}
              >
                View Services
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-amber-500">500+</div>
                <div className="text-sm text-slate-500">Permits Processed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-amber-500">50+</div>
                <div className="text-sm text-slate-500">Florida Cities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-amber-500">48hr</div>
                <div className="text-sm text-slate-500">Avg. Turnaround</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-slate-900/50">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Why Contractors Choose{" "}
                <span className="text-amber-500">Permit Queens</span>
              </h2>
              <p className="text-slate-400 mb-8">
                Navigating Florida's building permit process can be time-consuming and confusing. 
                Each municipality has different requirements, forms, and procedures. That's where we come in.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Save 10+ hours per permit on paperwork",
                  "Avoid costly delays from rejected applications",
                  "Access our extensive document library",
                  "Track all your permits in one dashboard",
                  "Expert knowledge of local requirements"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <Clock className="h-8 w-8 text-amber-500 mb-4" />
                <h3 className="font-semibold text-white mb-2">Fast Turnaround</h3>
                <p className="text-sm text-slate-400">Most permits submitted within 48 hours</p>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <Shield className="h-8 w-8 text-amber-500 mb-4" />
                <h3 className="font-semibold text-white mb-2">100% Accurate</h3>
                <p className="text-sm text-slate-400">No rejections due to paperwork errors</p>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <Users className="h-8 w-8 text-amber-500 mb-4" />
                <h3 className="font-semibold text-white mb-2">Expert Team</h3>
                <p className="text-sm text-slate-400">Years of Florida permitting experience</p>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <MapPin className="h-8 w-8 text-amber-500 mb-4" />
                <h3 className="font-semibold text-white mb-2">All Florida</h3>
                <p className="text-sm text-slate-400">Coverage across all FL municipalities</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Our Services
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Complete permit expediting services to keep your projects moving forward
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-colors">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                    <service.icon className="h-6 w-6 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{service.title}</h3>
                  <p className="text-slate-400 text-sm">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Building Department Lookup Section */}
      <section id="lookup" className="py-20 bg-slate-900/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Building Department Lookup
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Enter your project address to find your building department, local code requirements, and required documents
            </p>
          </div>

          <BuildingDeptLookup />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Get your permits processed in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-amber-500/20 absolute -top-4 -left-2">
                  {step.step}
                </div>
                <div className="relative pt-8">
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm">{step.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-1/2 -right-4 h-6 w-6 text-slate-700" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section id="industries" className="py-20 bg-slate-900/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Industries We Serve
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Specialized permit expediting for all construction trades
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {industries.map((industry, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-colors text-center p-6">
                <industry.icon className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-1">{industry.name}</h3>
                <p className="text-xs text-slate-500">{industry.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Locations Section */}
      <section id="locations" className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Coverage Areas
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              We serve contractors throughout South Florida and beyond
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {counties.map((county, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="h-5 w-5 text-amber-500" />
                    <h3 className="text-lg font-semibold text-white">{county.name}</h3>
                  </div>
                  <p className="text-sm text-slate-400">{county.cities}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Resource Library Teaser */}
      <section id="resources" className="py-20 bg-slate-900/50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <BookOpen className="h-16 w-16 text-amber-500 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Resource Library
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Access our comprehensive collection of permit applications, forms, and documentation 
              organized by building department and trade type.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
            >
              Coming Soon
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20">
        <div className="container">
          <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Expedite Your Permits?
            </h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Join hundreds of Florida contractors who trust Permit Queens to handle their permitting needs. 
              Get started today and save time on every project.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                onClick={() => window.location.href = "/permit-queens/auth"}
              >
                Start Your First Permit
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-slate-600 text-slate-300 hover:border-amber-500 hover:text-amber-500"
                onClick={() => window.location.href = "/permit-queens/admin/auth"}
              >
                Admin Login
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PermitQueensFooter />
    </div>
  );
};

export default PermitQueens;