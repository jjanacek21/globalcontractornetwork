import LandingHeader from "@/components/landing/LandingHeader";
import LandingHero from "@/components/landing/LandingHero";
import LandingTestimonials from "@/components/landing/LandingTestimonials";
import LandingFeatureCards from "@/components/landing/LandingFeatureCards";
import LandingToolPills from "@/components/landing/LandingToolPills";
import LandingPricing from "@/components/landing/LandingPricing";
import LandingFinalCTA from "@/components/landing/LandingFinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <LandingHero />
      <LandingTestimonials />
      <LandingFeatureCards />
      <LandingToolPills />
      <LandingPricing />
      <LandingFinalCTA />
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
