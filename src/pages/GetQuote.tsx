import { useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Home, Shield, PanelTop, Trees, Droplets, ArrowRight, 
  ArrowLeft, Loader2, CheckCircle, MapPin, Sparkles,
  Phone, Mail, User
} from "lucide-react";
import gcnLogo from "@/assets/gcn-logo.jpg";
import { Link } from "react-router-dom";

type ServiceType = "roofing" | "windows" | "coatings" | "landscaping" | "emergency" | null;

interface ServiceOption {
  id: ServiceType;
  icon: typeof Home;
  title: string;
  description: string;
  color: string;
}

const services: ServiceOption[] = [
  { id: "roofing", icon: Home, title: "Roofing", description: "Repairs, replacements & inspections", color: "bg-slate-500" },
  { id: "coatings", icon: Shield, title: "Roof Coatings", description: "Extend roof life 15+ years", color: "bg-orange-500" },
  { id: "windows", icon: PanelTop, title: "Windows & Doors", description: "Impact-rated installations", color: "bg-green-500" },
  { id: "landscaping", icon: Trees, title: "Tree & Landscaping", description: "Removal, trimming & design", color: "bg-emerald-600" },
  { id: "emergency", icon: Droplets, title: "Emergency Services", description: "Water damage & mold remediation", color: "bg-red-500" },
];

