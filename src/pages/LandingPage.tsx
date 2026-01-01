import LandingHeader from "@/components/landing/LandingHeader";
import LandingHero from "@/components/landing/LandingHero";
import HomeownerServices from "@/components/landing/HomeownerServices";
import ContractorTools from "@/components/landing/ContractorTools";
import LandingTestimonials from "@/components/landing/LandingTestimonials";
import LandingFinalCTA from "@/components/landing/LandingFinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";
import { Helmet } from "react-helmet";

const LandingPage = () => {
  return (
    <>
      <Helmet>
        <title>Global Contractor Network | Instant Quotes & Verified Contractors</title>
        <meta name="description" content="Get instant quotes for roofing, windows, emergency repairs, and more. Connect with verified contractors or access powerful business tools to grow your contracting company." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <LandingHero />
        <HomeownerServices />
        <ContractorTools />
        <LandingTestimonials />
        <LandingFinalCTA />
        <LandingFooter />
      </div>
    </>
  );
};

export default LandingPage;
