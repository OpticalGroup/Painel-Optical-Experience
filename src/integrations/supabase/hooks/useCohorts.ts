import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import { Tables, TablesInsert, TablesUpdate } from '../types';
import { useToast } from '@/hooks/use-toast';

type Cohort = Tables<'cohorts'>;
type CohortInsert = TablesInsert<'cohorts'>;
type CohortUpdate = TablesUpdate<'cohorts'>;

interface CohortWithStats extends Cohort {
  stats?: {
    enrolled_count: number;
    paid_count: number;
    reserved_count: number;
    signed_count: number;
    available_spots: number;
    is_overbooked: boolean;
    total_revenue: number;
  };
  course?: {
    name: string;
  };
}

export const useCohortsQuery = () => {
  return useQuery({
    queryKey: ['cohorts'],
    queryFn: async () => {
      const { data: cohorts, error } = await supabase
        .from('cohorts')
        .select('*, courses(name)')
        .eq('product_id', 'f78831df-4c55-45b4-a50e-6be0dd02ba3e')
        .order('start_date', { ascending: true });

      if (error) throw error;

      // Fetch stats for each cohort
      const cohortsWithStats = await Promise.all(
        cohorts.map(async (cohort) => {
          const { data: stats } = await supabase
            .rpc('get_cohort_stats', { p_cohort_id: cohort.id });

          return {
            ...cohort,
            course: cohort.courses as any,
            stats: stats?.[0] || {
              enrolled_count: 0,
              paid_count: 0,
              reserved_count: 0,
              signed_count: 0,
              available_spots: cohort.capacity,
              is_overbooked: false,
              total_revenue: 0,
            },
          };
        })
      );

      return cohortsWithStats as CohortWithStats[];
    },
  });
};

export const useCohortQuery = (cohortId: string | undefined) => {
  return useQuery({
    queryKey: ['cohort', cohortId],
    queryFn: async () => {
      if (!cohortId) throw new Error('Cohort ID is required');

      const { data: cohort, error } = await supabase
        .from('cohorts')
        .select('*, courses(name)')
        .eq('id', cohortId)
        .single();

      if (error) throw error;

      const { data: stats } = await supabase
        .rpc('get_cohort_stats', { p_cohort_id: cohortId });

      return {
        ...cohort,
        course: cohort.courses as any,
        stats: stats?.[0] || {
          enrolled_count: 0,
          paid_count: 0,
          reserved_count: 0,
          signed_count: 0,
          available_spots: cohort.capacity,
          is_overbooked: false,
          total_revenue: 0,
        },
      } as CohortWithStats;
    },
    enabled: !!cohortId,
  });
};

export const useCreateCohort = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (cohort: CohortInsert) => {
      const { data, error } = await supabase
        .from('cohorts')
        .insert(cohort)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      toast({
        title: 'Turma criada!',
        description: 'A turma foi criada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar turma',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateCohort = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CohortUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('cohorts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['cohort', variables.id] });
      toast({
        title: 'Turma atualizada!',
        description: 'A turma foi atualizada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar turma',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteCohort = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (cohortId: string) => {
      const { error } = await supabase
        .from('cohorts')
        .delete()
        .eq('id', cohortId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      toast({
        title: 'Turma removida!',
        description: 'A turma foi removida com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover turma',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
