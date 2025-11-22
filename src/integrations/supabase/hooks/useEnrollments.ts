import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import { Tables, TablesInsert, TablesUpdate } from '../types';
import { useToast } from '@/hooks/use-toast';

type Enrollment = Tables<'enrollments'>;
type EnrollmentInsert = TablesInsert<'enrollments'>;
type EnrollmentUpdate = TablesUpdate<'enrollments'>;

export const useEnrollmentsQuery = (cohortId: string | undefined) => {
  return useQuery({
    queryKey: ['enrollments', cohortId],
    queryFn: async () => {
      if (!cohortId) throw new Error('Cohort ID is required');

      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('cohort_id', cohortId)
        .order('position_in_cohort', { ascending: true });

      if (error) throw error;
      
      // Log access to sensitive enrollment data for compliance
      if (data && data.length > 0) {
        try {
          await supabase.functions.invoke('log-enrollment-access', {
            body: {
              cohortId,
              enrollmentIds: data.map(e => e.id),
            },
          });
        } catch (logError) {
          // Don't fail the query if audit logging fails
          console.warn('Failed to log enrollment access:', logError);
        }
      }
      
      return data as Enrollment[];
    },
    enabled: !!cohortId,
  });
};

export const useCreateEnrollment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (enrollment: EnrollmentInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          ...enrollment,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', variables.cohort_id] });
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['cohort', variables.cohort_id] });
      toast({
        title: 'Matrícula criada!',
        description: 'A matrícula foi adicionada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar matrícula',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateEnrollment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, cohort_id, ...updates }: EnrollmentUpdate & { id: string; cohort_id: string }) => {
      const { data, error } = await supabase
        .from('enrollments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, cohort_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', result.cohort_id] });
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['cohort', result.cohort_id] });
      toast({
        title: 'Matrícula atualizada!',
        description: 'A matrícula foi atualizada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar matrícula',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteEnrollment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, cohort_id }: { id: string; cohort_id: string }) => {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return cohort_id;
    },
    onSuccess: (cohort_id) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', cohort_id] });
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['cohort', cohort_id] });
      toast({
        title: 'Matrícula removida!',
        description: 'A matrícula foi removida com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover matrícula',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
