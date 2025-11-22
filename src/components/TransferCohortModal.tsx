import { useState } from "react";
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
  enrollmentId: string;
  studentName: string;
  currentCohortId: string;
  currentCohortName: string;
}

export const TransferCohortModal = ({
  open,
  onOpenChange,
  enrollmentId,
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
  const availableCohorts = cohorts?.filter(
    (c) => 
      c.id !== currentCohortId && 
      c.status !== "completed" && 
      c.status !== "cancelled" &&
      (c.stats?.available_spots || 0) > 0
  );

  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCohortId) {
        throw new Error("Selecione uma turma de destino");
      }

      // Atualizar cohort_id do enrollment
      const { error: updateError } = await supabase
        .from("enrollments")
        .update({ 
          cohort_id: selectedCohortId,
          observations: transferReason 
            ? `TRANSFERIDO DE ${currentCohortName} - Motivo: ${transferReason}. ${new Date().toLocaleDateString()}`
            : `TRANSFERIDO DE ${currentCohortName} em ${new Date().toLocaleDateString()}`
        })
        .eq("id", enrollmentId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cohort"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["cohorts"] });
      
      toast({
        title: "Transferência concluída",
        description: `${studentName} foi transferido com sucesso`,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transferir de Turma</DialogTitle>
          <DialogDescription>
            Transferir <strong>{studentName}</strong> para outra turma
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Turma Atual */}
          <div>
            <Label>Turma Atual</Label>
            <div className="mt-2 p-3 bg-muted rounded-md text-sm">
              {currentCohortName}
            </div>
          </div>

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
              <strong>Atenção:</strong> Esta ação irá mover o aluno para a nova turma. 
              Uma vaga será liberada na turma atual e ocupada na turma de destino.
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
