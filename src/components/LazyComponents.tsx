/**
 * FASE 4: PERFORMANCE - Lazy Loading de Componentes
 * Carrega componentes apenas quando necessário
 */

import { lazy, Suspense, ComponentType } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Loading fallbacks
const PageSkeleton = () => (
  <div className="p-8 space-y-6">
    <Skeleton className="h-12 w-64" />
    <Skeleton className="h-96 w-full" />
  </div>
);

const CardSkeleton = () => (
  <div className="p-6 space-y-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-32 w-full" />
  </div>
);

const ListSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <Skeleton key={i} className="h-16 w-full" />
    ))}
  </div>
);

// Helper para criar componentes lazy com fallback customizado
function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: JSX.Element = <PageSkeleton />
) {
  const LazyComponent = lazy(importFn);
  
  return (props: any) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// Páginas principais (carregar sob demanda)
export const LazyCohortsOverview = createLazyComponent(
  () => import("@/pages/CohortsOverview")
);

export const LazyCohortDetail = createLazyComponent(
  () => import("@/pages/CohortDetail")
);

export const LazyCohortsAdmin = createLazyComponent(
  () => import("@/pages/CohortsAdmin")
);

export const LazyEnrollments = createLazyComponent(
  () => import("@/pages/Enrollments")
);

export const LazySettings = createLazyComponent(
  () => import("@/pages/Settings")
);

export const LazyBranding = createLazyComponent(
  () => import("@/pages/Branding")
);

export const LazyUsers = createLazyComponent(
  () => import("@/pages/Users")
);

export const LazyAuditLogs = createLazyComponent(
  () => import("@/pages/AuditLogs")
);

export const LazyImportHistory = createLazyComponent(
  () => import("@/pages/ImportHistory")
);

export const LazyDocumentation = createLazyComponent(
  () => import("@/pages/Documentation")
);

export const LazyProfile = createLazyComponent(
  () => import("@/pages/Profile")
);

// Modais e componentes pesados
export const LazyEnrollmentModal = createLazyComponent(
  () => import("@/components/EnrollmentModal").then(m => ({ default: m.EnrollmentModal })),
  <CardSkeleton />
);

export const LazyCsvImportModal = createLazyComponent(
  () => import("@/components/CsvImportModal").then(m => ({ default: m.CsvImportModal })),
  <CardSkeleton />
);

export const LazyConversionAnalysis = createLazyComponent(
  () => import("@/components/ConversionAnalysis").then(m => ({ default: m.ConversionAnalysis })),
  <CardSkeleton />
);

// Componentes de lista e tabelas
export const LazyEnrollmentList = createLazyComponent(
  () => import("@/components/EnrollmentList").then(m => ({ default: m.EnrollmentList })),
  <ListSkeleton />
);

export { PageSkeleton, CardSkeleton, ListSkeleton };
