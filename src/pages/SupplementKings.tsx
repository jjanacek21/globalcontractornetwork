import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Crown,
  FileText, 
  ClipboardCheck, 
  Calculator, 
  Handshake, 
  Scale, 
  Clock,
  CheckCircle2,
  ArrowRight,
  Shield,
  MapPin,
  TrendingUp,
  BookOpen
} from "lucide-react";
import { SupplementKingsHeader } from "@/components/supplement-kings/SupplementKingsHeader";
import { SupplementKingsFooter } from "@/components/supplement-kings/SupplementKingsFooter";
import { AboutUsModal } from "@/components/supplement-kings/AboutUsModal";
import { TestimonialsSection } from "@/components/supplement-kings/TestimonialsSection";
import { XactimateExamplesSection } from "@/components/supplement-kings/XactimateExamplesSection";
import { useNavigate } from "react-router-dom";

const SupplementKings = () => {
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const navigate = useNavigate();

  const services = [
    {
      icon: Calculator,
      title: "Residential & Commercial Take-offs",
      description: "Detailed measurements and material calculations for any size project, from single-family homes to large commercial properties."
    },
    {
      icon: ClipboardCheck,
      title: "Onsite Inspections",
      description: "Professional field inspections for attorneys and engineers. We document every detail with photos and measurements."
    },
    {
      icon: FileText,
      title: "Detailed Xactimate Reports",
      description: "Comprehensive Xactimate estimates with line-item documentation, photos, and detailed notes that adjusters can't ignore."
    },
    {
      icon: Handshake,
      title: "Supplement Negotiation",
      description: "We negotiate directly with insurance companies to maximize your settlement. Our success rate speaks for itself."
    },
    {
      icon: Scale,
      title: "Deposition Support",
      description: "Expert witness services and deposition support for litigation. We stand behind our estimates in court."
    },
    {
      icon: Clock,
      title: "24-48 Hour Turnaround",
      description: "Fast turnaround times so you can keep your projects moving. Rush services available for urgent claims."
    }
  ];

  const stats = [
    { value: "$50M+", label: "Recovered for Clients" },
    { value: "500+", label: "Claims Processed" },
    { value: "85%", label: "Supplement Approval Rate" },
    { value: "48hr", label: "Average Turnaround" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SupplementKingsHeader />

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4yIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJWNmgydjEwem0tNiAyNGgtMnYtNGgydjR6bTAtNmgtMnYtNGgydjR6bTAtNmgtMnYtNGgydjR6bTAtNmgtMlY2aDJ2MTB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10" />
        
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
              <Crown className="h-4 w-4" />
              <span>Florida's #1 Insurance Claim Supplementing Service</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
              Maximize Your{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
                Insurance Claims
              </span>
            </h1>
            
            <p className="text-xl text-emerald-100/80 max-w-2xl mx-auto">
              Stop leaving money on the table. Our expert Xactimate estimators and supplement specialists 
              ensure you get every dollar your claim deserves. 24-48 hour turnaround, all of Florida.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="gap-2 bg-white text-emerald-800 hover:bg-emerald-50 font-semibold"
                onClick={() => navigate("/supplement-kings/contractor/auth")}
              >
                Submit a Claim
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:border-white hover:bg-white/10"
                onClick={() => setAboutModalOpen(true)}
              >
                About Us
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-yellow-400">{stat.value}</div>
                  <div className="text-sm text-emerald-200/70">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Contractors Choose{" "}
                <span className="text-emerald-600">Supplement Kings</span>
              </h2>
              <p className="text-gray-600 mb-8">
                Insurance companies have teams of adjusters working to minimize payouts. You need experts 
                working just as hard to maximize yours. That's where we come in.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Certified Xactimate Level 3 estimators",
                  "Direct negotiation with insurance adjusters",
                  "Detailed documentation that holds up in court",
                  "85%+ supplement approval rate",
                  "Expert witness and deposition support"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>

              <Button 
                size="lg" 
                className="mt-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setAboutModalOpen(true)}
              >
                Learn More About Us
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white border-gray-200 shadow-sm p-6">
                <Clock className="h-8 w-8 text-emerald-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Fast Turnaround</h3>
                <p className="text-sm text-gray-500">24-48 hour estimates on all claims</p>
              </Card>
              <Card className="bg-white border-gray-200 shadow-sm p-6">
                <Shield className="h-8 w-8 text-emerald-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Court Ready</h3>
                <p className="text-sm text-gray-500">Documentation that holds up in litigation</p>
              </Card>
              <Card className="bg-white border-gray-200 shadow-sm p-6">
                <TrendingUp className="h-8 w-8 text-emerald-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Higher Settlements</h3>
                <p className="text-sm text-gray-500">Average 3x increase from original estimate</p>
              </Card>
              <Card className="bg-white border-gray-200 shadow-sm p-6">
                <MapPin className="h-8 w-8 text-emerald-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">All Florida</h3>
                <p className="text-sm text-gray-500">Serving all 67 counties statewide</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Comprehensive insurance claim support from initial estimate to final settlement
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="bg-white border-gray-200 hover:border-emerald-500/50 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                    <service.icon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-500 text-sm">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Xactimate Examples Section */}
      <XactimateExamplesSection />

      {/* Resource Library Teaser */}
      <section id="resources" className="py-20 bg-gray-50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <BookOpen className="h-16 w-16 text-emerald-600 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Resource Library
            </h2>
            <p className="text-lg text-gray-500 mb-8">
              Access guides, templates, and educational content to help you navigate the insurance claim process.
            </p>
            <Button 
              size="lg" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Coming Soon
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Maximize Your Claims?
            </h2>
            <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of Florida contractors who trust Supplement Kings to handle their insurance claim supplements. 
              Get started today with our 24-48 hour turnaround.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold"
                onClick={() => navigate("/supplement-kings/contractor/auth")}
              >
                Get Started Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:border-white hover:bg-white/10"
              >
                Schedule a Call
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SupplementKingsFooter />

      {/* About Modal */}
      <AboutUsModal open={aboutModalOpen} onOpenChange={setAboutModalOpen} />
    </div>
  );
};

export default SupplementKings;
