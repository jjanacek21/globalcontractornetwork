import { Helmet } from "react-helmet";
import NorthernLandscapingHeader from "@/components/northern-landscaping/NorthernLandscapingHeader";
import NorthernLandscapingHero from "@/components/northern-landscaping/NorthernLandscapingHero";
import ServicesSection from "@/components/northern-landscaping/ServicesSection";
import TreeEstimateQuiz from "@/components/northern-landscaping/TreeEstimateQuiz";
import ProjectGallery from "@/components/northern-landscaping/ProjectGallery";
import WhyChooseNorthern from "@/components/northern-landscaping/WhyChooseNorthern";
import NorthernTestimonials from "@/components/northern-landscaping/NorthernTestimonials";
import LeadCaptureForm from "@/components/northern-landscaping/LeadCaptureForm";
import NorthernLandscapingFooter from "@/components/northern-landscaping/NorthernLandscapingFooter";

const NorthernLandscaping = () => {
  return (
    <>
      <Helmet>
        <title>Northern Landscaping INC | Luxury Tree & Landscaping Services | South Florida</title>
        <meta
          name="description"
          content="Premium tree and landscaping services for South Florida. Tree trimming, removal, stump grinding, irrigation, hardscaping & more. Licensed, insured, ISA certified. Get instant estimates!"
        />
        <meta
          name="keywords"
          content="tree service, landscaping, tree trimming, tree removal, stump grinding, irrigation, South Florida, Miami, Palm Beach, Naples, Broward"
        />
      </Helmet>

      <div className="min-h-screen bg-white">
        <NorthernLandscapingHeader />
        <NorthernLandscapingHero />
        <ServicesSection />
        <TreeEstimateQuiz />
        <ProjectGallery />
        <WhyChooseNorthern />
        <NorthernTestimonials />
        <LeadCaptureForm />
        <NorthernLandscapingFooter />
      </div>
    </>
  );
};

export default NorthernLandscaping;
