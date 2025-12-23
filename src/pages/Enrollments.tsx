import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, HelpCircle, Upload, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { EnrollmentModal } from "@/components/EnrollmentModal";
import { CsvImportModal } from "@/components/CsvImportModal";
import { TransferCohortModal } from "@/components/TransferCohortModal";
import { EnrollmentFilters } from "@/components/enrollments/EnrollmentFilters";
import { EnrollmentList } from "@/components/enrollments/EnrollmentList";
import { PaginationControls } from "@/components/enrollments/PaginationControls";
import { useEnrollments, useCancelEnrollment } from "@/components/enrollments/useEnrollments";
import { BulkActionsBar } from "@/components/enrollments/BulkActionsBar";
import { SortOption, Enrollment } from "@/components/enrollments/types";

const Enrollments = () => {
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [page, setPage] = useState(1);
  const [showCancelled, setShowCancelled] = useState(false);
  const pageSize = 10;

  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [csvImportModalOpen, setCsvImportModalOpen] = useState(false);

  // Transfer Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferEnrollmentIds, setTransferEnrollmentIds] = useState<string[]>([]);
  const [transferStudentName, setTransferStudentName] = useState<string | undefined>(undefined);
  const [transferCurrentCohortId, setTransferCurrentCohortId] = useState<string | undefined>(undefined);
  const [transferCurrentCohortName, setTransferCurrentCohortName] = useState<string | undefined>(undefined);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { enrollments, isLoading, totalPages, totalCount } = useEnrollments(sortBy, page, pageSize, showCancelled);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cancelEnrollment = useCancelEnrollment();

  const handleEdit = (enrollment: Enrollment) => {
    setEditingEnrollment(enrollment);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingEnrollment(null);
  };

  const handleTransferClick = (enrollment: Enrollment) => {
    setTransferEnrollmentIds([enrollment.id]);
    setTransferStudentName(enrollment.student_name);
    setTransferCurrentCohortId(enrollment.cohort_id);
    setTransferCurrentCohortName(enrollment.cohorts?.name || '');
    setTransferModalOpen(true);
  };

  // --- Bulk Actions ---

  const handleSelectAllGlobal = async () => {
    const { data, error } = await supabase
      .from('enrollments')
      .select('id');

    if (error) {
      toast({ title: "Erro ao selecionar todos", description: error.message, variant: "destructive" });
      return;
    }

    if (data) {
      setSelectedIds(data.map(e => e.id));
      toast({ title: "Todos os alunos selecionados" });
    }
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("enrollments")
        .delete()
        .in("id", selectedIds);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Matrículas excluídas permanentemente" });
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["all-enrollments"] });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  });

  const bulkCancelMutation = useMutation({
    mutationFn: async () => {
      const promises = selectedIds.map(id => {
        const enrollment = enrollments?.find(e => e.id === id);
        return cancelEnrollment.mutateAsync({
          id,
          cohort_id: enrollment?.cohort_id || '',
          current_metadata: enrollment?.external_metadata
        });
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({ title: "Matrículas canceladas com sucesso" });
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["all-enrollments"] });
    },
    onError: (error) => {
      toast({ title: "Erro ao cancelar", description: error.message, variant: "destructive" });
    }
  });

  const bulkPayMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("enrollments")
        .update({ financial_status: "paid", purchase_date: new Date().toISOString().split('T')[0] })
        .in("id", selectedIds);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Matrículas marcadas como pagas" });
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["all-enrollments"] });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    }
  });

  const bulkMarkAsSignedMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("enrollments")
        .update({ contract_status: "signed", submitted_at: new Date().toISOString() })
        .in("id", selectedIds);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Contratos marcados como assinados" });
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["all-enrollments"] });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    }
  });

  const bulkContractMutation = useMutation({
    mutationFn: async () => {
      const promises = selectedIds.map(id =>
        supabase.functions.invoke('send-to-clicksign', { body: { enrollmentId: id } })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({ title: "Contratos enviados para assinatura" });
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["all-enrollments"] });
    },
    onError: (error) => {
      toast({ title: "Erro ao enviar contratos", description: error.message, variant: "destructive" });
    }
  });

  const handleBulkTransfer = () => {
    setTransferEnrollmentIds(selectedIds);
    setTransferStudentName(undefined);
    setTransferCurrentCohortId(undefined);
    setTransferCurrentCohortName(undefined);
    setTransferModalOpen(true);
  };

  const isPending = bulkDeleteMutation.isPending ||
    bulkCancelMutation.isPending ||
    bulkPayMutation.isPending ||
    bulkMarkAsSignedMutation.isPending ||
    bulkContractMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Responsive Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 lg:py-4 gap-3">
          {/* Left: Title */}
          <div className="flex items-center gap-3 min-w-0">
            <SidebarTrigger />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
                Matrículas
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden md:block">
                Gerencie todas as matrículas do sistema
              </p>
            </div>
          </div>

          {/* Desktop Controls (lg+) */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            <Button variant="ghost" size="icon" asChild>
              <a href="/documentation#gestao-de-matriculas" target="_blank" rel="noopener noreferrer">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
              </a>
            </Button>
            <Button onClick={() => setCsvImportModalOpen(true)} variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
            <Button onClick={() => { setEditingEnrollment(null); setModalOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Matrícula
            </Button>
            <UserMenu />
          </div>

          {/* Mobile/Tablet Controls */}
          <div className="flex items-center gap-2 lg:hidden flex-shrink-0">
            <Button onClick={() => { setEditingEnrollment(null); setModalOpen(true); }} size="sm" className="bg-primary hover:bg-primary/90 h-9 px-3 gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova</span>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto rounded-t-2xl">
                <SheetHeader className="text-left mb-6">
                  <SheetTitle>Opções</SheetTitle>
                </SheetHeader>
                <div className="space-y-3">
                  <Button onClick={() => setCsvImportModalOpen(true)} variant="outline" className="w-full justify-start h-11 gap-2">
                    <Upload className="h-4 w-4" />
                    Importar CSV
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-11 gap-2" asChild>
                    <a href="/documentation#gestao-de-matriculas" target="_blank" rel="noopener noreferrer">
                      <HelpCircle className="h-4 w-4" />
                      Ver Documentação
                    </a>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <UserMenu />
          </div>
        </div>

        {/* Filters - Below header on mobile */}
        <div className="px-4 sm:px-6 lg:px-8 pb-3">
          <EnrollmentFilters
            sortBy={sortBy}
            onSortChange={setSortBy}
            showCancelled={showCancelled}
            onShowCancelledChange={setShowCancelled}
          />
        </div>
      </header>

      <section className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6 pb-24">
        <EnrollmentList
          enrollments={enrollments || []}
          isLoading={isLoading}
          onEdit={handleEdit}
          onTransfer={handleTransferClick}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          totalCount={totalCount}
          onSelectAllGlobal={handleSelectAllGlobal}
        />

        {!isLoading && enrollments && enrollments.length > 0 && (
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            isLoading={isLoading}
          />
        )}
      </section>

      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onDelete={() => bulkDeleteMutation.mutate()}
        onCancel={() => bulkCancelMutation.mutate()}
        onMarkAsPaid={() => bulkPayMutation.mutate()}
        onMarkAsSigned={() => bulkMarkAsSignedMutation.mutate()}
        onSendContract={() => bulkContractMutation.mutate()}
        onTransfer={handleBulkTransfer}
        isPending={isPending}
      />

      <EnrollmentModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        cohortName={editingEnrollment?.cohorts?.name || ''}
        cohortId={editingEnrollment?.cohort_id}
        onSubmit={() => {
          queryClient.invalidateQueries({ queryKey: ["all-enrollments"] });
        }}
        editingEnrollment={editingEnrollment || undefined}
      />

      <CsvImportModal
        open={csvImportModalOpen}
        onOpenChange={setCsvImportModalOpen}
        multiCohort={true}
      />

      <TransferCohortModal
        open={transferModalOpen}
        onOpenChange={setTransferModalOpen}
        enrollmentIds={transferEnrollmentIds}
        studentName={transferStudentName}
        currentCohortId={transferCurrentCohortId}
        currentCohortName={transferCurrentCohortName}
      />
    </div>
  );
};

export default Enrollments;
