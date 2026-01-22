import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';

// ============================================
// Types
// ============================================
export interface Funnel {
    id: string;
    name: string;
    description: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface MacroOrigin {
    id: string;
    funnel_id: string;
    name: string;
    description: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
    funnel?: Funnel;
}

export interface MicroOrigin {
    id: string;
    macro_origin_id: string;
    name: string;
    description: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
    macro_origin?: MacroOrigin;
}

export interface MicroVariation {
    id: string;
    micro_origin_id: string;
    name: string;
    description: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
    micro_origin?: MicroOrigin;
}

export interface NanoVariation {
    id: string;
    micro_variation_id: string;
    name: string;
    description: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
    micro_variation?: MicroVariation;
}

// NOTE: Using 'any' temporarily until migration runs and types.ts is regenerated
// After running the migration and `npx supabase gen types typescript`, these will have proper types

// ============================================
// Funnels Hooks
// ============================================
export function useFunnels() {
    return useQuery({
        queryKey: ['funnels'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('funnels')
                .select('*')
                .order('name');
            if (error) throw error;
            return (data || []) as Funnel[];
        },
    });
}

export function useCreateFunnel() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (funnel: Omit<Funnel, 'id' | 'created_at' | 'updated_at'>) => {
            // Omit active to bypass schema cache issue
            const { active, ...rest } = funnel as any;
            const { data, error } = await (supabase as any)
                .from('funnels')
                .insert(rest)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['funnels'] });
        },
    });
}

export function useUpdateFunnel() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Funnel> & { id: string }) => {
            const { data, error } = await (supabase as any)
                .from('funnels')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['funnels'] });
        },
    });
}

export function useDeleteFunnel() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from('funnels')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['funnels'] });
        },
    });
}

// ============================================
// Macro Origins Hooks
// ============================================
export function useMacroOrigins(funnelId?: string) {
    return useQuery({
        queryKey: ['macro_origins', funnelId],
        queryFn: async () => {
            let query = (supabase as any)
                .from('macro_origins')
                .select('*, funnel:funnels(*)');

            if (funnelId) {
                query = query.eq('funnel_id', funnelId);
            }

            const { data, error } = await query.order('name');
            if (error) throw error;
            return (data || []) as MacroOrigin[];
        },
    });
}

export function useCreateMacroOrigin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (origin: Omit<MacroOrigin, 'id' | 'created_at' | 'updated_at' | 'funnel'>) => {
            // Omit active to bypass schema cache issue
            const { active, ...rest } = origin as any;
            const { data, error } = await (supabase as any)
                .from('macro_origins')
                .insert(rest)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['macro_origins'] });
        },
    });
}

export function useUpdateMacroOrigin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<MacroOrigin> & { id: string }) => {
            const { data, error } = await (supabase as any)
                .from('macro_origins')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['macro_origins'] });
        },
    });
}

export function useDeleteMacroOrigin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from('macro_origins')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['macro_origins'] });
        },
    });
}

// ============================================
// Micro Origins Hooks
// ============================================
export function useMicroOrigins(macroOriginId?: string) {
    return useQuery({
        queryKey: ['micro_origins', macroOriginId],
        queryFn: async () => {
            let query = (supabase as any)
                .from('micro_origins')
                .select('*, macro_origin:macro_origins(*, funnel:funnels(*))');

            if (macroOriginId) {
                query = query.eq('macro_origin_id', macroOriginId);
            }

            const { data, error } = await query.order('name');
            if (error) throw error;
            return (data || []) as MicroOrigin[];
        },
    });
}

export function useCreateMicroOrigin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (origin: Omit<MicroOrigin, 'id' | 'created_at' | 'updated_at' | 'macro_origin'>) => {
            // Omit active to bypass schema cache issue
            const { active, ...rest } = origin as any;
            const { data, error } = await (supabase as any)
                .from('micro_origins')
                .insert(rest)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['micro_origins'] });
        },
    });
}

export function useUpdateMicroOrigin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<MicroOrigin> & { id: string }) => {
            const { data, error } = await (supabase as any)
                .from('micro_origins')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['micro_origins'] });
        },
    });
}

export function useDeleteMicroOrigin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from('micro_origins')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['micro_origins'] });
        },
    });
}

