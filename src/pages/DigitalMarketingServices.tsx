import { Helmet } from "react-helmet";
import { MarketingHero } from "@/components/digital-marketing/MarketingHero";
import { SingleServicesGrid } from "@/components/digital-marketing/SingleServicesGrid";
import { MarketingPackages } from "@/components/digital-marketing/MarketingPackages";
import { SocialMediaPackages } from "@/components/digital-marketing/SocialMediaPackages";
import { PricingCalculator } from "@/components/digital-marketing/PricingCalculator";
import { PackageComparisonTable } from "@/components/digital-marketing/PackageComparisonTable";
import { MarketingFAQ } from "@/components/digital-marketing/MarketingFAQ";
import { MarketingLeadForm } from "@/components/digital-marketing/MarketingLeadForm";
import { MarketingFooter } from "@/components/digital-marketing/MarketingFooter";
import { WhyChooseUs } from "@/components/digital-marketing/WhyChooseUs";
import { ServiceShowcase } from "@/components/digital-marketing/ServiceShowcase";
import { FinalCTA } from "@/components/digital-marketing/FinalCTA";

export default function DigitalMarketingServices() {
  return (
    <>
      <Helmet>
        <title>GCN Marketing Suite – Social Media • Digital Marketing • Web Design • CRM | Global Contractor Network</title>
        <meta 
          name="description" 
          content="Full-service social media, paid advertising, SEO, website development, CRM automation, and brand management—built for contractors, roofers, and blue-collar businesses." 
        />
        <meta name="keywords" content="contractor marketing, digital marketing, CRM, Google Ads, social media marketing, web design, SEO, blue collar marketing" />
        <link rel="canonical" href="/digital-marketing" />
      </Helmet>

      <div className="min-h-screen bg-white">
        <MarketingHero />
        <SingleServicesGrid />
        <div id="packages">
          <MarketingPackages />
        </div>
        <PackageComparisonTable />
        <SocialMediaPackages />
        <ServiceShowcase />
        <WhyChooseUs />
        <div id="pricing-calculator">
          <PricingCalculator />
        </div>
        <MarketingFAQ />
        <FinalCTA />
        <MarketingLeadForm />
        <MarketingFooter />
      </div>
    </>
  );
}
