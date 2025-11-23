import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useTheme } from "@/hooks/useTheme";
import { LoadingFallback } from "@/components/LoadingFallback";
import { MainLayout } from "@/components/MainLayout";

const Index = lazy(() => import("./pages/Index"));
const CohortsOverview = lazy(() => import("./pages/CohortsOverview"));
const CohortDetail = lazy(() => import("./pages/CohortDetail"));
const CohortsAdmin = lazy(() => import("./pages/CohortsAdmin"));
const Enrollments = lazy(() => import("./pages/Enrollments"));
const Settings = lazy(() => import("./pages/Settings"));
const Users = lazy(() => import("./pages/Users"));
const Profile = lazy(() => import("./pages/Profile"));
const Auth = lazy(() => import("./pages/Auth"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const Documentation = lazy(() => import("./pages/Documentation"));
const ImportHistory = lazy(() => import("./pages/ImportHistory"));
const Branding = lazy(() => import("./pages/Branding"));
const Integrations = lazy(() => import("./pages/Integrations"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const AppContent = () => {
  useTheme();
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/auth" element={<Auth />} />

        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<Index />} />
          <Route path="/cohorts" element={<CohortsOverview />} />
          <Route path="/cohorts/admin" element={<ProtectedRoute requiredRole="admin"><CohortsAdmin /></ProtectedRoute>} />
          <Route path="/cohorts/:cohortId" element={<CohortDetail />} />
          <Route path="/enrollments" element={<Enrollments />} />
          <Route path="/settings" element={<ProtectedRoute requiredRole="admin"><Settings /></ProtectedRoute>} />
          <Route path="/branding" element={<ProtectedRoute requiredRole="admin"><Branding /></ProtectedRoute>} />
          <Route path="/integrations" element={<ProtectedRoute requiredRole="admin"><Integrations /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute requiredRole="admin"><Users /></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute requiredRole="admin"><AuditLogs /></ProtectedRoute>} />
          <Route path="/import-history" element={<ProtectedRoute requiredRole="admin"><ImportHistory /></ProtectedRoute>} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
