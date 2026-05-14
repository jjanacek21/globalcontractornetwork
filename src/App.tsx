import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { lazy, Suspense } from "react";
import { isCoatingKingsDomain } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AnimatePresence } from "framer-motion";

// Social Coming Soon Page
const SocialComingSoon = lazy(() => import("./pages/social/SocialComingSoon"));
const ReferralsDashboard = lazy(() => import("./pages/ReferralsDashboard"));
const BroadcastConsent = lazy(() => import("./pages/BroadcastConsent"));

// CRM (GCN internal) was removed — contractors use external Pitch CRM via the dashboard tile.
const SharedMeasurementReport = lazy(() => import("./pages/SharedMeasurementReport"));

import Home from "./pages/Home";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
// Legacy CRM page imports removed.
import GamificationDashboard from "./pages/GamificationDashboard";
import ContractorRewards from "./pages/ContractorRewards";
import NotFound from "./pages/NotFound";
import JobBoard from "./pages/JobBoard";
import DoorToDoor from "./pages/DoorToDoor";
import ContractorDirectory from "./pages/ContractorDirectory";
const CompanyProfile = lazy(() => import("./pages/CompanyProfile"));
const ContractorPublicProfile = lazy(() => import("./pages/ContractorPublicProfile"));
const IndividualRegistration = lazy(() => import("./pages/IndividualRegistration"));
const ContractorLanding = lazy(() => import("./pages/ContractorLanding"));
import PrepYourProperty from "./pages/PrepYourProperty";
import Roofing from "./pages/Roofing";
import RoofingServices from "./pages/RoofingServices";
import MerchandiseStore from "./pages/MerchandiseStore";
import StoreAuth from "./pages/StoreAuth";
import StoreDashboard from "./pages/StoreDashboard";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import MarketingConsulting from "./pages/MarketingConsulting";
import DigitalMarketingServices from "./pages/DigitalMarketingServices";
import Franchise from "./pages/Franchise";
import LearningAuth from "./pages/LearningAuth";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ContractorAuth from "./pages/ContractorAuth";
import ContractorDashboard from "./pages/ContractorDashboard";
import ContractorReferralsPage from "./pages/ContractorReferralsPage";
import CoatingKings from "./pages/CoatingKings";
import CoatingKingsAdminAuth from "./pages/CoatingKingsAdminAuth";
import CoatingKingsAdminDashboard from "./pages/CoatingKingsAdminDashboard";
import PermitQueens from "./pages/PermitQueens";
import PermitQueensAuth from "./pages/PermitQueensAuth";
import PermitQueensDashboard from "./pages/PermitQueensDashboard";
import PermitQueensNewRequest from "./pages/PermitQueensNewRequest";
import PermitPacketAssembly from "./pages/PermitPacketAssembly";
import PermitQueensRequestDetail from "./pages/PermitQueensRequestDetail";
import PermitQueensAdminBuildingDepts from "./pages/PermitQueensAdminBuildingDepts";
import PermitQueensAIIntelligence from "./pages/PermitQueensAIIntelligence";
import PermitQueensAdminAuth from "./pages/PermitQueensAdminAuth";
import PermitQueensAdminDashboard from "./pages/PermitQueensAdminDashboard";
import PermitQueensAdminTemplates from "./pages/PermitQueensAdminTemplates";
import RoofingAdminAuth from "./pages/RoofingAdminAuth";
import RoofingAdminDashboard from "./pages/RoofingAdminDashboard";
import SuperAdminAuth from "./pages/SuperAdminAuth";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import EmergencyMitigation from "./pages/EmergencyMitigation";
const ContractorEstimating = lazy(() => import("./pages/ContractorEstimating"));
import NorthernLandscaping from "./pages/NorthernLandscaping";
import JoinNetwork from "./pages/JoinNetwork";
import MemberDashboard from "./pages/MemberDashboard";
import CompanyRegistration from "./pages/CompanyRegistration";
import CompanyAdminDashboard from "./pages/CompanyAdminDashboard";
import TrainingAcademy from "./pages/TrainingAcademy";
import AcademyResources from "./pages/AcademyResources";
import ResourceDetail from "./pages/ResourceDetail";
import MyProfile from "./pages/MyProfile";
import NetworkLogin from "./pages/NetworkLogin";
import Login from "./pages/Login";
import HomeownerDashboard from "./pages/HomeownerDashboard";
import HomeownerProfile from "./pages/HomeownerProfile";
import HomeownerMessages from "./pages/HomeownerMessages";
import QuoteDetail from "./pages/QuoteDetail";

