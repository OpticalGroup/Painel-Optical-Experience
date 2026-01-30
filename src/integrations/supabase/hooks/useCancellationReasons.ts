import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../client";
import { useToast } from "@/hooks/use-toast";

export interface CancellationReason {
    id: string;
    name: string;
    active: boolean;
    created_at?: string;
}

export const useCancellationReasons = () => {
    const query = useQuery({
        queryKey: ["cancellation-reasons"],
        queryFn: async (): Promise<CancellationReason[]> => {
            const { data, error } = await supabase
                .from("cancellation_reasons")
                .select("*")
                .order("name");

            if (error) throw error;
            return data || [];
        },
    });

    return {
        reasons: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
};


export const useCreateCancellationReason = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (reason: { name: string; active: boolean }) => {
            const { data, error } = await supabase
                .from("cancellation_reasons")
                .insert(reason)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cancellation-reasons"] });
            toast({ title: "Motivo criado com sucesso!" });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao criar motivo",
                description: error.message,
                variant: "destructive",
            });
        },
    });
};

export const useUpdateCancellationReason = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<CancellationReason> & { id: string }) => {
            const { data, error } = await supabase
                .from("cancellation_reasons")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cancellation-reasons"] });
            toast({ title: "Motivo atualizado com sucesso!" });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao atualizar motivo",
                description: error.message,
                variant: "destructive",
            });
        },
    });
};

export const useDeleteCancellationReason = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("cancellation_reasons")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cancellation-reasons"] });
            toast({ title: "Motivo removido com sucesso!" });
        },
        onError: (error: any) => {
            console.error("Erro ao deletar:", error);
            // Check for foreign key constraint usually
            if (error.code === '23503') {
                toast({
                    title: "Não é possível excluir",
                    description: "Este motivo já está sendo usado em algum cancelamento.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Erro ao remover motivo",
                    description: error.message,
                    variant: "destructive",
                });
            }
        },
    });
};
