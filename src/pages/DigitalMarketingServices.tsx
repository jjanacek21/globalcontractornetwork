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

export default function DigitalMarketingServices() {
  return (
    <>
      <Helmet>
        <title>Digital Marketing & CRM Services for Contractors | GCN Marketing Pro</title>
        <meta 
          name="description" 
          content="Full-service digital marketing, web design, and CRM solutions for contractors. Google Ads, social media, SEO, and more. Get a free consultation today!" 
        />
        <meta name="keywords" content="contractor marketing, digital marketing, CRM, Google Ads, social media marketing, web design, SEO" />
        <link rel="canonical" href="/digital-marketing" />
      </Helmet>

      <div className="min-h-screen bg-white">
        <MarketingHero />
        <SingleServicesGrid />
        <MarketingPackages />
        <PackageComparisonTable />
        <SocialMediaPackages />
        <PricingCalculator />
        <MarketingFAQ />
        <MarketingLeadForm />
        <MarketingFooter />
      </div>
    </>
  );
}