import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { HomeownerOnlyRoute } from "./components/auth/HomeownerOnlyRoute";
import { ScrollToTop } from "./components/ScrollToTop";
import { GlobalAIChat } from "./components/ai/GlobalAIChat";
const DesignSystem = lazy(() => import("./pages/DesignSystem"));
const AdminFirecrawl = lazy(() => import("./pages/AdminFirecrawl"));
const PropertyIQ = lazy(() => import("./pages/PropertyIQ"));
const PropertyIQAuth = lazy(() => import("./pages/PropertyIQAuth"));
const PropertyIQDashboard = lazy(() => import("./pages/PropertyIQDashboard"));
const PropertyIQSearch = lazy(() => import("./pages/PropertyIQSearch"));
const PropertyIQReport = lazy(() => import("./pages/PropertyIQReport"));
const InstantQuote = lazy(() => import("./pages/InstantQuote"));
const TradeWizard = lazy(() => import("./components/instant-quote/TradeWizard"));
const MaintenanceMembership = lazy(() => import("./pages/MaintenanceMembership"));
const HomeownerMarketplace = lazy(() => import("./pages/HomeownerMarketplace"));
const ScheduleConsultation = lazy(() => import("./pages/ScheduleConsultation"));

// Demo-aware wrapper: if ?demo=1 OR sessionStorage flag set, bypass auth
const PropertyIQDashboardRoute = () => {
  const [search] = useSearchParams();
  const isDemo = search.get("demo") === "1" || (typeof window !== "undefined" && sessionStorage.getItem("piq_demo") === "1");
  if (isDemo) {
    return <Suspense fallback={<div />}><PropertyIQDashboard /></Suspense>;
  }
  return (
    <ProtectedRoute redirectTo="/property-iq/auth">
      <Suspense fallback={<div />}><PropertyIQDashboard /></Suspense>
    </ProtectedRoute>
  );
};

const queryClient = new QueryClient();

// Coating Kings Domain Routes - Standalone site
const CoatingKingsRoutes = () => (
  <Routes>
    <Route path="/" element={<CoatingKings />} />
    <Route path="/admin/auth" element={<CoatingKingsAdminAuth />} />
    <Route path="/admin/dashboard" element={
      <ProtectedRoute redirectTo="/admin/auth">
        <CoatingKingsAdminDashboard />
      </ProtectedRoute>
    } />
    {/* Catch-all: redirect to home for this domain */}
    <Route path="*" element={<CoatingKings />} />
  </Routes>
);

