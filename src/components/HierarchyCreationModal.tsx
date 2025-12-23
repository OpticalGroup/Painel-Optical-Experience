import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Layers, Target, Crosshair, GitBranch, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Interface for items to create
export interface HierarchyItemToCreate {
    type: 'funnel' | 'macro' | 'micro' | 'microVar' | 'nano';
    name: string;
    parentName?: string; // Nome do pai para referência visual
}

interface BatchHierarchyModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemsToCreate: HierarchyItemToCreate[];
    onComplete: () => void;
    onSkip: () => void;
}

// Config for each level
const LEVEL_CONFIG = {
    funnel: { label: 'Funil', icon: Layers, color: 'bg-purple-500/20 text-purple-400', table: 'funnels' },
    macro: { label: 'Origem Macro', icon: Target, color: 'bg-blue-500/20 text-blue-400', table: 'macro_origins' },
    micro: { label: 'Origem Micro', icon: Crosshair, color: 'bg-teal-500/20 text-teal-400', table: 'micro_origins' },
    microVar: { label: 'Variação Micro', icon: GitBranch, color: 'bg-orange-500/20 text-orange-400', table: 'micro_variations' },
    nano: { label: 'Variação Nano', icon: Sparkles, color: 'bg-pink-500/20 text-pink-400', table: 'nano_variations' },
};

