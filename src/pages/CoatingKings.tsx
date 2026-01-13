import { useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CoatingKingsHeader } from "@/components/coating-kings/CoatingKingsHeader";
import { HeroSection } from "@/components/coating-kings/HeroSection";
import { InstantQuoteTool } from "@/components/coating-kings/InstantQuoteTool";
import { CoatingProductGuide } from "@/components/coating-kings/CoatingProductGuide";
import { WhyChooseUs } from "@/components/coating-kings/WhyChooseUs";
import { BeforeAfterSlider } from "@/components/coating-kings/BeforeAfterSlider";
import { LeadCaptureForm } from "@/components/coating-kings/LeadCaptureForm";
import { FAQSection } from "@/components/coating-kings/FAQSection";
import { CoatingKingsFooter } from "@/components/coating-kings/CoatingKingsFooter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const CoatingKings = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const propertyType = searchParams.get('propertyType');
  
  const quoteToolRef = useRef<HTMLElement>(null);
  const productsRef = useRef<HTMLElement>(null);
  const [selectedCoating, setSelectedCoating] = useState<string>("");

  const scrollToQuote = () => {
    const element = document.getElementById("quote-tool");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToProducts = () => {
    const element = document.getElementById("products");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToContact = () => {
    const element = document.getElementById("contact");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCoatingSelect = (coatingKey: string) => {
    setSelectedCoating(coatingKey);
    scrollToQuote();
  };

  return (
    <>
      <Helmet>
        <title>Coating Kings | South Florida's Premier Roof Coating Specialists</title>
        <meta
          name="description"
          content="Professional roof coating services in Miami, Fort Lauderdale, and Palm Beach. Extend your roof's life 10-20+ years with industry-leading coating systems. Get instant quote."
        />
        <meta
          name="keywords"
          content="roof coating, South Florida, Miami roofing, silicone coating, acrylic coating, commercial roofing, flat roof coating, metal roof coating"
        />
        <link rel="canonical" href="https://coatingkingz.ai" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Back Navigation */}
        <div className="container pt-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/roofing-services')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Roofing Services
          </Button>
        </div>
        
        <CoatingKingsHeader />
        <HeroSection onGetQuote={scrollToQuote} onLearnMore={scrollToContact} propertyType={propertyType} />
        <CoatingProductGuide onCoatingSelect={handleCoatingSelect} />
        <InstantQuoteTool selectedCoatingType={selectedCoating} />
        <WhyChooseUs />
        <BeforeAfterSlider />
        <LeadCaptureForm />
        <FAQSection />
        <CoatingKingsFooter />
      </div>
    </>
  );
};

export default CoatingKings;