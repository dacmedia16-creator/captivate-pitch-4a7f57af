import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RoleProvider } from "@/contexts/RoleContext";
import { AppLayout } from "@/components/AppLayout";
import { RoleGuard } from "@/components/RoleGuard";

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminTenants from "@/pages/admin/AdminTenants";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminSettings from "@/pages/admin/AdminSettings";

// Company pages
import CompanyDashboard from "@/pages/company/CompanyDashboard";
import CompanyTeam from "@/pages/company/CompanyTeam";
import CompanyBranding from "@/pages/company/CompanyBranding";
import CompanyTemplates from "@/pages/company/CompanyTemplates";
import CompanySettings from "@/pages/company/CompanySettings";

// Agent pages
import AgentDashboard from "@/pages/agent/AgentDashboard";
import AgentPresentations from "@/pages/agent/AgentPresentations";
import AgentNewPresentation from "@/pages/agent/AgentNewPresentation";
import AgentProfile from "@/pages/agent/AgentProfile";
import AgentMarketStudy from "@/pages/agent/AgentMarketStudy";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RoleProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Agent routes */}
            <Route path="/dashboard" element={<AppLayout><RoleGuard allowedRoles={["agent"]}><AgentDashboard /></RoleGuard></AppLayout>} />
            <Route path="/presentations" element={<AppLayout><RoleGuard allowedRoles={["agent"]}><AgentPresentations /></RoleGuard></AppLayout>} />
            <Route path="/presentations/new" element={<AppLayout><RoleGuard allowedRoles={["agent"]}><AgentNewPresentation /></RoleGuard></AppLayout>} />
            <Route path="/profile" element={<AppLayout><RoleGuard allowedRoles={["agent"]}><AgentProfile /></RoleGuard></AppLayout>} />
            <Route path="/market-study" element={<AppLayout><RoleGuard allowedRoles={["agent"]}><AgentMarketStudy /></RoleGuard></AppLayout>} />

            {/* Company admin routes */}
            <Route path="/company/dashboard" element={<AppLayout><RoleGuard allowedRoles={["admin"]}><CompanyDashboard /></RoleGuard></AppLayout>} />
            <Route path="/company/team" element={<AppLayout><RoleGuard allowedRoles={["admin"]}><CompanyTeam /></RoleGuard></AppLayout>} />
            <Route path="/company/branding" element={<AppLayout><RoleGuard allowedRoles={["admin"]}><CompanyBranding /></RoleGuard></AppLayout>} />
            <Route path="/company/templates" element={<AppLayout><RoleGuard allowedRoles={["admin"]}><CompanyTemplates /></RoleGuard></AppLayout>} />
            <Route path="/company/settings" element={<AppLayout><RoleGuard allowedRoles={["admin"]}><CompanySettings /></RoleGuard></AppLayout>} />

            {/* Super admin routes */}
            <Route path="/admin/dashboard" element={<AppLayout><RoleGuard allowedRoles={["super_admin"]}><AdminDashboard /></RoleGuard></AppLayout>} />
            <Route path="/admin/tenants" element={<AppLayout><RoleGuard allowedRoles={["super_admin"]}><AdminTenants /></RoleGuard></AppLayout>} />
            <Route path="/admin/users" element={<AppLayout><RoleGuard allowedRoles={["super_admin"]}><AdminUsers /></RoleGuard></AppLayout>} />
            <Route path="/admin/settings" element={<AppLayout><RoleGuard allowedRoles={["super_admin"]}><AdminSettings /></RoleGuard></AppLayout>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
