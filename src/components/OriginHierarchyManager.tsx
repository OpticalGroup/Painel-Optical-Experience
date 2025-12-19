import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
    Plus,
    Pencil,
    Trash2,
    ChevronRight,
    Layers,
    Target,
    Crosshair,
    GitBranch,
    Loader2,
    Check,
    X
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
    useFunnels,
    useCreateFunnel,
    useUpdateFunnel,
    useDeleteFunnel,
    useMacroOrigins,
    useCreateMacroOrigin,
    useUpdateMacroOrigin,
    useDeleteMacroOrigin,
    useMicroOrigins,
    useCreateMicroOrigin,
    useUpdateMicroOrigin,
    useDeleteMicroOrigin,
    useMicroVariations,
    useCreateMicroVariation,
    useUpdateMicroVariation,
    useDeleteMicroVariation,
    Funnel,
    MacroOrigin,
    MicroOrigin,
    MicroVariation,
} from "@/integrations/supabase/hooks/useOriginHierarchy";

type HierarchyLevel = 'funnel' | 'macro' | 'micro' | 'variation';

interface EditingItem {
    type: HierarchyLevel;
    item?: Funnel | MacroOrigin | MicroOrigin | MicroVariation;
    parentId?: string;
}

export const OriginHierarchyManager = () => {
    const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: HierarchyLevel; id: string; name: string } | null>(null);

    // Form state
    const [formName, setFormName] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formActive, setFormActive] = useState(true);

    // Queries
    const { data: funnels = [], isLoading: funnelsLoading } = useFunnels();
    const { data: macroOrigins = [] } = useMacroOrigins();
    const { data: microOrigins = [] } = useMicroOrigins();
    const { data: microVariations = [] } = useMicroVariations();

    // Mutations
    const createFunnel = useCreateFunnel();
    const updateFunnel = useUpdateFunnel();
    const deleteFunnel = useDeleteFunnel();
    const createMacroOrigin = useCreateMacroOrigin();
    const updateMacroOrigin = useUpdateMacroOrigin();
    const deleteMacroOrigin = useDeleteMacroOrigin();
    const createMicroOrigin = useCreateMicroOrigin();
    const updateMicroOrigin = useUpdateMicroOrigin();
    const deleteMicroOrigin = useDeleteMicroOrigin();
    const createMicroVariation = useCreateMicroVariation();
    const updateMicroVariation = useUpdateMicroVariation();
    const deleteMicroVariation = useDeleteMicroVariation();

    const openCreateModal = (type: HierarchyLevel, parentId?: string) => {
        setEditingItem({ type, parentId });
        setFormName("");
        setFormDescription("");
        setFormActive(true);
    };

    const openEditModal = (type: HierarchyLevel, item: any) => {
        setEditingItem({ type, item });
        setFormName(item.name);
        setFormDescription(item.description || "");
        setFormActive(item.active);
    };

    const closeModal = () => {
        setEditingItem(null);
        setFormName("");
        setFormDescription("");
        setFormActive(true);
    };

    const handleSave = async () => {
        if (!editingItem || !formName.trim()) return;

        try {
            const data = {
                name: formName.trim(),
                description: formDescription.trim() || null,
                active: formActive,
            };

            if (editingItem.item) {
                // Update
                switch (editingItem.type) {
                    case 'funnel':
                        await updateFunnel.mutateAsync({ id: editingItem.item.id, ...data });
                        break;
                    case 'macro':
                        await updateMacroOrigin.mutateAsync({ id: editingItem.item.id, ...data });
                        break;
                    case 'micro':
                        await updateMicroOrigin.mutateAsync({ id: editingItem.item.id, ...data });
                        break;
                    case 'variation':
                        await updateMicroVariation.mutateAsync({ id: editingItem.item.id, ...data });
                        break;
                }
                toast({ title: "Atualizado com sucesso!" });
            } else {
                // Create
                switch (editingItem.type) {
                    case 'funnel':
                        await createFunnel.mutateAsync(data);
                        break;
                    case 'macro':
                        await createMacroOrigin.mutateAsync({ ...data, funnel_id: editingItem.parentId! });
                        break;
                    case 'micro':
                        await createMicroOrigin.mutateAsync({ ...data, macro_origin_id: editingItem.parentId! });
                        break;
                    case 'variation':
                        await createMicroVariation.mutateAsync({ ...data, micro_origin_id: editingItem.parentId! });
                        break;
                }
                toast({ title: "Criado com sucesso!" });
            }
            closeModal();
        } catch (error: any) {
            toast({
                title: "Erro ao salvar",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;

        try {
            switch (deleteConfirm.type) {
                case 'funnel':
                    await deleteFunnel.mutateAsync(deleteConfirm.id);
                    break;
                case 'macro':
                    await deleteMacroOrigin.mutateAsync(deleteConfirm.id);
                    break;
                case 'micro':
                    await deleteMicroOrigin.mutateAsync(deleteConfirm.id);
                    break;
                case 'variation':
                    await deleteMicroVariation.mutateAsync(deleteConfirm.id);
                    break;
            }
            toast({ title: "Excluído com sucesso!" });
            setDeleteConfirm(null);
        } catch (error: any) {
            toast({
                title: "Erro ao excluir",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const getModalTitle = () => {
        if (!editingItem) return "";
        const action = editingItem.item ? "Editar" : "Criar";
        switch (editingItem.type) {
            case 'funnel': return `${action} Funil`;
            case 'macro': return `${action} Origem Macro`;
            case 'micro': return `${action} Origem Micro`;
            case 'variation': return `${action} Variação`;
        }
    };

    const getLevelIcon = (type: HierarchyLevel) => {
        switch (type) {
            case 'funnel': return <Layers className="h-4 w-4" />;
            case 'macro': return <Target className="h-4 w-4" />;
            case 'micro': return <Crosshair className="h-4 w-4" />;
            case 'variation': return <GitBranch className="h-4 w-4" />;
        }
    };

    const getLevelColor = (type: HierarchyLevel) => {
        switch (type) {
            case 'funnel': return "bg-purple-500/20 text-purple-400 border-purple-500/30";
            case 'macro': return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            case 'micro': return "bg-teal-500/20 text-teal-400 border-teal-500/30";
            case 'variation': return "bg-orange-500/20 text-orange-400 border-orange-500/30";
        }
    };

    if (funnelsLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="h-5 w-5 text-primary" />
                                Hierarquia de Origens
                            </CardTitle>
                            <CardDescription>
                                Gerencie funis, origens macro, origens micro e variações
                            </CardDescription>
                        </div>
                        <Button onClick={() => openCreateModal('funnel')} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Novo Funil
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                        {funnels.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Nenhum funil cadastrado.</p>
                                <p className="text-sm">Clique em "Novo Funil" para começar.</p>
                            </div>
                        ) : (
                            <Accordion type="multiple" className="space-y-2">
                                {funnels.map((funnel) => {
                                    const funnelMacros = macroOrigins.filter(m => m.funnel_id === funnel.id);

                                    return (
                                        <AccordionItem key={funnel.id} value={funnel.id} className="border rounded-lg px-4">
                                            <AccordionTrigger className="hover:no-underline">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <Badge className={getLevelColor('funnel')}>
                                                        {getLevelIcon('funnel')}
                                                    </Badge>
                                                    <span className="font-semibold">{funnel.name}</span>
                                                    {!funnel.active && (
                                                        <Badge variant="outline" className="text-xs">Inativo</Badge>
                                                    )}
                                                    <Badge variant="secondary" className="ml-auto mr-4">
                                                        {funnelMacros.length} macro(s)
                                                    </Badge>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="pl-4 border-l-2 border-border ml-2 space-y-3 py-2">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openCreateModal('macro', funnel.id)}
                                                            className="gap-1"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            Origem Macro
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditModal('funnel', funnel)}
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setDeleteConfirm({ type: 'funnel', id: funnel.id, name: funnel.name })}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>

                                                    {funnelMacros.map((macro) => {
                                                        const macroMicros = microOrigins.filter(m => m.macro_origin_id === macro.id);

                                                        return (
                                                            <div key={macro.id} className="pl-4 border-l-2 border-border/50">
                                                                <div className="flex items-center gap-2 py-1">
                                                                    <Badge className={getLevelColor('macro')}>
                                                                        {getLevelIcon('macro')}
                                                                    </Badge>
                                                                    <span>{macro.name}</span>
                                                                    {!macro.active && (
                                                                        <Badge variant="outline" className="text-xs">Inativo</Badge>
                                                                    )}
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 ml-auto"
                                                                        onClick={() => openCreateModal('micro', macro.id)}
                                                                    >
                                                                        <Plus className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6"
                                                                        onClick={() => openEditModal('macro', macro)}
                                                                    >
                                                                        <Pencil className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 text-destructive hover:text-destructive"
                                                                        onClick={() => setDeleteConfirm({ type: 'macro', id: macro.id, name: macro.name })}
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>

                                                                {macroMicros.map((micro) => {
                                                                    const microVars = microVariations.filter(v => v.micro_origin_id === micro.id);

                                                                    return (
                                                                        <div key={micro.id} className="pl-6 border-l border-border/30">
                                                                            <div className="flex items-center gap-2 py-1">
                                                                                <Badge className={getLevelColor('micro')}>
                                                                                    {getLevelIcon('micro')}
                                                                                </Badge>
                                                                                <span className="text-sm">{micro.name}</span>
                                                                                {!micro.active && (
                                                                                    <Badge variant="outline" className="text-xs">Inativo</Badge>
                                                                                )}
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-5 w-5 ml-auto"
                                                                                    onClick={() => openCreateModal('variation', micro.id)}
                                                                                >
                                                                                    <Plus className="h-3 w-3" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-5 w-5"
                                                                                    onClick={() => openEditModal('micro', micro)}
                                                                                >
                                                                                    <Pencil className="h-3 w-3" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-5 w-5 text-destructive hover:text-destructive"
                                                                                    onClick={() => setDeleteConfirm({ type: 'micro', id: micro.id, name: micro.name })}
                                                                                >
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>

                                                                            {microVars.map((variation) => (
                                                                                <div key={variation.id} className="pl-8 flex items-center gap-2 py-0.5">
                                                                                    <Badge className={getLevelColor('variation')}>
                                                                                        {getLevelIcon('variation')}
                                                                                    </Badge>
                                                                                    <span className="text-xs">{variation.name}</span>
                                                                                    {!variation.active && (
                                                                                        <Badge variant="outline" className="text-xs">Inativo</Badge>
                                                                                    )}
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="h-5 w-5 ml-auto"
                                                                                        onClick={() => openEditModal('variation', variation)}
                                                                                    >
                                                                                        <Pencil className="h-3 w-3" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="h-5 w-5 text-destructive hover:text-destructive"
                                                                                        onClick={() => setDeleteConfirm({ type: 'variation', id: variation.id, name: variation.name })}
                                                                                    >
                                                                                        <Trash2 className="h-3 w-3" />
                                                                                    </Button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Create/Edit Modal */}
            <Dialog open={!!editingItem} onOpenChange={() => closeModal()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {editingItem && getLevelIcon(editingItem.type)}
                            {getModalTitle()}
                        </DialogTitle>
                        <DialogDescription>
                            {editingItem?.item ? "Edite os dados abaixo" : "Preencha os dados para criar um novo item"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome *</Label>
                            <Input
                                id="name"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="Digite o nome"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                placeholder="Descrição opcional"
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="active"
                                checked={formActive}
                                onChange={(e) => setFormActive(e.target.checked)}
                                className="rounded border-input"
                            />
                            <Label htmlFor="active">Ativo</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeModal}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={!formName.trim()}>
                            {editingItem?.item ? "Salvar" : "Criar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Confirmar Exclusão</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir "{deleteConfirm?.name}"?
                            {deleteConfirm?.type === 'funnel' && " Isso também excluirá todas as origens macro, micro e variações associadas."}
                            {deleteConfirm?.type === 'macro' && " Isso também excluirá todas as origens micro e variações associadas."}
                            {deleteConfirm?.type === 'micro' && " Isso também excluirá todas as variações associadas."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Excluir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
