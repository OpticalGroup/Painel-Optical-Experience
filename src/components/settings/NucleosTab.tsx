import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, LayoutGrid } from "lucide-react";
import { useNucleosQuery, useDeleteNucleo } from "@/integrations/supabase/hooks/useNucleos";
import { NucleoDialog } from "./NucleoDialog";
import { useToast } from "@/hooks/use-toast";
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
import type { Tables } from "@/integrations/supabase/types";

type Nucleo = Tables<'nucleos'>;

export const NucleosTab = () => {
    const { data: nucleos, isLoading } = useNucleosQuery();
    const deleteNucleo = useDeleteNucleo();
    const { toast } = useToast();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingNucleo, setEditingNucleo] = useState<Nucleo | null>(null);
    const [deletingNucleo, setDeletingNucleo] = useState<Nucleo | null>(null);

    const handleEdit = (nucleo: Nucleo) => {
        setEditingNucleo(nucleo);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingNucleo(null);
        setIsDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingNucleo) return;

        try {
            await deleteNucleo.mutateAsync(deletingNucleo.id);
        } catch (error: any) {
            toast({
                title: "Erro ao excluir núcleo",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setDeletingNucleo(null);
        }
    };

    if (isLoading) {
        return <div>Carregando núcleos...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-medium">Núcleos</h2>
                    <p className="text-sm text-muted-foreground">
                        Gerencie os núcleos (departamentos) da empresa
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Núcleo
                </Button>
            </div>

            <div className="border rounded-lg">
                <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 font-medium text-sm">
                    <div className="col-span-1">Ícone</div>
                    <div className="col-span-5">Nome</div>
                    <div className="col-span-4">Status</div>
                    <div className="col-span-2 text-right">Ações</div>
                </div>

                <div className="divide-y">
                    {nucleos?.map((nucleo) => (
                        <div key={nucleo.id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm">
                            <div className="col-span-1">
                                <div 
                                    className="w-8 h-8 rounded flex items-center justify-center text-white"
                                    style={{ backgroundColor: nucleo.color || '#666' }}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="col-span-5 font-medium">{nucleo.name}</div>
                            <div className="col-span-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${nucleo.active
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                    }`}>
                                    {nucleo.active ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                            <div className="col-span-2 flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(nucleo)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setDeletingNucleo(nucleo)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {(!nucleos || nucleos.length === 0) && (
                        <div className="p-8 text-center text-muted-foreground">
                            Nenhum núcleo cadastrado.
                        </div>
                    )}
                </div>
            </div>

            <NucleoDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                nucleo={editingNucleo}
            />

            <AlertDialog open={!!deletingNucleo} onOpenChange={(open) => !open && setDeletingNucleo(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o núcleo
                            "{deletingNucleo?.name}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};