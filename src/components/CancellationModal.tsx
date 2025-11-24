import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { useCancellationReasons } from "@/integrations/supabase/hooks/useCancellationReasons";
import { AlertTriangle } from "lucide-react";

interface CancellationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string, details: string) => void;
    isPending: boolean;
    studentName?: string;
}

export const CancellationModal = ({
    open,
    onOpenChange,
    onConfirm,
    isPending,
    studentName,
}: CancellationModalProps) => {
    const { reasons, isLoading } = useCancellationReasons();
    const [selectedReason, setSelectedReason] = useState<string>("");
    const [details, setDetails] = useState<string>("");

    const handleConfirm = () => {
        if (!selectedReason) return;
        onConfirm(selectedReason, details);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Confirmar Cancelamento
                    </DialogTitle>
                    <DialogDescription>
                        Você está prestes a cancelar a matrícula de <strong>{studentName || "este aluno"}</strong>.
                        Esta ação não pode ser desfeita facilmente.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Motivo do Cancelamento *</Label>
                        <Select value={selectedReason} onValueChange={setSelectedReason}>
                            <SelectTrigger id="reason">
                                <SelectValue placeholder="Selecione um motivo" />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoading ? (
                                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                                ) : (
                                    reasons.filter(r => r.active).map((reason) => (
                                        <SelectItem key={reason.id} value={reason.label}>
                                            {reason.label}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="details">Detalhes Adicionais (Opcional)</Label>
                        <Textarea
                            id="details"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Descreva mais detalhes sobre o cancelamento..."
                            className="resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Voltar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!selectedReason || isPending}
                    >
                        {isPending ? "Cancelando..." : "Confirmar Cancelamento"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
