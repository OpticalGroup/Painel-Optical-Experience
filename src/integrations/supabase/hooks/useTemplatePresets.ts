import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TemplatePreset {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  selected_fields: string[];
  created_at: string;
  updated_at: string;
}

export const useTemplatePresets = () => {
  return useQuery({
    queryKey: ['csv-template-presets'],
    queryFn: async () => {
      let query = supabase
        .from('csv_template_presets')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data as TemplatePreset[];
    },
  });
};

export const useCreateTemplatePreset = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preset: {
      name: string;
      description?: string;
      selected_fields: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('csv_template_presets')
        .insert({
          ...preset,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csv-template-presets'] });
      toast({
        title: 'Template salvo!',
        description: 'Seu template personalizado foi salvo com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateTemplatePreset = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      description?: string;
      selected_fields?: string[];
    }) => {
      const { data, error } = await supabase
        .from('csv_template_presets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csv-template-presets'] });
      toast({
        title: 'Template atualizado!',
        description: 'Seu template foi atualizado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteTemplatePreset = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('csv_template_presets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['csv-template-presets'] });
      toast({
        title: 'Template removido',
        description: 'O template foi removido com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
