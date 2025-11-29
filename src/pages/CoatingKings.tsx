import { useRef } from "react";
import { Helmet } from "react-helmet";
import { HeroSection } from "@/components/coating-kings/HeroSection";
import { InstantQuoteTool } from "@/components/coating-kings/InstantQuoteTool";
import { CoatingProductGuide } from "@/components/coating-kings/CoatingProductGuide";
import { WhyChooseUs } from "@/components/coating-kings/WhyChooseUs";
import { ContractorResources } from "@/components/coating-kings/ContractorResources";
import { BeforeAfterSlider } from "@/components/coating-kings/BeforeAfterSlider";
import { LeadCaptureForm } from "@/components/coating-kings/LeadCaptureForm";
import { FAQSection } from "@/components/coating-kings/FAQSection";
import { CoatingKingsFooter } from "@/components/coating-kings/CoatingKingsFooter";

const CoatingKings = () => {
  const quoteToolRef = useRef<HTMLElement>(null);
  const productsRef = useRef<HTMLElement>(null);

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
        <link rel="canonical" href="https://yourdomain.com/coating-kings" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <HeroSection onGetQuote={scrollToQuote} onLearnMore={scrollToContact} />
        <InstantQuoteTool />
        <CoatingProductGuide />
        <WhyChooseUs />
        <ContractorResources />
        <BeforeAfterSlider />
        <LeadCaptureForm />
        <FAQSection />
        <CoatingKingsFooter />
      </div>
    </>
  );
};

export default CoatingKings;