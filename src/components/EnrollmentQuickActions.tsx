import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, CheckCircle, FileSignature, XCircle, RefreshCw, Send, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSendToClickSign } from "@/integrations/supabase/hooks/useSendToClickSign";
import { useCancelEnrollment } from "@/integrations/supabase/hooks/useEnrollments";
import { CancellationModal } from "@/components/CancellationModal";

interface EnrollmentQuickActionsProps {
  enrollmentId: string;
  currentFinancialStatus: string;
  currentContractStatus: string;
  cohortId: string;
  studentName: string;
  clicksignDocumentId?: string | null;
  onTransferClick: () => void;
  isCancelled?: boolean;
}

export const EnrollmentQuickActions = ({
  enrollmentId,
  currentFinancialStatus,
  currentContractStatus,
  cohortId,
  studentName,
  clicksignDocumentId,
  onTransferClick,
  isCancelled = false,
}: EnrollmentQuickActionsProps) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sendToClickSign = useSendToClickSign();
  const cancelEnrollment = useCancelEnrollment();

  // Marcar como pago
  const markAsPaidMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("enrollments")
        .update({
          financial_status: "paid",
          purchase_date: new Date().toISOString().split('T')[0]
        })
        .eq("id", enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cohort", cohortId] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["cohorts"] });
      setDropdownOpen(false);
      toast({
        title: "Status atualizado",
        description: `${studentName} marcado como PAGO`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Marcar como assinado
  const markAsSignedMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("enrollments")
        .update({
          contract_status: "signed",
          submitted_at: new Date().toISOString()
        })
        .eq("id", enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cohort", cohortId] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["cohorts"] });
      setDropdownOpen(false);
      toast({
        title: "Contrato assinado",
        description: `Contrato de ${studentName} registrado como ASSINADO`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCancelConfirm = (reason: string, details: string) => {
    cancelEnrollment.mutate({
      id: enrollmentId,
      cohort_id: cohortId,
      reason,
      details,
    }, {
      onSuccess: () => {
        setShowCancelModal(false);
      }
    });
  };

  const isPaid = currentFinancialStatus === "paid";
  const isSigned = currentContractStatus === "signed";
  const alreadySentToClickSign = !!clicksignDocumentId;

  const isAnyActionPending =
    markAsPaidMutation.isPending ||
    markAsSignedMutation.isPending ||
    sendToClickSign.isPending ||
    cancelEnrollment.isPending;

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isAnyActionPending || isCancelled}
            className={isCancelled ? "opacity-50 cursor-not-allowed" : ""}
          >
            {isAnyActionPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-card z-50">
          <DropdownMenuLabel>Ações Rápidas</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {!isPaid && (
            <DropdownMenuItem
              onClick={() => markAsPaidMutation.mutate()}
              disabled={markAsPaidMutation.isPending}
            >
              {markAsPaidMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2 text-primary" />
              )}
              Marcar como Pago
            </DropdownMenuItem>
          )}

          {!isSigned && !alreadySentToClickSign && (
            <DropdownMenuItem
              onClick={() => {
                sendToClickSign.mutate(enrollmentId);
                setDropdownOpen(false);
              }}
              disabled={sendToClickSign.isPending}
            >
              {sendToClickSign.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2 text-primary" />
              )}
              Enviar para Assinatura
            </DropdownMenuItem>
          )}

          {!isSigned && (
            <DropdownMenuItem
              onClick={() => markAsSignedMutation.mutate()}
              disabled={markAsSignedMutation.isPending}
            >
              {markAsSignedMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSignature className="h-4 w-4 mr-2 text-secondary-foreground" />
              )}
              Registrar Assinatura Manual
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => {
              onTransferClick();
              setDropdownOpen(false);
            }}
            disabled={isAnyActionPending}
          >
            <RefreshCw className="h-4 w-4 mr-2 text-muted-foreground" />
            Transferir de Turma
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => {
              setShowCancelModal(true);
              setDropdownOpen(false);
            }}
            className="text-destructive focus:text-destructive"
            disabled={isAnyActionPending}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancelar Matrícula
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CancellationModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        onConfirm={handleCancelConfirm}
        isPending={cancelEnrollment.isPending}
        studentName={studentName}
      />
    </>
  );
};
