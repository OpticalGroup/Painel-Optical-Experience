import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCourse, useUpdateCourse } from "@/integrations/supabase/hooks/useCourses";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;

interface ProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product?: Course | null;
}

export const ProductDialog = ({ open, onOpenChange, product }: ProductDialogProps) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const createCourse = useCreateCourse();
    const updateCourse = useUpdateCourse();
    const { toast } = useToast();

    useEffect(() => {
        if (product) {
            setName(product.name);
            setDescription(product.description || "");
        } else {
            setName("");
            setDescription("");
        }
    }, [product, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (product) {
                await updateCourse.mutateAsync({
                    id: product.id,
                    name,
                    description: description || undefined
                });
                toast({ title: "Produto atualizado com sucesso!" });
            } else {
                await createCourse.mutateAsync({
                    name,
                    description: description || undefined
                });
                toast({ title: "Produto criado com sucesso!" });
            }
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Erro ao salvar produto",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{product ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome do Produto *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Optical Experience"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descrição opcional do produto"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={createCourse.isPending || updateCourse.isPending}>
                            {product ? "Salvar Alterações" : "Criar Produto"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
