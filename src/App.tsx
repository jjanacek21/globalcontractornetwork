import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import FieldMap from "./pages/FieldMap";
import Measurements from "./pages/Measurements";
import Estimates from "./pages/Estimates";
import Presentations from "./pages/Presentations";
import NotFound from "./pages/NotFound";
import ContractorDirectory from "./pages/ContractorDirectory";
import PrepYourProperty from "./pages/PrepYourProperty";
import Roofing from "./pages/Roofing";
import MerchandiseStore from "./pages/MerchandiseStore";
import StoreAuth from "./pages/StoreAuth";
import StoreDashboard from "./pages/StoreDashboard";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import MarketingConsulting from "./pages/MarketingConsulting";
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
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ScrollToTop } from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/directory" element={<ContractorDirectory />} />
          <Route path="/contractor-directory" element={<ContractorDirectory />} />
          
          {/* Master Admin Hub Routes */}
          <Route path="/admin/auth" element={<SuperAdminAuth />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute redirectTo="/admin/auth">
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Coating Kings Routes */}
          <Route path="/coating-kings" element={<CoatingKings />} />
          <Route path="/coating-kings/admin/auth" element={<CoatingKingsAdminAuth />} />
          <Route path="/coating-kings/admin/dashboard" element={
            <ProtectedRoute redirectTo="/coating-kings/admin/auth">
              <CoatingKingsAdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Roofing Admin Routes */}
          <Route path="/roofing/admin/auth" element={<RoofingAdminAuth />} />
          <Route path="/roofing/admin/dashboard" element={
            <ProtectedRoute redirectTo="/roofing/admin/auth">
              <RoofingAdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Permit Queens Routes (rebranded from Permit Pros) */}
          <Route path="/permit-queens" element={<PermitQueens />} />
          <Route path="/permit-queens/auth" element={<PermitQueensAuth />} />
          <Route path="/permit-queens/dashboard" element={
            <ProtectedRoute redirectTo="/permit-queens/auth">
              <PermitQueensDashboard />
            </ProtectedRoute>
          } />
          <Route path="/permit-queens/admin/auth" element={<PermitQueensAdminAuth />} />
          <Route path="/permit-queens/admin/dashboard" element={
            <ProtectedRoute redirectTo="/permit-queens/admin/auth">
              <PermitQueensAdminDashboard />
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
          
          <Route path="/prep-property" element={<PrepYourProperty />} />
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
          <Route path="/franchise" element={<Franchise />} />
          
          {/* CRM Routes */}
          <Route path="/crm/auth" element={<Auth />} />
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
          
          {/* Learning Platform Routes */}
          <Route path="/learning" element={<LearningAuth />} />
          <Route path="/learning/teacher" element={
            <ProtectedRoute redirectTo="/learning">
              <TeacherDashboard />
            </ProtectedRoute>
          } />
          <Route path="/learning/student" element={
            <ProtectedRoute redirectTo="/learning">
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
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;