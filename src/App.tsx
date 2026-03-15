import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { isCoatingKingsDomain } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AnimatePresence } from "framer-motion";

// Social Coming Soon Page
const SocialComingSoon = lazy(() => import("./pages/social/SocialComingSoon"));

// CRM Pages
import { CRMLayout } from "./components/crm/CRMLayout";
const CRMDashboard = lazy(() => import("./pages/crm/CRMDashboard"));
const CRMPipeline = lazy(() => import("./pages/crm/CRMPipeline"));
const CRMContacts = lazy(() => import("./pages/crm/CRMContacts"));
const CRMContactDetail = lazy(() => import("./pages/crm/CRMContactDetail"));
const CRMJobs = lazy(() => import("./pages/crm/CRMJobs"));
const CRMEstimates = lazy(() => import("./pages/crm/CRMEstimates"));
const CRMEstimateBuilder = lazy(() => import("./pages/crm/CRMEstimateBuilder"));
const CRMProduction = lazy(() => import("./pages/crm/CRMProduction"));
const CRMCalendar = lazy(() => import("./pages/crm/CRMCalendar"));
const CRMPlaceholder = lazy(() => import("./pages/crm/CRMPlaceholder"));
const CRMStormCanvas = lazy(() => import("./pages/crm/CRMStormCanvas"));
const CanvassMap = lazy(() => import("./pages/crm/CanvassMap"));
const CRMSmartDocs = lazy(() => import("./pages/crm/CRMSmartDocs"));
const CRMPresentations = lazy(() => import("./pages/crm/CRMPresentations"));
const CRMPermitExpediter = lazy(() => import("./pages/crm/CRMPermitExpediter"));
const CRMSettings = lazy(() => import("./pages/crm/CRMSettings"));
const CRMHelp = lazy(() => import("./pages/crm/CRMHelp"));
const CRMFollowUpInbox = lazy(() => import("./pages/crm/CRMFollowUpInbox"));
const CRMFollowUpUnmatched = lazy(() => import("./pages/crm/CRMFollowUpUnmatched"));
const CRMFollowUpAIQueue = lazy(() => import("./pages/crm/CRMFollowUpAIQueue"));
const CRMFollowUpCallCenter = lazy(() => import("./pages/crm/CRMFollowUpCallCenter"));
const CRMFollowUpAIAgent = lazy(() => import("./pages/crm/CRMFollowUpAIAgent"));
const CRMInsuranceClaims = lazy(() => import("./pages/crm/CRMInsuranceClaims"));
const CRMInsuranceCarriers = lazy(() => import("./pages/crm/CRMInsuranceCarriers"));
const CRMInsuranceAdjusters = lazy(() => import("./pages/crm/CRMInsuranceAdjusters"));
const CRMInsuranceSupplements = lazy(() => import("./pages/crm/CRMInsuranceSupplements"));
const CRMScopeIntelligence = lazy(() => import("./pages/crm/CRMScopeIntelligence"));
const CRMCrewPortal = lazy(() => import("./pages/crm/CRMCrewPortal"));
const CRMHomeownerPortal = lazy(() => import("./pages/crm/CRMHomeownerPortal"));
const CRMLeadDetail = lazy(() => import("./pages/crm/CRMLeadDetail"));
const SharedMeasurementReport = lazy(() => import("./pages/SharedMeasurementReport"));
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Contacts from "./pages/Contacts";
import LeadPipeline from "./pages/LeadPipeline";
import FieldMap from "./pages/FieldMap";
import Measurements from "./pages/Measurements";
import Estimates from "./pages/Estimates";
import Presentations from "./pages/Presentations";
import GamificationDashboard from "./pages/GamificationDashboard";
import ContractorRewards from "./pages/ContractorRewards";
import NotFound from "./pages/NotFound";
import JobBoard from "./pages/JobBoard";
import DoorToDoor from "./pages/DoorToDoor";
import ContractorDirectory from "./pages/ContractorDirectory";
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
import SupplementKings from "./pages/SupplementKings";
import SupplementKingsContractorAuth from "./pages/SupplementKingsContractorAuth";
import SupplementKingsContractorDashboard from "./pages/SupplementKingsContractorDashboard";
import SupplementKingsAdminAuth from "./pages/SupplementKingsAdminAuth";
import SupplementKingsAdminDashboard from "./pages/SupplementKingsAdminDashboard";
import PermitQueensAdminAuth from "./pages/PermitQueensAdminAuth";
import PermitQueensAdminDashboard from "./pages/PermitQueensAdminDashboard";
import RoofingAdminAuth from "./pages/RoofingAdminAuth";
import RoofingAdminDashboard from "./pages/RoofingAdminDashboard";
import SuperAdminAuth from "./pages/SuperAdminAuth";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import GreenHomeSolutions from "./pages/GreenHomeSolutions";
import GreenHomeSolutionsAdminAuth from "./pages/GreenHomeSolutionsAdminAuth";
import GreenHomeSolutionsAdminDashboard from "./pages/GreenHomeSolutionsAdminDashboard";
import EmergencyMitigation from "./pages/EmergencyMitigation";
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
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ScrollToTop } from "./components/ScrollToTop";
import { GlobalAIChat } from "./components/ai/GlobalAIChat";
const DesignSystem = lazy(() => import("./pages/DesignSystem"));
const AdminFirecrawl = lazy(() => import("./pages/AdminFirecrawl"));
const PropertyIQ = lazy(() => import("./pages/PropertyIQ"));
const PropertyIQAuth = lazy(() => import("./pages/PropertyIQAuth"));
const PropertyIQDashboard = lazy(() => import("./pages/PropertyIQDashboard"));
const PropertyIQSearch = lazy(() => import("./pages/PropertyIQSearch"));
const PropertyIQReport = lazy(() => import("./pages/PropertyIQReport"));

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
    <Route path="/" element={<LandingPage />} />
    <Route path="/services" element={<Index />} />
    <Route path="/join" element={<JoinNetwork />} />
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
    
    {/* CRM Routes */}
    <Route path="/member/crm" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout>
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
            <CRMDashboard />
          </Suspense>
        </CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/pipeline" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMPipeline /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/contacts" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMContacts /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/contacts/:contactId" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMContactDetail /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/leads/:leadId" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMLeadDetail /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/jobs" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMJobs /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/estimates" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMEstimates /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/estimates/new" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMEstimateBuilder /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/measurements" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><Measurements /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/production" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMProduction /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/calendar" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMCalendar /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/storm-canvas" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMStormCanvas /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/storm-canvas/canvass" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CanvassMap /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/presentations" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMPresentations /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/smart-docs" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMSmartDocs /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/permit-expediter" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMPermitExpediter /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/follow-up/inbox" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMFollowUpInbox /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/follow-up/unmatched" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMFollowUpUnmatched /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/follow-up/ai-queue" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMFollowUpAIQueue /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/follow-up/call-center" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMFollowUpCallCenter /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/follow-up/ai-agent" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMFollowUpAIAgent /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/insurance/claims" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMInsuranceClaims /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/insurance/carriers" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMInsuranceCarriers /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/insurance/adjusters" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMInsuranceAdjusters /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/insurance/supplements" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMInsuranceSupplements /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/insurance/scope-intelligence" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMScopeIntelligence /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/crew-portal" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMCrewPortal /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/homeowner-portal" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMHomeownerPortal /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/help" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMHelp /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/member/crm/settings" element={
      <ProtectedRoute redirectTo="/network-login">
        <CRMLayout><Suspense fallback={<div />}><CRMSettings /></Suspense></CRMLayout>
      </ProtectedRoute>
    } />
    <Route path="/my-profile" element={
      <ProtectedRoute redirectTo="/network-login">
        <MyProfile />
      </ProtectedRoute>
    } />
    <Route path="/directory" element={<ContractorDirectory />} />
    <Route path="/contractor-directory" element={<ContractorDirectory />} />
    
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
          
          {/* Green Home Solutions Routes */}
          <Route path="/green-home-solutions" element={<GreenHomeSolutions />} />
          <Route path="/green-home-solutions/admin/auth" element={<GreenHomeSolutionsAdminAuth />} />
          <Route path="/green-home-solutions/admin/dashboard" element={
            <ProtectedRoute redirectTo="/green-home-solutions/admin/auth">
              <GreenHomeSolutionsAdminDashboard />
            </ProtectedRoute>
          } />
          
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
          
          {/* Supplement Kings Routes */}
          <Route path="/supplement-kings" element={<SupplementKings />} />
          <Route path="/supplement-kings/contractor/auth" element={<SupplementKingsContractorAuth />} />
          <Route path="/supplement-kings/contractor/dashboard" element={
            <ProtectedRoute redirectTo="/supplement-kings/contractor/auth">
              <SupplementKingsContractorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/supplement-kings/admin/auth" element={<SupplementKingsAdminAuth />} />
          <Route path="/supplement-kings/admin/dashboard" element={
            <ProtectedRoute redirectTo="/supplement-kings/admin/auth">
              <SupplementKingsAdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* PropertyIQ Routes */}
          <Route path="/property-iq" element={<Suspense fallback={<div />}><PropertyIQ /></Suspense>} />
          <Route path="/property-iq/auth" element={<Suspense fallback={<div />}><PropertyIQAuth /></Suspense>} />
          <Route path="/property-iq/dashboard" element={
            <ProtectedRoute redirectTo="/property-iq/auth">
              <Suspense fallback={<div />}><PropertyIQDashboard /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/property-iq/search" element={<Suspense fallback={<div />}><PropertyIQSearch /></Suspense>} />
          <Route path="/property-iq/property/:id" element={<Suspense fallback={<div />}><PropertyIQReport /></Suspense>} />

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
          
          {/* CRM Routes */}
          <Route path="/crm/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/crm/dashboard" element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/customers" element={
            <ProtectedRoute>
              <AppLayout>
                <Customers />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/contacts" element={
            <ProtectedRoute>
              <AppLayout>
                <Contacts />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/pipeline" element={
            <ProtectedRoute>
              <AppLayout>
                <LeadPipeline />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/field-map" element={
            <ProtectedRoute>
              <AppLayout>
                <FieldMap />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/measurements" element={
            <ProtectedRoute>
              <AppLayout>
                <Measurements />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/estimates" element={
            <ProtectedRoute>
              <AppLayout>
                <Estimates />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/presentations" element={
            <ProtectedRoute>
              <AppLayout>
                <Presentations />
              </AppLayout>
            </ProtectedRoute>
          } />
          
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
          <Route path="/customers" element={
            <ProtectedRoute>
              <AppLayout>
                <Customers />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/field-map" element={
            <ProtectedRoute>
              <AppLayout>
                <FieldMap />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/measurements" element={
            <ProtectedRoute>
              <AppLayout>
                <Measurements />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/estimates" element={
            <ProtectedRoute>
              <AppLayout>
                <Estimates />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/presentations" element={
            <ProtectedRoute>
              <AppLayout>
                <Presentations />
              </AppLayout>
            </ProtectedRoute>
          } />
          
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