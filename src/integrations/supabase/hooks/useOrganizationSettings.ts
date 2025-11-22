import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OrganizationSettings {
  id: string;
  organization_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  foreground_color: string;
  custom_domain: string | null;
  created_at: string;
  updated_at: string;
}

export const useOrganizationSettings = () => {
  return useQuery({
    queryKey: ["organization-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data as OrganizationSettings;
    },
  });
};

export const useUpdateOrganizationSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<OrganizationSettings>) => {
      const { data: existingSettings } = await supabase
        .from("organization_settings")
        .select("id")
        .single();

      if (!existingSettings) {
        throw new Error("Organization settings not found");
      }

      const { data, error } = await supabase
        .from("organization_settings")
        .update(settings)
        .eq("id", existingSettings.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-settings"] });
      toast({
        title: "Configurações atualizadas",
        description: "As configurações de marca foram salvas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUploadLogo = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateSettings = useUpdateOrganizationSettings();

  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("organization-logos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("organization-logos")
        .getPublicUrl(filePath);

      return publicUrl;
    },
    onSuccess: (logoUrl) => {
      updateSettings.mutate({ logo_url: logoUrl });
      queryClient.invalidateQueries({ queryKey: ["organization-settings"] });
      toast({
        title: "Logo enviado",
        description: "O logo foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar logo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
