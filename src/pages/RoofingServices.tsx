import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building2, Home, ArrowLeft, ArrowRight, 
  Paintbrush, Wrench, HardHat, CheckCircle2 
} from "lucide-react";
import gcnLogo from "@/assets/gcn-logo.jpg";

type PropertyType = "commercial" | "residential" | null;
type ServiceType = "coating" | "repair" | "reroof" | null;

const RoofingServices = () => {
  const [step, setStep] = useState(1);
  const [propertyType, setPropertyType] = useState<PropertyType>(null);
  const [serviceType, setServiceType] = useState<ServiceType>(null);
  const navigate = useNavigate();

  const handlePropertySelect = (type: PropertyType) => {
    setPropertyType(type);
    setStep(2);
  };

  const handleServiceSelect = (type: ServiceType) => {
    setServiceType(type);
    
    // Navigate based on selection
    if (type === "coating") {
      navigate(`/coating-kings?propertyType=${propertyType}`);
    } else if (type === "repair") {
      navigate(`/roofing?type=repair&propertyType=${propertyType}`);
    } else if (type === "reroof") {
      navigate(`/roofing?type=reroof&propertyType=${propertyType}`);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setPropertyType(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link to="/member/dashboard">
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
            </Button>
            <Link to="/" className="flex items-center gap-3">
              <img src={gcnLogo} alt="GCN Logo" className="h-10 w-auto" />
              <div className="flex flex-col">
                <span className="text-lg font-bold">Global Contractor Network</span>
                <span className="text-xs text-muted-foreground">Roofing Services</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-16">
        <div className="max-w-4xl mx-auto">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : '1'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Property Type</span>
            </div>
            <div className="w-12 h-0.5 bg-muted">
              <div className={`h-full bg-primary transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
            </div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                2
              </div>
              <span className="text-sm font-medium hidden sm:inline">Service Type</span>
            </div>
          </div>

          {/* Step 1: Property Type Selection */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="text-center space-y-3">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  What type of property is this for?
                </h1>
                <p className="text-lg text-muted-foreground">
                  Select your property type to see relevant roofing options
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <Card 
                  className="cursor-pointer hover:border-primary hover:shadow-lg transition-all group"
                  onClick={() => handlePropertySelect("commercial")}
                >
                  <CardContent className="pt-8 pb-8 text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Building2 className="h-10 w-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">Commercial</h3>
                      <p className="text-sm text-muted-foreground">
                        Warehouses, offices, retail spaces, and industrial buildings
                      </p>
                    </div>
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Select Commercial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:border-primary hover:shadow-lg transition-all group"
                  onClick={() => handlePropertySelect("residential")}
                >
                  <CardContent className="pt-8 pb-8 text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Home className="h-10 w-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">Residential</h3>
                      <p className="text-sm text-muted-foreground">
                        Single-family homes, townhouses, and multi-family properties
                      </p>
                    </div>
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Select Residential
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 2: Service Type Selection */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="text-center space-y-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBack}
                  className="mb-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to property type
                </Button>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  What type of roofing service do you need?
                </h1>
                <p className="text-lg text-muted-foreground">
                  For your <span className="font-semibold text-primary capitalize">{propertyType}</span> property
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <Card 
                  className="cursor-pointer hover:border-primary hover:shadow-lg transition-all group"
                  onClick={() => handleServiceSelect("coating")}
                >
                  <CardContent className="pt-8 pb-8 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                      <Paintbrush className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Roof Coating</h3>
                      <p className="text-sm text-muted-foreground">
                        Extend roof life with silicone or acrylic coatings
                      </p>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 text-left">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        10-20 year extension
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        Energy efficient
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        Cost-effective solution
                      </li>
                    </ul>
                    <Button variant="outline" className="w-full group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-colors">
                      Get Coating Quote
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:border-primary hover:shadow-lg transition-all group"
                  onClick={() => handleServiceSelect("repair")}
                >
                  <CardContent className="pt-8 pb-8 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <Wrench className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Roof Repair</h3>
                      <p className="text-sm text-muted-foreground">
                        Fix leaks, damage, and wear issues
                      </p>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 text-left">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        Leak detection & repair
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        Storm damage fixes
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        Flashing & sealant work
                      </li>
                    </ul>
                    <Button variant="outline" className="w-full group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition-colors">
                      Get Repair Quote
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:border-primary hover:shadow-lg transition-all group"
                  onClick={() => handleServiceSelect("reroof")}
                >
                  <CardContent className="pt-8 pb-8 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-xl bg-slate-500/10 flex items-center justify-center group-hover:bg-slate-500/20 transition-colors">
                      <HardHat className="h-8 w-8 text-slate-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Complete Re-Roof</h3>
                      <p className="text-sm text-muted-foreground">
                        Full roof replacement with new materials
                      </p>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 text-left">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        Brand new roof system
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        Multiple material options
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        Long-term warranties
                      </li>
                    </ul>
                    <Button variant="outline" className="w-full group-hover:bg-slate-600 group-hover:text-white group-hover:border-slate-600 transition-colors">
                      Explore Packages
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Global Contractor Network. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RoofingServices;
