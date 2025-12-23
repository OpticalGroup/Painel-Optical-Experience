import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    const [price, setPrice] = useState<string>("");
    const [status, setStatus] = useState<string>("active");

    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const { toast } = useToast();

    useEffect(() => {
        if (product) {
            setName(product.name);
            setPrice(product.price?.toString() || "");
            setStatus(product.status || "active");
        } else {
            setName("");
            setPrice("");
            setStatus("active");
        }
    }, [product, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const priceValue = price ? parseFloat(price) : null;

        try {
            if (product) {
                await updateProduct.mutateAsync({
                    id: product.id,
                    name,
                    price: priceValue,
                    status
                });
                toast({ title: "Produto atualizado com sucesso!" });
            } else {
                await createProduct.mutateAsync({
                    name,
                    price: priceValue ?? undefined,
                    status
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
                        <Label htmlFor="price">Preço (R$)</Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Ex: 2000.00"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Ativo</SelectItem>
                                <SelectItem value="inactive">Inativo</SelectItem>
                                <SelectItem value="draft">Rascunho</SelectItem>
                            </SelectContent>
                        </Select>
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
