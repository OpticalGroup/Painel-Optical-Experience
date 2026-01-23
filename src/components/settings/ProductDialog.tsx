import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCreateProduct, useUpdateProduct } from "@/integrations/supabase/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<'products'>;

interface ProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product?: Product | null;
}

export const ProductDialog = ({ open, onOpenChange, product }: ProductDialogProps) => {
    const [name, setName] = useState("");
    const [ticketMedio, setTicketMedio] = useState<string>("");
    const [active, setActive] = useState<boolean>(true);

    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const { toast } = useToast();

    useEffect(() => {
        if (product) {
            setName(product.name);
            setTicketMedio(product.ticket_medio?.toString() || "");
            setActive(product.active ?? true);
        } else {
            setName("");
            setTicketMedio("");
            setActive(true);
        }
    }, [product, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const ticketMedioValue = ticketMedio ? parseFloat(ticketMedio) : null;

        try {
            if (product) {
                await updateProduct.mutateAsync({
                    id: product.id,
                    name,
                    ticket_medio: ticketMedioValue,
                    active,
                });
                toast({ title: "Produto atualizado com sucesso!" });
            } else {
                await createProduct.mutateAsync({
                    name,
                    ticket_medio: ticketMedioValue ?? undefined,
                    active,
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
                    <DialogDescription>
                        {product ? "Atualize as informações do produto" : "Preencha as informações para criar um novo produto"}
                    </DialogDescription>
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
                        <Label htmlFor="ticket_medio">Ticket Médio (R$)</Label>
                        <Input
                            id="ticket_medio"
                            type="number"
                            step="0.01"
                            min="0"
                            value={ticketMedio}
                            onChange={(e) => setTicketMedio(e.target.value)}
                            placeholder="Ex: 2000.00"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="active"
                            checked={active}
                            onCheckedChange={setActive}
                        />
                        <Label htmlFor="active" className="cursor-pointer">Ativo</Label>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                            {product ? "Salvar Alterações" : "Criar Produto"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
