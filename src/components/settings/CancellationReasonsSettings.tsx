import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCancellationReasons, CancellationReason } from "@/integrations/supabase/hooks/useCancellationReasons";

export const CancellationReasonsSettings = () => {
    const { reasons, isLoading, updateReasons } = useCancellationReasons();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedReason, setSelectedReason] = useState<CancellationReason | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [reasonToDelete, setReasonToDelete] = useState<string | null>(null);
    const [formData, setFormData] = useState({ label: "", active: true });

    const handleEdit = (reason: CancellationReason) => {
        setSelectedReason(reason);
        setFormData({
            label: reason.label,
            active: reason.active,
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.label.trim()) return;

        let newReasons = [...reasons];

        if (selectedReason) {
            newReasons = newReasons.map(r =>
                r.id === selectedReason.id
                    ? { ...r, label: formData.label, active: formData.active }
                    : r
            );
        } else {
            newReasons.push({
                id: crypto.randomUUID(),
                label: formData.label,
                active: formData.active,
            });
        }

        await updateReasons.mutateAsync(newReasons);
        setModalOpen(false);
        setSelectedReason(null);
        setFormData({ label: "", active: true });
    };

    const handleDelete = async () => {
        if (reasonToDelete) {
            const newReasons = reasons.filter(r => r.id !== reasonToDelete);
            await updateReasons.mutateAsync(newReasons);
            setDeleteDialogOpen(false);
            setReasonToDelete(null);
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                    Gerenciar motivos de cancelamento disponíveis
                </p>
                <Button
                    onClick={() => {
                        setSelectedReason(null);
                        setFormData({ label: "", active: true });
                        setModalOpen(true);
                    }}
                    className="bg-primary hover:bg-primary/90"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Motivo
                </Button>
            </div>

            <div className="rounded-md border border-border bg-card shadow-sm">
                {isLoading ? (
                    <div className="p-8 space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold text-foreground">Motivo</TableHead>
                                <TableHead className="font-semibold text-foreground">Status</TableHead>
                                <TableHead className="font-semibold text-foreground">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reasons.map((reason) => (
                                <TableRow key={reason.id} className="hover:bg-muted/50">
                                    <TableCell className="font-medium">{reason.label}</TableCell>
                                    <TableCell>
                                        <Badge variant={reason.active ? "default" : "secondary"}>
                                            {reason.active ? "Ativo" : "Inativo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(reason)}
                                                className="hover:bg-primary/10 hover:text-primary"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setReasonToDelete(reason.id);
                                                    setDeleteDialogOpen(true);
                                                }}
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

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-primary">
                            {selectedReason ? "Editar Motivo" : "Novo Motivo"}
                        </DialogTitle>
                        <DialogDescription>
                            Defina o motivo de cancelamento
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="label">Motivo *</Label>
                            <Input
                                id="label"
                                value={formData.label}
                                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                className="focus:border-[#D6CDC8]"
                                maxLength={50}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="active"
                                checked={formData.active}
                                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                            />
                            <Label htmlFor="active" className="cursor-pointer">Ativo</Label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-primary hover:bg-primary/90"
                                disabled={updateReasons.isPending}
                            >
                                {selectedReason ? "Atualizar" : "Criar"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso irá remover permanentemente este motivo.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
