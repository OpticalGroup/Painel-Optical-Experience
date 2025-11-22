import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { EnrollmentModal } from "@/components/EnrollmentModal";
import { TransferCohortModal } from "@/components/TransferCohortModal";
import { EnrollmentFilters } from "@/components/enrollments/EnrollmentFilters";
import { EnrollmentList } from "@/components/enrollments/EnrollmentList";
import { PaginationControls } from "@/components/enrollments/PaginationControls";
import { useEnrollments } from "@/components/enrollments/useEnrollments";
import { SortOption, Enrollment } from "@/components/enrollments/types";

const Enrollments = () => {
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferEnrollment, setTransferEnrollment] = useState<Enrollment | null>(null);

  const { enrollments, isLoading, totalPages } = useEnrollments(sortBy, page, pageSize);

  const handleEdit = (enrollment: Enrollment) => {
    setEditingEnrollment(enrollment);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingEnrollment(null);
  };

  const handleTransferClick = (enrollment: Enrollment) => {
    setTransferEnrollment(enrollment);
    setTransferModalOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <main className="flex-1">
          <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="flex items-center justify-between px-8 py-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Todas as Matrículas
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Listagem completa de todas as matrículas do sistema
                </p>
              </div>
              <EnrollmentFilters sortBy={sortBy} onSortChange={setSortBy} />
            </div>
          </header>

          <section className="px-8 py-6">
            <EnrollmentList
              enrollments={enrollments}
              isLoading={isLoading}
              onEdit={handleEdit}
              onTransfer={handleTransferClick}
            />

            {!isLoading && enrollments.length > 0 && (
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                isLoading={isLoading}
              />
            )}
          </section>
        </main>

        {/* Modals */}
        {editingEnrollment && (
          <EnrollmentModal
            open={modalOpen}
            onOpenChange={handleModalClose}
            cohortName={editingEnrollment.cohorts?.name || ''}
            cohortId={editingEnrollment.cohort_id}
            onSubmit={() => { }}
            editingEnrollment={editingEnrollment}
          />
        )}

        {transferEnrollment && (
          <TransferCohortModal
            open={transferModalOpen}
            onOpenChange={setTransferModalOpen}
            enrollmentId={transferEnrollment.id}
            studentName={transferEnrollment.student_name}
            currentCohortId={transferEnrollment.cohort_id}
            currentCohortName={transferEnrollment.cohorts?.name || ''}
          />
        )}
      </div>
    </SidebarProvider>
  );
};

export default Enrollments;
