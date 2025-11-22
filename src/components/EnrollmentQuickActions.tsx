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
import { MoreVertical, CheckCircle, FileSignature, XCircle, RefreshCw, Send, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSendToClickSign } from "@/integrations/supabase/hooks/useSendToClickSign";

interface EnrollmentQuickActionsProps {
  enrollmentId: string;
  currentFinancialStatus: string;
  currentContractStatus: string;
  cohortId: string;
  studentName: string;
  clicksignDocumentId?: string | null;
  onTransferClick: () => void;
}

export const EnrollmentQuickActions = ({
  enrollmentId,
  currentFinancialStatus,
  currentContractStatus,
  cohortId,
  studentName,
  clicksignDocumentId,
  onTransferClick,
}: EnrollmentQuickActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sendToClickSign = useSendToClickSign();

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

  // Cancelar matrícula
  const cancelEnrollmentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("enrollments")
        .delete()
        .eq("id", enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cohort", cohortId] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["cohorts"] });
      toast({
        title: "Matrícula cancelada",
        description: `Matrícula de ${studentName} foi removida`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cancelar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isPaid = currentFinancialStatus === "paid";
  const isSigned = currentContractStatus === "signed";
  const alreadySentToClickSign = !!clicksignDocumentId;
  
  const isAnyActionPending = 
    markAsPaidMutation.isPending || 
    markAsSignedMutation.isPending || 
    sendToClickSign.isPending || 
    cancelEnrollmentMutation.isPending;

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            disabled={isAnyActionPending}
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
              setShowDeleteDialog(true);
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

      {/* Dialog de confirmação de cancelamento */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a matrícula de <strong>{studentName}</strong>?
              <br /><br />
              Esta ação não pode ser desfeita. O aluno será removido da turma e a vaga ficará disponível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter matrícula</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                cancelEnrollmentMutation.mutate();
                setShowDeleteDialog(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={cancelEnrollmentMutation.isPending}
            >
              {cancelEnrollmentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Sim, cancelar matrícula'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
