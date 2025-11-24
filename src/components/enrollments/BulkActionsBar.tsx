import { Button } from "@/components/ui/button";
import { CheckCircle, FileSignature, Loader2, RefreshCw, Send, Trash2, X, XCircle } from "lucide-react";

interface BulkActionsBarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onDelete: () => void;
    onMarkAsPaid: () => void;
    onMarkAsSigned?: () => void;
    onSendContract: () => void;
    onTransfer: () => void;
    onCancel?: () => void;
    isPending?: boolean;
}

export const BulkActionsBar = ({
    selectedCount,
    onClearSelection,
    onDelete,
    onMarkAsPaid,
    onMarkAsSigned,
    onSendContract,
    onTransfer,
    onCancel,
    isPending = false,
}: BulkActionsBarProps) => {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-foreground text-background rounded-lg shadow-lg p-4 flex items-center justify-between gap-4 min-w-[600px]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{selectedCount}</span>
                        <span className="text-sm text-muted">selecionados</span>
                    </div>
                    <div className="h-4 w-px bg-border/20" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearSelection}
                        className="text-muted hover:text-background hover:bg-muted/20 h-8"
                    >
                        <X className="h-4 w-4 mr-2" /> Limpar
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onMarkAsPaid}
                        disabled={isPending}
                        className="h-8"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Pagar
                    </Button>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onSendContract}
                        disabled={isPending}
                        className="h-8"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                        Contrato
                    </Button>

                    {onMarkAsSigned && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={onMarkAsSigned}
                            disabled={isPending}
                            className="h-8"
                        >
                            {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSignature className="h-4 w-4 mr-2" />}
                            Assinado
                        </Button>
                    )}

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onTransfer}
                        disabled={isPending}
                        className="h-8"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                        Transferir
                    </Button>

                    <div className="h-4 w-px bg-border/20 mx-2" />

                    {onCancel && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={onCancel}
                            disabled={isPending}
                            className="h-8 hover:bg-destructive/10 hover:text-destructive"
                        >
                            {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                            Cancelar
                        </Button>
                    )}

                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={onDelete}
                        disabled={isPending}
                        className="h-8"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Excluir
                    </Button>
                </div>
            </div>
        </div>
    );
};
