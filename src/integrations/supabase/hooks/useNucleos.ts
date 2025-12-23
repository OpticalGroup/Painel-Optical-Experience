import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import { Tables, TablesInsert, TablesUpdate } from '../types';
import { useToast } from '@/hooks/use-toast';

type Nucleo = Tables<'nucleos'>;
type NucleoInsert = TablesInsert<'nucleos'>;
type NucleoUpdate = TablesUpdate<'nucleos'>;

export const useNucleosQuery = () => {
  return useQuery({
    queryKey: ['nucleos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nucleos')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Nucleo[];
    },
  });
};

export const useCreateNucleo = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (nucleo: NucleoInsert) => {
      const { data, error } = await supabase
        .from('nucleos')
        .insert(nucleo)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nucleos'] });
      toast({
        title: 'Núcleo criado!',
        description: 'O núcleo foi adicionado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar núcleo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateNucleo = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: NucleoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('nucleos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nucleos'] });
      toast({
        title: 'Núcleo atualizado!',
        description: 'As informações foram atualizadas com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar núcleo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteNucleo = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (nucleoId: string) => {
      const { error } = await supabase
        .from('nucleos')
        .delete()
        .eq('id', nucleoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nucleos'] });
      toast({
        title: 'Núcleo removido!',
        description: 'O núcleo foi removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover núcleo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};