export const HierarchyCreationModal = ({
    open,
    onOpenChange,
    itemsToCreate,
    onComplete,
    onSkip,
}: BatchHierarchyModalProps) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set((itemsToCreate || []).map((_, i) => String(i))));
    const [createdCount, setCreatedCount] = useState(0);

    // Update selected items when itemsToCreate changes
    useEffect(() => {
        if (itemsToCreate) {
            setSelectedItems(new Set(itemsToCreate.map((_, i) => String(i))));
        }
    }, [itemsToCreate]);

    const toggleItem = (index: number) => {
        const key = String(index);
        const newSet = new Set(selectedItems);
        if (newSet.has(key)) {
            newSet.delete(key);
        } else {
            newSet.add(key);
        }
        setSelectedItems(newSet);
    };

    const toggleAll = () => {
        if (!itemsToCreate || itemsToCreate.length === 0) return;
        if (selectedItems.size === itemsToCreate.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(itemsToCreate.map((_, i) => String(i))));
        }
    };

    const handleCreateAll = async () => {
        if (!itemsToCreate) return;
        setIsProcessing(true);
        setCreatedCount(0);

        try {
            // Separate items by type
            const funnels = itemsToCreate.filter((item, i) => item.type === 'funnel' && selectedItems.has(String(i)));
            const macros = itemsToCreate.filter((item, i) => item.type === 'macro' && selectedItems.has(String(i)));
            const micros = itemsToCreate.filter((item, i) => item.type === 'micro' && selectedItems.has(String(i)));
            const microVars = itemsToCreate.filter((item, i) => item.type === 'microVar' && selectedItems.has(String(i)));
            const nanos = itemsToCreate.filter((item, i) => item.type === 'nano' && selectedItems.has(String(i)));

            let created = 0;

            // 1. Create Funnels (no parent needed)
            if (funnels.length > 0) {
                const uniqueNames = [...new Set(funnels.map(f => f.name))];

                // Check existing
                const { data: existing } = await (supabase as any)
                    .from('funnels')
                    .select('name')
                    .in('name', uniqueNames);

                const existingNames = new Set(existing?.map((e: any) => e.name) || []);
                const toCreate = uniqueNames.filter(name => !existingNames.has(name));

                if (toCreate.length > 0) {
                    await (supabase as any)
                        .from('funnels')
                        .insert(toCreate.map(name => ({ name, active: true })));
                    created += toCreate.length;
                }
            }
            setCreatedCount(created);

            // 2. Create Macro Origins (need funnel_id)
            if (macros.length > 0) {
                // Get all funnels to map names to IDs
                const { data: allFunnels } = await (supabase as any)
                    .from('funnels')
                    .select('id, name');

                const funnelMap = new Map(allFunnels?.map((f: any) => [f.name, f.id]) || []);

                const uniqueMacros = [...new Map(macros.map(m => [`${m.name}|${m.parentName}`, m])).values()];

                // Check existing
                const { data: existingMacros } = await (supabase as any)
                    .from('macro_origins')
                    .select('name');

                const existingNames = new Set(existingMacros?.map((e: any) => e.name) || []);

                const toCreate = uniqueMacros
                    .filter(m => !existingNames.has(m.name))
                    .map(m => ({
                        name: m.name,
                        funnel_id: funnelMap.get(m.parentName),
                        active: true
                    }))
                    .filter(m => m.funnel_id); // Only if parent exists

                if (toCreate.length > 0) {
                    await (supabase as any)
                        .from('macro_origins')
                        .insert(toCreate);
                    created += toCreate.length;
                }
            }
            setCreatedCount(created);

            // 3. Create Micro Origins (need macro_origin_id)
            if (micros.length > 0) {
                const { data: allMacros } = await (supabase as any)
                    .from('macro_origins')
                    .select('id, name');

                const macroMap = new Map(allMacros?.map((m: any) => [m.name, m.id]) || []);

                const uniqueMicros = [...new Map(micros.map(m => [`${m.name}|${m.parentName}`, m])).values()];

                const { data: existingMicros } = await (supabase as any)
                    .from('micro_origins')
                    .select('name');

                const existingNames = new Set(existingMicros?.map((e: any) => e.name) || []);

                const toCreate = uniqueMicros
                    .filter(m => !existingNames.has(m.name))
                    .map(m => ({
                        name: m.name,
                        macro_origin_id: macroMap.get(m.parentName),
                        active: true
                    }))
                    .filter(m => m.macro_origin_id);

                if (toCreate.length > 0) {
                    await (supabase as any)
                        .from('micro_origins')
                        .insert(toCreate);
                    created += toCreate.length;
                }
            }
            setCreatedCount(created);

            // 4. Create Micro Variations (need micro_origin_id)
            if (microVars.length > 0) {
                const { data: allMicros } = await (supabase as any)
                    .from('micro_origins')
                    .select('id, name');

                const microMap = new Map(allMicros?.map((m: any) => [m.name, m.id]) || []);

                const uniqueVars = [...new Map(microVars.map(v => [`${v.name}|${v.parentName}`, v])).values()];

                const { data: existingVars } = await (supabase as any)
                    .from('micro_variations')
                    .select('name');

                const existingNames = new Set(existingVars?.map((e: any) => e.name) || []);

                const toCreate = uniqueVars
                    .filter(v => !existingNames.has(v.name))
                    .map(v => ({
                        name: v.name,
                        micro_origin_id: microMap.get(v.parentName),
                        active: true
                    }))
                    .filter(v => v.micro_origin_id);

                if (toCreate.length > 0) {
                    await (supabase as any)
                        .from('micro_variations')
                        .insert(toCreate);
                    created += toCreate.length;
                }
            }
            setCreatedCount(created);

            // 5. Create Nano Variations (need micro_variation_id)
            if (nanos.length > 0) {
                const { data: allMicroVars } = await (supabase as any)
                    .from('micro_variations')
                    .select('id, name');

                const varMap = new Map(allMicroVars?.map((v: any) => [v.name, v.id]) || []);

                const uniqueNanos = [...new Map(nanos.map(n => [`${n.name}|${n.parentName}`, n])).values()];

                const { data: existingNanos } = await (supabase as any)
                    .from('nano_variations')
                    .select('name');

                const existingNames = new Set(existingNanos?.map((e: any) => e.name) || []);

                const toCreate = uniqueNanos
                    .filter(n => !existingNames.has(n.name))
                    .map(n => ({
                        name: n.name,
                        micro_variation_id: varMap.get(n.parentName),
                        active: true
                    }))
                    .filter(n => n.micro_variation_id);

                if (toCreate.length > 0) {
                    await (supabase as any)
                        .from('nano_variations')
                        .insert(toCreate);
                    created += toCreate.length;
                }
            }

            toast({
                title: "Hierarquia criada!",
                description: `${created} item(ns) criado(s) com sucesso.`,
            });

            onComplete();
        } catch (error: any) {
            console.error('Erro ao criar hierarquia:', error);
            toast({
                title: "Erro ao criar hierarquia",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const selectedCount = selectedItems.size;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-primary text-xl flex items-center gap-2">
                        <Layers className="h-5 w-5" />
                        Criar Hierarquia de Origens
                    </DialogTitle>
                    <DialogDescription>
                        {(itemsToCreate?.length || 0)} item(ns) único(s) detectado(s) no CSV
                    </DialogDescription>
                </DialogHeader>

                <Alert className="border-amber-500/50 bg-amber-500/5">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-sm">
                        Itens que já existem no sistema serão <strong>ignorados</strong> automaticamente.
                    </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between py-2 border-b">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                            checked={itemsToCreate && selectedItems.size === itemsToCreate.length}
                            onCheckedChange={toggleAll}
                        />
                        <span className="text-sm font-medium">Selecionar todos</span>
                    </label>
                    <span className="text-sm text-muted-foreground">
                        {selectedCount} de {(itemsToCreate?.length || 0)} selecionado(s)
                    </span>
                </div>

                <ScrollArea className="flex-1 min-h-0 h-[400px] pr-4">
                    <div className="space-y-2 py-2 overflow-y-auto">
                        {(itemsToCreate || []).map((item, index) => {
                            const config = LEVEL_CONFIG[item.type];
                            const Icon = config.icon;
                            const isSelected = selectedItems.has(String(index));

                            return (
                                <label
                                    key={index}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected
                                        ? 'border-primary/50 bg-primary/5'
                                        : 'border-border hover:bg-accent/50'
                                        }`}
                                >
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleItem(index)}
                                    />
                                    <Badge className={config.color}>
                                        <Icon className="h-3 w-3 mr-1" />
                                        {config.label}
                                    </Badge>
                                    <span className="font-medium flex-1 truncate">{item.name}</span>
                                    {item.parentName && (
                                        <span className="text-xs text-muted-foreground">
                                            → {item.parentName}
                                        </span>
                                    )}
                                </label>
                            );
                        })}
                    </div>
                </ScrollArea>

                <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
                    <Button variant="outline" onClick={onSkip} disabled={isProcessing}>
                        Pular (Não criar)
                    </Button>
                    <Button
                        onClick={handleCreateAll}
                        disabled={isProcessing || selectedCount === 0}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Criando... ({createdCount})
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Criar {selectedCount} Item(ns)
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
