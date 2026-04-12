import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { AppLayout } from "@/components/AppLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { Loader2 } from "lucide-react";
import { VersionUpdateBanner } from "@/components/VersionUpdateBanner";

// Auth pages (keep static — small, needed immediately)
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";

// Lazy-loaded pages
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminTenants = lazy(() => import("@/pages/admin/AdminTenants"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));

const CompanyDashboard = lazy(() => import("@/pages/company/CompanyDashboard"));
const CompanyTeam = lazy(() => import("@/pages/company/CompanyTeam"));
const CompanyBranding = lazy(() => import("@/pages/company/CompanyBranding"));
const CompanyTemplates = lazy(() => import("@/pages/company/CompanyTemplates"));
const CompanySettings = lazy(() => import("@/pages/company/CompanySettings"));
const CompanyMarketing = lazy(() => import("@/pages/company/CompanyMarketing"));
const CompanyPortals = lazy(() => import("@/pages/company/CompanyPortals"));

const AgentDashboard = lazy(() => import("@/pages/agent/AgentDashboard"));
const AgentPresentations = lazy(() => import("@/pages/agent/AgentPresentations"));
const AgentNewPresentation = lazy(() => import("@/pages/agent/AgentNewPresentation"));
const AgentProfile = lazy(() => import("@/pages/agent/AgentProfile"));
const AgentMarketStudy = lazy(() => import("@/pages/agent/AgentMarketStudy"));
const MarketStudyDetail = lazy(() => import("@/pages/agent/MarketStudyDetail"));
const PresentationEditor = lazy(() => import("@/pages/agent/PresentationEditor"));
const PresentationMode = lazy(() => import("@/pages/agent/PresentationMode"));
const SharedPresentation = lazy(() => import("@/pages/shared/SharedPresentation"));

const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RoleProvider>
            <VersionUpdateBanner />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Agent routes */}
                <Route path="/dashboard" element={<AppLayout><RoleGuard allowedRoles={["agent"]}><AgentDashboard /></RoleGuard></AppLayout>} />
                <Route path="/presentations" element={<AppLayout><RoleGuard allowedRoles={["agent"]}><AgentPresentations /></RoleGuard></AppLayout>} />
                <Route path="/presentations/new" element={<AppLayout><RoleGuard allowedRoles={["agent"]}><AgentNewPresentation /></RoleGuard></AppLayout>} />
                <Route path="/presentations/:id/edit" element={<AppLayout><RoleGuard allowedRoles={["agent"]}><PresentationEditor /></RoleGuard></AppLayout>} />
                <Route path="/presentations/:id/present" element={<RoleGuard allowedRoles={["agent"]}><PresentationMode /></RoleGuard>} />
                <Route path="/profile" element={<AppLayout><RoleGuard allowedRoles={["agent"]}><AgentProfile /></RoleGuard></AppLayout>} />
                <Route path="/market-study" element={<AppLayout><RoleGuard allowedRoles={["agent"]}><AgentMarketStudy /></RoleGuard></AppLayout>} />
                <Route path="/market-study/:id" element={<AppLayout><RoleGuard allowedRoles={["agent"]}><MarketStudyDetail /></RoleGuard></AppLayout>} />

                {/* Public shared route */}
                <Route path="/share/:token" element={<SharedPresentation />} />

                {/* Company admin routes */}
                <Route path="/company/dashboard" element={<AppLayout><RoleGuard allowedRoles={["admin"]}><CompanyDashboard /></RoleGuard></AppLayout>} />
                <Route path="/company/team" element={<AppLayout><RoleGuard allowedRoles={["admin"]}><CompanyTeam /></RoleGuard></AppLayout>} />
                <Route path="/company/branding" element={<AppLayout><RoleGuard allowedRoles={["admin"]}><CompanyBranding /></RoleGuard></AppLayout>} />
                <Route path="/company/templates" element={<AppLayout><RoleGuard allowedRoles={["admin"]}><CompanyTemplates /></RoleGuard></AppLayout>} />
                <Route path="/company/settings" element={<AppLayout><RoleGuard allowedRoles={["admin"]}><CompanySettings /></RoleGuard></AppLayout>} />
                <Route path="/company/marketing" element={<AppLayout><RoleGuard allowedRoles={["admin"]}><CompanyMarketing /></RoleGuard></AppLayout>} />
                <Route path="/company/portals" element={<AppLayout><RoleGuard allowedRoles={["admin"]}><CompanyPortals /></RoleGuard></AppLayout>} />

                {/* Super admin routes */}
                <Route path="/admin/dashboard" element={<AppLayout><RoleGuard allowedRoles={["super_admin"]}><AdminDashboard /></RoleGuard></AppLayout>} />
                <Route path="/admin/tenants" element={<AppLayout><RoleGuard allowedRoles={["super_admin"]}><AdminTenants /></RoleGuard></AppLayout>} />
                <Route path="/admin/users" element={<AppLayout><RoleGuard allowedRoles={["super_admin"]}><AdminUsers /></RoleGuard></AppLayout>} />
                <Route path="/admin/settings" element={<AppLayout><RoleGuard allowedRoles={["super_admin"]}><AdminSettings /></RoleGuard></AppLayout>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </RoleProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
