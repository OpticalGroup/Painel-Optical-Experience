import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import { Tables, TablesInsert, TablesUpdate } from '../types';
import { useToast } from '@/hooks/use-toast';

type SalesRep = Tables<'sales_representatives'>;
type SalesRepInsert = TablesInsert<'sales_representatives'>;
type SalesRepUpdate = TablesUpdate<'sales_representatives'>;

export const useSalesRepsQuery = () => {
  return useQuery({
    queryKey: ['sales-reps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_representatives')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as SalesRep[];
    },
  });
};

export const useCreateSalesRep = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (salesRep: SalesRepInsert) => {
      const { data, error } = await supabase
        .from('sales_representatives')
        .insert(salesRep)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-reps'] });
      toast({
        title: 'Vendedor criado!',
        description: 'O vendedor foi adicionado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar vendedor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateSalesRep = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: SalesRepUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('sales_representatives')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-reps'] });
      toast({
        title: 'Vendedor atualizado!',
        description: 'As informações foram atualizadas com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar vendedor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteSalesRep = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (salesRepId: string) => {
      const { error } = await supabase
        .from('sales_representatives')
        .delete()
        .eq('id', salesRepId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-reps'] });
      toast({
        title: 'Vendedor removido!',
        description: 'O vendedor foi removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover vendedor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