// GCN Main Site Routes
const GCNRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<Home />} />
    <Route path="/report/:token" element={<Suspense fallback={<div />}><SharedMeasurementReport /></Suspense>} />
    <Route path="/services" element={<Index />} />
    <Route path="/join" element={<JoinNetwork />} />
    <Route path="/join-network" element={<Navigate to="/join" replace />} />
    <Route path="/register-company" element={<CompanyRegistration />} />
    <Route path="/company/dashboard" element={
      <ProtectedRoute redirectTo="/network-login">
        <CompanyAdminDashboard />
      </ProtectedRoute>
    } />
    <Route path="/network-login" element={<NetworkLogin />} />
    <Route path="/login" element={<NetworkLogin />} />
    <Route path="/homeowner/dashboard" element={<HomeownerDashboard />} />
    <Route path="/homeowner-dashboard" element={<HomeownerDashboard />} />
    <Route path="/homeowner-profile" element={
      <ProtectedRoute redirectTo="/network-login">
        <HomeownerProfile />
      </ProtectedRoute>
    } />
    <Route path="/homeowner-messages" element={
      <ProtectedRoute redirectTo="/network-login">
        <HomeownerMessages />
      </ProtectedRoute>
    } />
    <Route path="/quote/:type/:id" element={
      <ProtectedRoute redirectTo="/network-login">
        <QuoteDetail />
      </ProtectedRoute>
    } />
    <Route path="/member/dashboard" element={<MemberDashboard />} />
    
    {/* CRM (GCN internal) — disabled. Contractors access CRM via external Pitch CRM tile. */}
    <Route path="/member/crm/*" element={<Navigate to="/member/dashboard" replace />} />
    <Route path="/my-profile" element={
      <ProtectedRoute redirectTo="/network-login">
        <MyProfile />
      </ProtectedRoute>
    } />
    <Route path="/directory" element={<ContractorDirectory />} />
    <Route path="/contractor-directory" element={<ContractorDirectory />} />
    <Route path="/company/:companyId" element={<Suspense fallback={<div />}><CompanyProfile /></Suspense>} />
    <Route path="/contractor/:contractorId" element={<Suspense fallback={<div />}><ContractorPublicProfile /></Suspense>} />
    <Route path="/register-individual" element={<Suspense fallback={<div />}><IndividualRegistration /></Suspense>} />
    
    {/* Master Admin Hub Routes */}
    <Route path="/admin/auth" element={<SuperAdminAuth />} />
    <Route path="/admin/dashboard" element={
      <ProtectedRoute redirectTo="/admin/auth">
        <SuperAdminDashboard />
      </ProtectedRoute>
    } />
    <Route path="/admin/firecrawl" element={
      <ProtectedRoute redirectTo="/admin/auth">
        <AdminFirecrawl />
      </ProtectedRoute>
    } />
    
    {/* Coating Kings Routes (accessible from GCN) */}
    <Route path="/coating-kings" element={<CoatingKings />} />
    <Route path="/coating-kings/admin/auth" element={<CoatingKingsAdminAuth />} />
    <Route path="/coating-kings/admin/dashboard" element={
      <ProtectedRoute redirectTo="/coating-kings/admin/auth">
        <CoatingKingsAdminDashboard />
      </ProtectedRoute>
    } />
          
          {/* Retired: Windows & Doors */}
          <Route path="/services" element={<Navigate to="/services" replace />} />
          <Route path="/services/*" element={<Navigate to="/services" replace />} />

          {/* Emergency Mitigation Routes */}
          <Route path="/emergency-mitigation" element={<EmergencyMitigation />} />
          
          {/* Northern Landscaping Routes */}
          <Route path="/northern-landscaping" element={<NorthernLandscaping />} />
          
          {/* Roofing Admin Routes */}
          <Route path="/roofing/admin/auth" element={<RoofingAdminAuth />} />
          <Route path="/roofing/admin/dashboard" element={
            <ProtectedRoute redirectTo="/roofing/admin/auth">
              <RoofingAdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Permit Expediting Routes (redirect landing page to dashboard) */}
          <Route path="/permit-queens" element={<Navigate to="/permit-queens/dashboard" replace />} />
          <Route path="/permit-queens/auth" element={<PermitQueensAuth />} />
          <Route path="/permit-queens/dashboard" element={
            <ProtectedRoute redirectTo="/permit-queens/auth">
              <PermitQueensDashboard />
            </ProtectedRoute>
          } />
          <Route path="/permit-queens/new-request" element={
            <ProtectedRoute redirectTo="/permit-queens/auth">
              <PermitQueensNewRequest />
            </ProtectedRoute>
          } />
          <Route path="/permit-queens/request/:id" element={
            <ProtectedRoute redirectTo="/permit-queens/auth">
              <PermitQueensRequestDetail />
            </ProtectedRoute>
          } />
          <Route path="/permit-queens/packet-assembly/:projectId" element={
            <ProtectedRoute redirectTo="/permit-queens/auth">
              <PermitPacketAssembly />
            </ProtectedRoute>
          } />
          <Route path="/permit-queens/admin/auth" element={<PermitQueensAdminAuth />} />
          <Route path="/permit-queens/admin/dashboard" element={
            <ProtectedRoute redirectTo="/permit-queens/admin/auth">
              <PermitQueensAdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/permit-queens/admin/building-departments" element={
            <ProtectedRoute redirectTo="/permit-queens/admin/auth">
              <PermitQueensAdminBuildingDepts />
            </ProtectedRoute>
          } />
          <Route path="/permit-queens/admin/ai-intelligence" element={
            <ProtectedRoute redirectTo="/permit-queens/admin/auth">
              <PermitQueensAIIntelligence />
            </ProtectedRoute>
          } />
          <Route path="/permit-queens/admin/templates" element={
            <ProtectedRoute redirectTo="/permit-queens/admin/auth">
              <PermitQueensAdminTemplates />
            </ProtectedRoute>
          } />
          
          {/* Retired: Estimating & Supplementing - replaced by unified Estimating & Supplementing */}
          <Route path="/contractor/estimating" element={<Navigate to="/contractor/estimating" replace />} />
          <Route path="/contractor/estimating/*" element={<Navigate to="/contractor/estimating" replace />} />
          <Route path="/contractor/estimating" element={
            <ProtectedRoute>
              <Suspense fallback={<div />}><ContractorEstimating /></Suspense>
            </ProtectedRoute>
          } />
          
          {/* PropertyIQ Routes */}
          <Route path="/property-iq" element={<Suspense fallback={<div />}><PropertyIQ /></Suspense>} />
          <Route path="/property-iq/auth" element={<Suspense fallback={<div />}><PropertyIQAuth /></Suspense>} />
          <Route path="/property-iq/dashboard" element={<PropertyIQDashboardRoute />} />
          <Route path="/property-iq/search" element={<Suspense fallback={<div />}><PropertyIQSearch /></Suspense>} />
          <Route path="/property-iq/property/:id" element={<Suspense fallback={<div />}><PropertyIQReport /></Suspense>} />

          <Route path="/instant-quote" element={<HomeownerOnlyRoute><Suspense fallback={<div />}><InstantQuote /></Suspense></HomeownerOnlyRoute>} />
          <Route path="/instant-quote/:tradeSlug" element={<HomeownerOnlyRoute><Suspense fallback={<div />}><TradeWizard /></Suspense></HomeownerOnlyRoute>} />
          <Route path="/schedule-consultation" element={<Suspense fallback={<div />}><ScheduleConsultation /></Suspense>} />
          <Route path="/homeowner/marketplace" element={
            <ProtectedRoute redirectTo="/network-login">
              <Suspense fallback={<div />}><HomeownerMarketplace /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/maintenance-membership" element={<Suspense fallback={<div />}><MaintenanceMembership /></Suspense>} />
          <Route path="/prep-property" element={<PrepYourProperty />} />
          <Route path="/roofing-services" element={<RoofingServices />} />
          <Route path="/roofing" element={<Roofing />} />
          <Route path="/store" element={<MerchandiseStore />} />
          <Route path="/store/auth" element={<StoreAuth />} />
          <Route path="/store/dashboard" element={
            <ProtectedRoute redirectTo="/store/auth">
              <StoreDashboard />
            </ProtectedRoute>
          } />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/consulting" element={<MarketingConsulting />} />
          <Route path="/digital-marketing" element={<DigitalMarketingServices />} />
          <Route path="/franchise" element={<Franchise />} />
          
          {/* CRM (legacy GCN CRM) — disabled. External Pitch CRM is the only CRM. */}
          <Route path="/crm/*" element={<Navigate to="/member/dashboard" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Training Academy / Resource Library Routes */}
          <Route path="/academy" element={<TrainingAcademy />} />
          <Route path="/academy/resources" element={<AcademyResources />} />
          <Route path="/academy/resources/:resourceId" element={<ResourceDetail />} />
          <Route path="/learning" element={<TrainingAcademy />} />
          
          {/* Legacy Learning Platform Routes (for enrolled students) */}
          <Route path="/learning/teacher" element={
            <ProtectedRoute redirectTo="/academy">
              <TeacherDashboard />
            </ProtectedRoute>
          } />
          <Route path="/learning/student" element={
            <ProtectedRoute redirectTo="/academy">
              <StudentDashboard />
            </ProtectedRoute>
          } />
          
          {/* Contractor Portal Routes */}
          <Route path="/contractor" element={<ContractorAuth />} />
          <Route path="/contractor/dashboard" element={
            <ProtectedRoute redirectTo="/contractor">
              <ContractorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/contractor/rewards" element={
            <ProtectedRoute redirectTo="/contractor">
              <ContractorRewards />
            </ProtectedRoute>
          } />
          <Route path="/contractor/referrals" element={
            <ProtectedRoute redirectTo="/network-login">
              <ContractorReferralsPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/referrals" element={
            <ProtectedRoute redirectTo="/network-login">
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
                <ReferralsDashboard />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/r/consent" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
              <BroadcastConsent />
            </Suspense>
          } />
          <Route path="/job-board" element={
            <ProtectedRoute redirectTo="/network-login">
              <JobBoard />
            </ProtectedRoute>
          } />
          <Route path="/door-to-door" element={
            <ProtectedRoute redirectTo="/network-login">
              <DoorToDoor />
            </ProtectedRoute>
          } />
          
          {/* Social Network - Coming Soon */}
          <Route path="/social/*" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
              <SocialComingSoon />
            </Suspense>
          } />
          
          {/* Legacy routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/customers" element={<Navigate to="/member/dashboard" replace />} />
          <Route path="/field-map" element={<Navigate to="/member/dashboard" replace />} />
          <Route path="/measurements" element={<Navigate to="/member/dashboard" replace />} />
          <Route path="/estimates" element={<Navigate to="/member/dashboard" replace />} />
          <Route path="/presentations" element={<Navigate to="/member/dashboard" replace />} />
          
          {/* Design System */}
          <Route path="/design-system" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
              <DesignSystem />
            </Suspense>
          } />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <GlobalAIChat />
          <AnimatePresence mode="wait">
            {isCoatingKingsDomain() ? <CoatingKingsRoutes /> : <GCNRoutes />}
          </AnimatePresence>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;