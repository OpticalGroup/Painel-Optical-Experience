import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import { Tables, TablesInsert, TablesUpdate } from '../types';
import { useToast } from '@/hooks/use-toast';

type CustomSource = Tables<'custom_enrollment_sources'>;
type CustomSourceInsert = TablesInsert<'custom_enrollment_sources'>;
type CustomSourceUpdate = TablesUpdate<'custom_enrollment_sources'>;

export const useCustomSourcesQuery = () => {
  return useQuery({
    queryKey: ['custom-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_enrollment_sources')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as CustomSource[];
    },
  });
};

export const useCreateCustomSource = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (source: CustomSourceInsert) => {
      const { data, error } = await supabase
        .from('custom_enrollment_sources')
        .insert(source)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-sources'] });
      toast({
        title: 'Origem criada!',
        description: 'A origem foi adicionada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar origem',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateCustomSource = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CustomSourceUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('custom_enrollment_sources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-sources'] });
      toast({
        title: 'Origem atualizada!',
        description: 'As informações foram atualizadas com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar origem',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteCustomSource = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (sourceId: string) => {
      const { error } = await supabase
        .from('custom_enrollment_sources')
        .delete()
        .eq('id', sourceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-sources'] });
      toast({
        title: 'Origem removida!',
        description: 'A origem foi removida com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover origem',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