// ============================================
// Micro Variations Hooks
// ============================================
export function useMicroVariations(microOriginId?: string) {
    return useQuery({
        queryKey: ['micro_variations', microOriginId],
        queryFn: async () => {
            let query = (supabase as any)
                .from('micro_variations')
                .select('*, micro_origin:micro_origins(*, macro_origin:macro_origins(*, funnel:funnels(*)))');

            if (microOriginId) {
                query = query.eq('micro_origin_id', microOriginId);
            }

            const { data, error } = await query.order('name');
            if (error) throw error;
            return (data || []) as MicroVariation[];
        },
    });
}

export function useCreateMicroVariation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (variation: Omit<MicroVariation, 'id' | 'created_at' | 'updated_at' | 'micro_origin'>) => {
            // Omit active to bypass schema cache issue
            const { active, ...rest } = variation as any;
            const { data, error } = await (supabase as any)
                .from('micro_variations')
                .insert(rest)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['micro_variations'] });
        },
    });
}

export function useUpdateMicroVariation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<MicroVariation> & { id: string }) => {
            const { data, error } = await (supabase as any)
                .from('micro_variations')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['micro_variations'] });
        },
    });
}

export function useDeleteMicroVariation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from('micro_variations')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['micro_variations'] });
        },
    });
}

// ============================================
// Nano Variations Hooks
// ============================================
export function useNanoVariations(microVariationId?: string) {
    return useQuery({
        queryKey: ['nano_variations', microVariationId],
        queryFn: async () => {
            let query = (supabase as any)
                .from('nano_variations')
                .select('*, micro_variation:micro_variations(*, micro_origin:micro_origins(*, macro_origin:macro_origins(*, funnel:funnels(*))))');

            if (microVariationId) {
                query = query.eq('micro_variation_id', microVariationId);
            }

            const { data, error } = await query.order('name');
            if (error) throw error;
            return (data || []) as NanoVariation[];
        },
    });
}

export function useCreateNanoVariation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (variation: Omit<NanoVariation, 'id' | 'created_at' | 'updated_at' | 'micro_variation'>) => {
            // Omit active to bypass schema cache issue
            const { active, ...rest } = variation as any;
            const { data, error } = await (supabase as any)
                .from('nano_variations')
                .insert(rest)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nano_variations'] });
        },
    });
}

export function useUpdateNanoVariation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<NanoVariation> & { id: string }) => {
            const { data, error } = await (supabase as any)
                .from('nano_variations')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nano_variations'] });
        },
    });
}

export function useDeleteNanoVariation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from('nano_variations')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nano_variations'] });
        },
    });
}

// ============================================
// Utility Hook - Full Hierarchy (5 levels)
// ============================================
export function useOriginHierarchy() {
    const funnels = useFunnels();
    const macroOrigins = useMacroOrigins();
    const microOrigins = useMicroOrigins();
    const microVariations = useMicroVariations();
    const nanoVariations = useNanoVariations();

    return {
        funnels: funnels.data || [],
        macroOrigins: macroOrigins.data || [],
        microOrigins: microOrigins.data || [],
        microVariations: microVariations.data || [],
        nanoVariations: nanoVariations.data || [],
        isLoading: funnels.isLoading || macroOrigins.isLoading || microOrigins.isLoading || microVariations.isLoading || nanoVariations.isLoading,
        error: funnels.error || macroOrigins.error || microOrigins.error || microVariations.error || nanoVariations.error,
    };
}

// Helper para obter o caminho completo de uma nano variação
export function getFullHierarchyPath(
    nanoVariationId: string,
    nanoVariations: NanoVariation[],
    microVariations: MicroVariation[],
    microOrigins: MicroOrigin[],
    macroOrigins: MacroOrigin[],
    funnels: Funnel[]
): string {
    const nano = nanoVariations.find(n => n.id === nanoVariationId);
    if (!nano) return '';

    const microVar = microVariations.find(v => v.id === nano.micro_variation_id);
    if (!microVar) return nano.name;

    const microOrigin = microOrigins.find(m => m.id === microVar.micro_origin_id);
    if (!microOrigin) return `${microVar.name} > ${nano.name}`;

    const macroOrigin = macroOrigins.find(m => m.id === microOrigin.macro_origin_id);
    if (!macroOrigin) return `${microOrigin.name} > ${microVar.name} > ${nano.name}`;

    const funnel = funnels.find(f => f.id === macroOrigin.funnel_id);
    if (!funnel) return `${macroOrigin.name} > ${microOrigin.name} > ${microVar.name} > ${nano.name}`;

    return `${funnel.name} > ${macroOrigin.name} > ${microOrigin.name} > ${microVar.name} > ${nano.name}`;
}
