import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CohortFormModal } from "@/components/CohortFormModal";
import { useCohortsQuery, useDeleteCohort } from "@/integrations/supabase/hooks/useCohorts";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type Cohort = Tables<'cohorts'>;

const CohortsAdmin = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cohortToDelete, setCohortToDelete] = useState<string | null>(null);

  const { data: cohorts, isLoading } = useCohortsQuery();
  const deleteCohort = useDeleteCohort();

  const handleEdit = (cohort: Cohort) => {
    setSelectedCohort(cohort);
    setModalOpen(true);
  };

  const handleDelete = (cohortId: string) => {
    setCohortToDelete(cohortId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (cohortToDelete) {
      await deleteCohort.mutateAsync(cohortToDelete);
      setDeleteDialogOpen(false);
      setCohortToDelete(null);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedCohort(null);
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      open: "Aberta",
      full: "Lotada",
      completed: "Concluída",
      cancelled: "Cancelada",
    };
    return statusMap[status] || status;
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Administração de Turmas
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Gerencie todas as turmas do sistema
              </p>
            </div>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 shadow-sm"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Turma
          </Button>
        </div>
      </header>

      {/* Table */}
      <section className="px-8 py-8">
        <div className="rounded-md border border-border bg-card shadow-sm">
          {isLoading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-foreground">Nome da Turma</TableHead>
                  <TableHead className="font-semibold text-foreground">Curso</TableHead>
                  <TableHead className="font-semibold text-foreground">Período</TableHead>
                  <TableHead className="font-semibold text-foreground">Localização</TableHead>
                  <TableHead className="font-semibold text-foreground">Capacidade</TableHead>
                  <TableHead className="font-semibold text-foreground">Ocupação</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cohorts?.map((cohort) => (
                  <TableRow key={cohort.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{cohort.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {cohort.course?.name || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(cohort.start_date), "dd/MM/yyyy", { locale: ptBR })}
                      {cohort.end_date && ` - ${format(new Date(cohort.end_date), "dd/MM/yyyy", { locale: ptBR })}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{cohort.location}</TableCell>
                    <TableCell className="text-muted-foreground">{cohort.capacity}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {cohort.stats?.enrolled_count || 0}/{cohort.capacity}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({Math.round(((cohort.stats?.enrolled_count || 0) / cohort.capacity) * 100)}%)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${cohort.status === 'open' ? 'bg-green-100 text-green-800' :
                        cohort.status === 'full' ? 'bg-yellow-100 text-yellow-800' :
                          cohort.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {getStatusLabel(cohort.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(cohort)}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(cohort.id)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      {/* Cohort Form Modal */}
      <CohortFormModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        cohort={selectedCohort}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá remover permanentemente a turma
              e todos os dados associados a ela.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CohortsAdmin;
