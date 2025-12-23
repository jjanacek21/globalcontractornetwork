import { Helmet } from "react-helmet";
import { EmergencyMitigationHeader } from "@/components/emergency-mitigation/EmergencyMitigationHeader";
import { EmergencyHeroSection } from "@/components/emergency-mitigation/EmergencyHeroSection";
import { TrustBadges } from "@/components/emergency-mitigation/TrustBadges";
import { ServicesGrid } from "@/components/emergency-mitigation/ServicesGrid";
import { EstimateQuizTool } from "@/components/emergency-mitigation/EstimateQuizTool";
import { RemediationProcess } from "@/components/emergency-mitigation/RemediationProcess";
import { EmergencyFAQSection } from "@/components/emergency-mitigation/EmergencyFAQSection";
import { EmergencyTestimonials } from "@/components/emergency-mitigation/EmergencyTestimonials";
import { WhyChooseUsEmergency } from "@/components/emergency-mitigation/WhyChooseUsEmergency";
import { EmergencyLeadForm } from "@/components/emergency-mitigation/EmergencyLeadForm";
import { EmergencyMitigationFooter } from "@/components/emergency-mitigation/EmergencyMitigationFooter";

const EmergencyMitigation = () => {
  return (
    <>
      <Helmet>
        <title>Emergency Mitigation & Mold Remediation | 24/7 South Florida</title>
        <meta name="description" content="24/7 emergency mold remediation, water damage restoration, storm cleanup & roof tarping in South Florida. IICRC certified. 1-hour response. Call (214) 998-2879" />
      </Helmet>
      
      <div className="min-h-screen">
        <EmergencyMitigationHeader />
        <EmergencyHeroSection />
        <TrustBadges />
        <ServicesGrid />
        <EstimateQuizTool />
        <RemediationProcess />
        <WhyChooseUsEmergency />
        <EmergencyTestimonials />
        <EmergencyFAQSection />
        <EmergencyLeadForm />
        <EmergencyMitigationFooter />
      </div>
    </>
  );
};

export default EmergencyMitigation;
