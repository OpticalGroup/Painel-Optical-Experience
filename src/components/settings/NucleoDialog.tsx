import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCreateNucleo, useUpdateNucleo } from "@/integrations/supabase/hooks/useNucleos";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Nucleo = Tables<'nucleos'>;

interface NucleoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    nucleo?: Nucleo | null;
}

export const NucleoDialog = ({ open, onOpenChange, nucleo }: NucleoDialogProps) => {
    const [name, setName] = useState("");
    const [icon, setIcon] = useState("");
    const [color, setColor] = useState("#000000");
    const [active, setActive] = useState<boolean>(true);

    const createNucleo = useCreateNucleo();
    const updateNucleo = useUpdateNucleo();
    const { toast } = useToast();

    useEffect(() => {
        if (nucleo) {
            setName(nucleo.name);
            setIcon(nucleo.icon || "");
            setColor(nucleo.color || "#000000");
            setActive(nucleo.active);
        } else {
            setName("");
            setIcon("");
            setColor("#000000");
            setActive(true);
        }
    }, [nucleo, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (nucleo) {
                await updateNucleo.mutateAsync({
                    id: nucleo.id,
                    name,
                    icon,
                    color,
                    active
                });
            } else {
                await createNucleo.mutateAsync({
                    name,
                    icon,
                    color,
                    active
                });
            }
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Erro ao salvar núcleo",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{nucleo ? "Editar Núcleo" : "Novo Núcleo"}</DialogTitle>
                    <DialogDescription>
                        {nucleo ? "Atualize as informações do núcleo" : "Preencha as informações para criar um novo núcleo"}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome do Núcleo *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Comercial, Operacional"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="icon">Ícone (nome da Lucide)</Label>
                        <Input
                            id="icon"
                            value={icon}
                            onChange={(e) => setIcon(e.target.value)}
                            placeholder="Ex: users, briefcase"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="color">Cor</Label>
                        <div className="flex gap-2">
                            <Input
                                id="color"
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-12 h-10 p-1"
                            />
                            <Input
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                placeholder="#000000"
                            />
                        </div>
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
                        <Button type="submit" disabled={createNucleo.isPending || updateNucleo.isPending}>
                            {nucleo ? "Salvar Alterações" : "Criar Núcleo"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};