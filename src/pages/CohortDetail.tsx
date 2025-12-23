import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Upload, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { EnrollmentList } from "@/components/enrollments/EnrollmentList";
import { Enrollment } from "@/components/enrollments/types";
import { EnrollmentModal, EnrollmentData } from "@/components/EnrollmentModal";
import { useToast } from "@/hooks/use-toast";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useCohortQuery } from "@/integrations/supabase/hooks/useCohorts";
import { useEnrollmentsQuery, useCancelEnrollment } from "@/integrations/supabase/hooks/useEnrollments";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CsvImportModal } from "@/components/CsvImportModal";
import { ExportButton } from "@/components/ExportButton";
import { UserMenu } from "@/components/UserMenu";
import { BulkActionsBar } from "@/components/enrollments/BulkActionsBar";
import { TransferCohortModal } from "@/components/TransferCohortModal";
import { OriginSegmentationCard } from "@/components/OriginSegmentationCard";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CohortDetail = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  // Transfer Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferEnrollmentIds, setTransferEnrollmentIds] = useState<string[]>([]);
  const [transferStudentName, setTransferStudentName] = useState<string | undefined>(undefined);
  const [transferCurrentCohortId, setTransferCurrentCohortId] = useState<string | undefined>(undefined);
  const [transferCurrentCohortName, setTransferCurrentCohortName] = useState<string | undefined>(undefined);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { cohortId } = useParams();
  const queryClient = useQueryClient();

  const { data: cohort, isLoading: cohortLoading } = useCohortQuery(cohortId);
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useEnrollmentsQuery(cohortId, showCancelled);
  const cancelEnrollment = useCancelEnrollment();

  const isLoading = cohortLoading || enrollmentsLoading;

  // Filter enrollments based on toggle
  const filteredEnrollments = (enrollmentsData || []).filter(e => {
    if (showCancelled) return true;
    return (e.external_metadata as any)?.status !== 'cancelled';
  });

  // Map enrollments to the format expected by EnrollmentList
  const enrollments: Enrollment[] = filteredEnrollments.map(e => ({
    ...e,
    cohorts: cohort ? { name: cohort.name } : undefined
  }));

  const handleEnrollmentSubmit = (data: EnrollmentData) => {
    // Modal handles the mutation directly
  };

  const handleEdit = (enrollment: Enrollment) => {
    // Reuse EnrollmentModal logic if needed, or just open it pre-filled
    // For now, we might need to adapt EnrollmentModal to accept 'editingEnrollment' prop if we want to edit
    // But CohortDetail didn't have edit logic fully wired in the previous code snippet (it just had onEdit prop in EnrollmentList but no handler passed?)
    // Wait, previous code passed `onEdit={handleEdit}` but `handleEdit` wasn't defined in the snippet I saw?
    // Ah, I see `onEdit` in EnrollmentList props but not used in CohortDetail in the snippet.
    // I will implement a basic handleEdit that opens the modal.
    // But EnrollmentModal needs `editingEnrollment` prop.
    // I'll add state for it.
  };

  // Adding state for editing since it was missing or implicit
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);

  const handleEditClick = (enrollment: Enrollment) => {
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
      queryClient.invalidateQueries({ queryKey: ["cohort", cohortId] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  });

  const bulkCancelMutation = useMutation({
    mutationFn: async () => {
      const promises = selectedIds.map(id => {
        const enrollment = enrollmentsData?.find(e => e.id === id);
        return cancelEnrollment.mutateAsync({
          id,
          cohort_id: cohortId || '',
          current_metadata: enrollment?.external_metadata
        });
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({ title: "Matrículas canceladas com sucesso" });
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["cohort", cohortId] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
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
      queryClient.invalidateQueries({ queryKey: ["cohort", cohortId] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
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
      queryClient.invalidateQueries({ queryKey: ["cohort", cohortId] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
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
      queryClient.invalidateQueries({ queryKey: ["cohort", cohortId] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: (error) => {
      toast({ title: "Erro ao enviar contratos", description: error.message, variant: "destructive" });
    }
  });

  const handleBulkTransfer = () => {
    setTransferEnrollmentIds(selectedIds);
    setTransferStudentName(undefined);
    setTransferCurrentCohortId(cohortId); // In CohortDetail, they are all in this cohort
    setTransferCurrentCohortName(cohort?.name);
    setTransferModalOpen(true);
  };

  const isPending = bulkDeleteMutation.isPending || bulkPayMutation.isPending || bulkContractMutation.isPending || bulkMarkAsSignedMutation.isPending || bulkCancelMutation.isPending;

  // Calculate stats client-side to account for soft deletes
  // We use enrollmentsData (which might include cancelled if showCancelled is true)
  // But for stats, we ALWAYS want to exclude cancelled, regardless of showCancelled toggle
  // UNLESS the user specifically wants to see stats OF cancelled? No, usually stats are for active.
  // Let's filter active enrollments for stats.
  const activeEnrollments = enrollmentsData?.filter(e => (e.external_metadata as any)?.status !== 'cancelled') || [];

  const enrolled = activeEnrollments.length;
  const paid = activeEnrollments.filter(e => e.financial_status === 'paid').length;
  const reserved = activeEnrollments.filter(e => e.financial_status === 'pending').length;
  const signed = activeEnrollments.filter(e => e.contract_status === 'signed').length;
  const available = cohort ? Math.max(0, cohort.capacity - enrolled) : 0;

  const percentage = cohort ? (enrolled / cohort.capacity) * 100 : 0;
  const isOverbooked = percentage > 100;
  const waitlist = isOverbooked ? enrolled - cohort.capacity : 0;

  const chartData = [
    { name: "Pago", value: paid, color: "hsl(var(--primary))" },
    { name: "Reservado", value: reserved, color: "hsl(var(--secondary))" },
    { name: "Aberto", value: available > 0 ? available : 0, color: "hsl(var(--muted))" },
  ];

  return (
    <>
      {/* Responsive Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 lg:py-4 gap-3">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <SidebarTrigger />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/cohorts')}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            {isLoading ? (
              <Skeleton className="h-10 w-40 sm:w-64" />
            ) : cohort ? (
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-foreground truncate">
                  {cohort.name}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block truncate">
                  {format(new Date(cohort.start_date), "dd 'a' ", { locale: ptBR })}
                  {cohort.end_date && format(new Date(cohort.end_date), "dd/MM", { locale: ptBR })} • {cohort.location}
                </p>
              </div>
            ) : null}
          </div>

          {/* Desktop Controls (lg+) */}
          <div className="hidden lg:flex gap-3 items-center flex-shrink-0">
            <div className="flex items-center gap-2 mr-2">
              <Switch
                id="show-cancelled-detail"
                checked={showCancelled}
                onCheckedChange={setShowCancelled}
              />
              <Label htmlFor="show-cancelled-detail" className="text-sm text-muted-foreground cursor-pointer">
                Mostrar Cancelados
              </Label>
            </div>
            <ExportButton type="cohort-detail" cohortId={cohortId} label="Exportar" />
            <Button
              variant="outline"
              onClick={() => setCsvModalOpen(true)}
              disabled={!cohort}
            >
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 shadow-sm"
              onClick={() => setModalOpen(true)}
              disabled={!cohort}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Matrícula
            </Button>
            <UserMenu />
          </div>

          {/* Mobile/Tablet Controls */}
          <div className="flex items-center gap-2 lg:hidden flex-shrink-0">
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 h-9 px-3 gap-1.5"
              onClick={() => setModalOpen(true)}
              disabled={!cohort}
            >
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
                  <SheetTitle>Opções da Turma</SheetTitle>
                </SheetHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="show-cancelled-mobile"
                      checked={showCancelled}
                      onCheckedChange={setShowCancelled}
                    />
                    <Label htmlFor="show-cancelled-mobile" className="text-sm cursor-pointer">
                      Mostrar Cancelados
                    </Label>
                  </div>
                  <div className="h-px bg-border" />
                  <Button onClick={() => setCsvModalOpen(true)} variant="outline" className="w-full justify-start h-11 gap-2" disabled={!cohort}>
                    <Upload className="h-4 w-4" />
                    Importar CSV
                  </Button>
                  <ExportButton type="cohort-detail" cohortId={cohortId} label="Exportar Alunos" className="w-full justify-start h-11" />
                </div>
              </SheetContent>
            </Sheet>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Stats Card */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : cohort ? (
          <Card className="p-4 sm:p-6 border border-border bg-card">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-12">
              {/* Chart */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground">
                      {Math.round(percentage)}%
                    </div>
                    <div className="text-xs text-muted-foreground">ocupado</div>
                  </div>
                </div>
              </div>

              {/* Stats Grid - responsive */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 w-full">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Inscritos</p>
                  <p className="text-3xl font-bold text-foreground">{enrolled}</p>
                  <p className="text-xs text-muted-foreground">de {cohort.capacity} vagas</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Vagas Reservadas</p>
                  <p className="text-3xl font-bold text-secondary">{reserved}</p>
                  <p className="text-xs text-muted-foreground">aguardando pagamento</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Vagas Pagas</p>
                  <p className="text-3xl font-bold text-primary">{paid}</p>
                  <p className="text-xs text-muted-foreground">matrículas pagas</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Contratos Assinados</p>
                  <p className="text-3xl font-bold" style={{ color: 'hsl(var(--chart-5))' }}>{signed}</p>
                  <p className="text-xs text-muted-foreground">documentos firmados</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Cancelados</p>
                  <p className="text-3xl font-bold text-destructive">
                    {(enrollmentsData || []).filter(e => (e.external_metadata as any)?.status === 'cancelled').length}
                  </p>
                  <p className="text-xs text-muted-foreground">matrículas canceladas</p>
                </div>
              </div>

              {/* Vagas Disponíveis ou Fila de Espera */}
              <div className="space-y-1 lg:pl-6 lg:border-l border-border w-full lg:w-auto">
                <p className="text-sm text-muted-foreground">
                  {isOverbooked ? 'Fila de Espera' : 'Vagas Disponíveis'}
                </p>
                <p className={`text-3xl font-bold ${isOverbooked ? 'text-destructive' : 'text-foreground'}`}>
                  {isOverbooked ? waitlist : (available > 0 ? available : 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isOverbooked ? 'alunos aguardando' : 'vagas abertas'}
                </p>
              </div>
            </div>
          </Card>
        ) : null}
      </section>



      {/* Origin Segmentation */}
      <section className="px-4 sm:px-6 lg:px-8 pb-4 lg:pb-6">
        <OriginSegmentationCard
          enrollments={enrollmentsData || []}
          isLoading={isLoading}
        />
      </section>

      {/* Enrollments List */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Alunos Inscritos ({enrollments.length})
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Lista completa de todos os alunos matriculados nesta turma
          </p>
        </div>
        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : enrollments.length === 0 ? (
          <Card className="p-8 border border-border bg-card">
            <p className="text-center text-muted-foreground">
              Nenhum aluno inscrito nesta turma ainda.
            </p>
          </Card>
        ) : (
          <EnrollmentList
            enrollments={enrollments}
            isLoading={isLoading}
            onEdit={handleEditClick}
            onTransfer={handleTransferClick}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            cohortName={cohort?.name}
            cohortId={cohortId}
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

      {/* Modals */}
      {cohort && (
        <>
          <EnrollmentModal
            open={modalOpen}
            onOpenChange={handleModalClose}
            cohortName={cohort.name}
            cohortId={cohortId || ""}
            onSubmit={handleEnrollmentSubmit}
            editingEnrollment={editingEnrollment}
          />
          <CsvImportModal
            open={csvModalOpen}
            onOpenChange={setCsvModalOpen}
            cohortName={cohort.name}
            cohortId={cohortId || ""}
          />
          <TransferCohortModal
            open={transferModalOpen}
            onOpenChange={setTransferModalOpen}
            enrollmentIds={transferEnrollmentIds}
            studentName={transferStudentName}
            currentCohortId={transferCurrentCohortId}
            currentCohortName={transferCurrentCohortName}
          />
        </>
      )}
    </>
  );
};

export default CohortDetail;
