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

    // DISABLED: integration_settings table does not exist
    // Using local default config instead
    const query = useQuery({
        queryKey: ["utm-settings"],
        queryFn: async () => {
            // Return default config without database call
            return DEFAULT_CONFIG;
        },
        enabled: false, // Disable query entirely
    });

    // DISABLED: integration_settings table does not exist
    const updateSettings = useMutation({
        mutationFn: async (newConfig: UtmConfig) => {
            // No-op: settings are not persisted
            console.warn('UTM settings cannot be saved (integration_settings table does not exist)');
            return;
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
