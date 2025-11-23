import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../client";
import { useToast } from "@/hooks/use-toast";

const SETTING_KEY = "cancellation_reasons";
const DEFAULT_REASONS = [
    "Financeiro",
    "Horário incompatível",
    "Conteúdo não atendeu expectativa",
    "Problemas pessoais",
    "Outro"
];

export interface CancellationReason {
    id: string;
    label: string;
    active: boolean;
}

export const useCancellationReasons = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const query = useQuery({
        queryKey: ["cancellation-reasons"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("integration_settings")
                .select("*")
                .eq("system_name", SETTING_KEY)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                // Initialize if not exists
                const initialConfig = {
                    reasons: DEFAULT_REASONS.map(r => ({
                        id: crypto.randomUUID(),
                        label: r,
                        active: true
                    }))
                };

                const { data: newData, error: createError } = await supabase
                    .from("integration_settings")
                    .insert({
                        system_name: SETTING_KEY,
                        config: initialConfig,
                        enabled: true
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                return (newData.config as any).reasons as CancellationReason[];
            }

            return (data.config as any).reasons as CancellationReason[];
        },
    });

    const updateReasons = useMutation({
        mutationFn: async (reasons: CancellationReason[]) => {
            // First get the ID
            const { data: existing } = await supabase
                .from("integration_settings")
                .select("id")
                .eq("system_name", SETTING_KEY)
                .single();
            toast({
                title: "Motivos atualizados",
                description: "A lista de motivos de cancelamento foi salva.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao atualizar",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return {
        reasons: query.data || [],
        isLoading: query.isLoading,
        updateReasons,
    };
};
