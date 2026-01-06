import { AcademyHeader } from "@/components/academy/AcademyHeader";
import { AcademyHero } from "@/components/academy/AcademyHero";
import { ResourceCategoryGrid } from "@/components/academy/ResourceCategoryGrid";
import { ResourceSearch } from "@/components/academy/ResourceSearch";
import { FeaturedResources } from "@/components/academy/FeaturedResources";
import { MembershipSection } from "@/components/academy/MembershipSection";
import { UpcomingEvents } from "@/components/academy/UpcomingEvents";
import { CoachingSection } from "@/components/academy/CoachingSection";
import { AcademyFooter } from "@/components/academy/AcademyFooter";
import { Helmet } from "react-helmet";

const TrainingAcademy = () => {
  return (
    <>
      <Helmet>
        <title>GCN Training Academy | Contractor Resources & Education</title>
        <meta 
          name="description" 
          content="Free contractor resources, licensing guides, insurance info, building codes, and premium training. Join the GCN Academy for $29.99/month." 
        />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <AcademyHeader />
        <main>
          <AcademyHero />
          <ResourceCategoryGrid />
          <ResourceSearch />
          <FeaturedResources />
          <MembershipSection />
          <UpcomingEvents />
          <CoachingSection />
        </main>
        <AcademyFooter />
      </div>
    </>
  );
};

export default TrainingAcademy;
