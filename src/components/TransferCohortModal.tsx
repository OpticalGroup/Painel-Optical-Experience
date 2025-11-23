import { useState } from "react";
import { logAuditAction } from "@/lib/audit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCohortsQuery } from "@/integrations/supabase/hooks/useCohorts";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TransferCohortModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollmentIds: string[];
  studentName?: string; // Optional, used for single selection
  currentCohortId?: string; // Optional if mixed cohorts (though UI usually implies same context, but bulk list might be mixed)
  currentCohortName?: string;
}

export const TransferCohortModal = ({
  open,
  onOpenChange,
  enrollmentIds,
  studentName,
  currentCohortId,
  currentCohortName,
}: TransferCohortModalProps) => {
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const [transferReason, setTransferReason] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: cohorts, isLoading } = useCohortsQuery();

  // Filtrar turmas disponíveis (excluir turma atual e turmas completas)
  // Note: For bulk, if students are from different cohorts, currentCohortId might be undefined or one of them.
  // We'll just filter out completed/cancelled and let user pick any valid target.
  const availableCohorts = cohorts?.filter(
    (c) =>
      (currentCohortId ? c.id !== currentCohortId : true) &&
      c.status !== "completed" &&
      c.status !== "cancelled"
    // Allow full cohorts for waitlist transfer
    // && (c.stats?.available_spots || 0) > 0
  );

  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCohortId) {
        throw new Error("Selecione uma turma de destino");
      }

      if (enrollmentIds.length === 0) return;

      const updateData = {
        cohort_id: selectedCohortId,
        observations: transferReason
          ? `TRANSFERIDO ${currentCohortName ? `DE ${currentCohortName}` : ''} - Motivo: ${transferReason}. ${new Date().toLocaleDateString()}`
          : `TRANSFERIDO ${currentCohortName ? `DE ${currentCohortName}` : ''} em ${new Date().toLocaleDateString()}`
      };

      // Bulk update
      const { error: updateError } = await supabase
        .from("enrollments")
        .update(updateData)
        .in("id", enrollmentIds);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      logAuditAction({
        action: 'enrollment.transfer',
        entityId: enrollmentIds.join(','),
        entityType: 'enrollment',
        beforeData: { cohortId: currentCohortId },
        afterData: { cohortId: selectedCohortId, reason: transferReason },
      });

      queryClient.invalidateQueries({ queryKey: ["cohort"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["cohorts"] });

      const description = enrollmentIds.length === 1
        ? `${studentName || 'Aluno'} foi transferido com sucesso`
        : `${enrollmentIds.length} alunos foram transferidos com sucesso`;

      toast({
        title: "Transferência concluída",
        description,
      });

      onOpenChange(false);
      setSelectedCohortId("");
      setTransferReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na transferência",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTransfer = () => {
    transferMutation.mutate();
  };

  const isBulk = enrollmentIds.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transferir de Turma</DialogTitle>
          <DialogDescription>
            {isBulk
              ? `Transferir ${enrollmentIds.length} alunos selecionados para outra turma`
              : `Transferir ${studentName || 'aluno'} para outra turma`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Turma Atual (Only show if single or known context) */}
          {currentCohortName && (
            <div>
              <Label>Turma Atual</Label>
              <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                {currentCohortName}
              </div>
            </div>
          )}

          {/* Seletor de Nova Turma */}
          <div>
            <Label htmlFor="new-cohort">Nova Turma *</Label>
            <Select value={selectedCohortId} onValueChange={setSelectedCohortId}>
              <SelectTrigger id="new-cohort" className="mt-2">
                <SelectValue placeholder="Selecione a turma de destino" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>
                    Carregando turmas...
                  </SelectItem>
                ) : availableCohorts?.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhuma turma disponível
                  </SelectItem>
                ) : (
                  availableCohorts?.map((cohort) => (
                    <SelectItem key={cohort.id} value={cohort.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{cohort.name}</span>
                        <span className="text-xs text-muted-foreground ml-4">
                          {cohort.stats?.available_spots} vagas
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedCohortId && cohorts?.find(c => c.id === selectedCohortId)?.stats?.available_spots! <= 0 && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-yellow-600 text-sm mt-2">
                <strong>Atenção:</strong> A turma de destino está lotada. O aluno será transferido para a <strong>Lista de Espera</strong>.
              </div>
            )}
          </div>

          {/* Arrow indicator */}
          {selectedCohortId && (
            <div className="flex items-center justify-center text-muted-foreground">
              <ArrowRight className="h-5 w-5" />
            </div>
          )}

          {/* Motivo da Transferência */}
          <div>
            <Label htmlFor="reason">Motivo da Transferência (opcional)</Label>
            <Textarea
              id="reason"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="Ex: Conflito de horários, mudança de cidade, reagendamento..."
              className="mt-2 min-h-[80px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {transferReason.length}/500 caracteres
            </p>
          </div>

          {/* Warning */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Atenção:</strong> Esta ação irá mover {isBulk ? 'os alunos' : 'o aluno'} para a nova turma.
              Vagas serão liberadas na turma atual e ocupadas na turma de destino.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={transferMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!selectedCohortId || transferMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {transferMutation.isPending ? "Transferindo..." : "Confirmar Transferência"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
