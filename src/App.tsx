import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Customers from "./pages/Customers";
import FieldMap from "./pages/FieldMap";
import Measurements from "./pages/Measurements";
import Estimates from "./pages/Estimates";
import Presentations from "./pages/Presentations";
import NotFound from "./pages/NotFound";
import ContractorDirectory from "./pages/ContractorDirectory";
import PrepYourProperty from "./pages/PrepYourProperty";
import MerchandiseStore from "./pages/MerchandiseStore";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import MarketingConsulting from "./pages/MarketingConsulting";
import Franchise from "./pages/Franchise";
import LearningAuth from "./pages/LearningAuth";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ContractorAuth from "./pages/ContractorAuth";
import ContractorDashboard from "./pages/ContractorDashboard";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/directory" element={<ContractorDirectory />} />
          <Route path="/prep-property" element={<PrepYourProperty />} />
          <Route path="/store" element={<MerchandiseStore />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/consulting" element={<MarketingConsulting />} />
          <Route path="/franchise" element={<Franchise />} />
          
          {/* CRM Routes */}
          <Route path="/crm/auth" element={<Auth />} />
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
          
          {/* Legacy routes - redirect to new paths */}
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
