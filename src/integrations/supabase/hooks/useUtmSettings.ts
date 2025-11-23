import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../client";
import { useToast } from "@/hooks/use-toast";

export interface UtmConfig {
    utm_source: boolean;
    utm_medium: boolean;
    utm_campaign: boolean;
    utm_content: boolean;
    utm_term: boolean;
    utm_page: boolean;
}

const DEFAULT_CONFIG: UtmConfig = {
    utm_source: true,
    utm_medium: true,
    utm_campaign: true,
    utm_content: true,
    utm_term: true,
    utm_page: true,
};

const SETTING_KEY = "utm_config";

export const useUtmSettings = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const query = useQuery({
        queryKey: ["utm-settings"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("integration_settings")
                .select("*")
                .eq("system_name", SETTING_KEY)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                // Initialize if not exists
                const { data: newData, error: createError } = await supabase
                    .from("integration_settings")
                    .insert({
                        system_name: SETTING_KEY,
                        config: DEFAULT_CONFIG as any,
                        active: true,
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                return newData.config as UtmConfig;
            }

            // Merge with default config to ensure new keys exist
            return { ...DEFAULT_CONFIG, ...(data.config as object) } as UtmConfig;
        },
    });

    const updateSettings = useMutation({
        mutationFn: async (newConfig: UtmConfig) => {
            const { data: existing } = await supabase
                .from("integration_settings")
                .select("id")
                .eq("system_name", SETTING_KEY)
                .single();

            if (!existing) throw new Error("Settings not found");

            const { error } = await supabase
                .from("integration_settings")
                .update({
                    config: newConfig as any,
                    updated_at: new Date().toISOString()
                })
                .eq("id", existing.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["utm-settings"] });
            toast({
                title: "Configurações atualizadas",
                description: "As configurações de UTM foram salvas.",
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
        config: query.data || DEFAULT_CONFIG,
        isLoading: query.isLoading,
        updateSettings,
    };
};