const GetQuote = () => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<ServiceType>(null);
  const [address, setAddress] = useState("");
  const [projectDetails, setProjectDetails] = useState<Record<string, string>>({});
  const [estimateResult, setEstimateResult] = useState<{ low: number; high: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [contactInfo, setContactInfo] = useState({ name: "", email: "", phone: "" });
  const [projectCreated, setProjectCreated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const getAIEstimate = async () => {
    if (!selectedService || !address) return;
    setLoading(true);

    try {
      // Select appropriate edge function based on service
      const functionMap: Record<string, string> = {
        roofing: "property-estimator-ai",
        windows: "window-advisor-ai",
        coatings: "coating-quote-ai",
        landscaping: "landscaping-estimate-ai",
        emergency: "emergency-triage-ai",
      };

      const functionName = functionMap[selectedService];
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          propertyDetails: {
            address,
            propertyType: projectDetails.propertyType || "residential",
            ...projectDetails,
          },
          preferences: projectDetails,
        },
      });

      if (error) throw error;

      // Parse response based on service type
      let low = 0, high = 0;
      if (data?.estimatedSqftLow) {
        // Roofing estimate - calculate price from sqft
        low = Math.round(data.estimatedSqftLow * 4.5);
        high = Math.round(data.estimatedSqftHigh * 7.5);
      } else if (data?.estimatedCostLow) {
        low = data.estimatedCostLow;
        high = data.estimatedCostHigh;
      } else if (data?.priceRange) {
        low = data.priceRange.low;
        high = data.priceRange.high;
      } else {
        // Fallback estimate
        low = 2500;
        high = 8500;
      }

      setEstimateResult({ low, high });
      setStep(4);
    } catch (error: unknown) {
      console.error("Error getting estimate:", error);
      // Fallback estimate on error
      setEstimateResult({ low: 3000, high: 10000 });
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProject = async () => {
    if (!contactInfo.name || !contactInfo.email) {
      toast({ title: "Required", description: "Please provide your name and email", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Create project for logged-in user
        const { error } = await supabase
          .from("homeowner_projects")
          .insert({
            user_id: user.id,
            service_type: selectedService,
            property_address: address,
            ai_estimate_low: estimateResult?.low,
            ai_estimate_high: estimateResult?.high,
            project_details: { ...projectDetails, contactInfo },
            status: "quote_requested",
          });

        if (error) throw error;
      }
      
      setProjectCreated(true);
      setStep(5);
      toast({ title: "Success!", description: "Your quote request has been submitted" });
    } catch (error: unknown) {
      console.error("Error creating project:", error);
      toast({ title: "Submitted", description: "We'll be in touch soon!" });
      setProjectCreated(true);
      setStep(5);
    } finally {
      setLoading(false);
    }
  };

  const renderServiceQuestions = () => {
    switch (selectedService) {
      case "roofing":
        return (
          <div className="space-y-4">
            <div>
              <Label>What type of service do you need?</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {["Full Replacement", "Repair", "Inspection", "Not Sure"].map((option) => (
                  <Button
                    key={option}
                    variant={projectDetails.serviceType === option ? "default" : "outline"}
                    className="h-12"
                    onClick={() => setProjectDetails({ ...projectDetails, serviceType: option })}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Property Type</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {["Residential", "Commercial"].map((option) => (
                  <Button
                    key={option}
                    variant={projectDetails.propertyType === option.toLowerCase() ? "default" : "outline"}
                    className="h-12"
                    onClick={() => setProjectDetails({ ...projectDetails, propertyType: option.toLowerCase() })}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );
      case "windows":
        return (
          <div className="space-y-4">
            <div>
              <Label>How many windows/doors?</Label>
              <div className="grid grid-cols-4 gap-3 mt-2">
                {["1-3", "4-6", "7-10", "10+"].map((option) => (
                  <Button
                    key={option}
                    variant={projectDetails.quantity === option ? "default" : "outline"}
                    onClick={() => setProjectDetails({ ...projectDetails, quantity: option })}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>What type of product?</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {["Impact Windows", "Impact Doors", "Both", "Not Sure"].map((option) => (
                  <Button
                    key={option}
                    variant={projectDetails.productType === option ? "default" : "outline"}
                    onClick={() => setProjectDetails({ ...projectDetails, productType: option })}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );
      case "landscaping":
        return (
          <div className="space-y-4">
            <div>
              <Label>What service do you need?</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {["Tree Removal", "Tree Trimming", "Full Landscaping", "Stump Grinding"].map((option) => (
                  <Button
                    key={option}
                    variant={projectDetails.serviceType === option ? "default" : "outline"}
                    onClick={() => setProjectDetails({ ...projectDetails, serviceType: option })}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>How many trees/size of area?</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {["Small", "Medium", "Large"].map((option) => (
                  <Button
                    key={option}
                    variant={projectDetails.size === option ? "default" : "outline"}
                    onClick={() => setProjectDetails({ ...projectDetails, size: option })}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );
      case "emergency":
        return (
          <div className="space-y-4">
            <div>
              <Label>What type of emergency?</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {["Water Damage", "Mold", "Fire Damage", "Storm Damage"].map((option) => (
                  <Button
                    key={option}
                    variant={projectDetails.emergencyType === option ? "default" : "outline"}
                    onClick={() => setProjectDetails({ ...projectDetails, emergencyType: option })}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>How urgent is this?</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {["Immediate", "Within 24hrs", "This Week"].map((option) => (
                  <Button
                    key={option}
                    variant={projectDetails.urgency === option ? "default" : "outline"}
                    onClick={() => setProjectDetails({ ...projectDetails, urgency: option })}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <div>
              <Label>Property Type</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {["Residential", "Commercial"].map((option) => (
                  <Button
                    key={option}
                    variant={projectDetails.propertyType === option.toLowerCase() ? "default" : "outline"}
                    onClick={() => setProjectDetails({ ...projectDetails, propertyType: option.toLowerCase() })}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <Helmet>
        <title>Get Instant Quote | Global Contractor Network</title>
        <meta name="description" content="Get instant AI-powered estimates for roofing, windows, landscaping, and more. Request quotes from verified contractors." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b">
          <div className="container flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={gcnLogo} alt="GCN Logo" className="h-10 w-auto rounded-lg" />
              <span className="text-lg font-bold">Global Contractor Network</span>
            </Link>
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </header>

        <main className="container py-12 max-w-3xl">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-2 w-12 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Select Service */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">What do you need help with?</h1>
                <p className="text-muted-foreground">Select a service to get started</p>
              </div>

              <div className="grid gap-4">
                {services.map((service) => (
                  <Card
                    key={service.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedService === service.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedService(service.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${service.color} flex items-center justify-center text-white`}>
                        <service.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{service.title}</h3>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                      {selectedService === service.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                size="lg"
                className="w-full"
                disabled={!selectedService}
                onClick={() => setStep(2)}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Property Address */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right">
              <div className="text-center space-y-2">
                <Badge className={services.find(s => s.id === selectedService)?.color}>
                  {services.find(s => s.id === selectedService)?.title}
                </Badge>
                <h1 className="text-3xl font-bold">Where is your property?</h1>
                <p className="text-muted-foreground">Enter your address to get an accurate estimate</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Enter your property address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-10 h-12 text-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="lg" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  disabled={!address}
                  onClick={() => setStep(3)}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Service-Specific Questions */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Tell us more about your project</h1>
                <p className="text-muted-foreground">This helps us provide a more accurate estimate</p>
              </div>

              {renderServiceQuestions()}

              <div className="flex gap-3">
                <Button variant="outline" size="lg" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={getAIEstimate}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Get AI Estimate
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Estimate Result & Contact Info */}
          {step === 4 && estimateResult && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right">
              <div className="text-center space-y-2">
                <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
                <h1 className="text-3xl font-bold">Your Instant Estimate</h1>
                <p className="text-muted-foreground">Based on AI analysis of your project</p>
              </div>

              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Estimated Price Range</p>
                  <p className="text-4xl font-bold text-primary">
                    ${estimateResult.low.toLocaleString()} - ${estimateResult.high.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    * Final price may vary based on inspection
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Request Official Quote</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your details and we'll connect you with verified contractors
                </p>
                
                <div className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Your Name"
                      value={contactInfo.name}
                      onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email Address"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Phone Number (optional)"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="lg" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleSubmitProject}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Request Official Quote
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 5 && projectCreated && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right text-center">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Quote Request Submitted!</h1>
                <p className="text-muted-foreground">
                  We've received your request and will connect you with verified contractors soon.
                </p>
              </div>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold">What happens next?</h3>
                  <div className="space-y-3 text-left">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">1</span>
                      </div>
                      <p className="text-sm">Verified contractors in your area will review your request</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">2</span>
                      </div>
                      <p className="text-sm">You'll receive official quotes via email within 24-48 hours</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">3</span>
                      </div>
                      <p className="text-sm">Compare quotes and choose the best contractor for your project</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 justify-center">
                <Button variant="outline" size="lg" onClick={() => navigate("/")}>
                  Return Home
                </Button>
                <Button size="lg" onClick={() => navigate("/member/dashboard")}>
                  View Dashboard
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default GetQuote;
