import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import { Tables, TablesInsert, TablesUpdate } from '../types';
import { useToast } from '@/hooks/use-toast';

type Enrollment = Tables<'enrollments'>;
type EnrollmentInsert = TablesInsert<'enrollments'>;
type EnrollmentUpdate = TablesUpdate<'enrollments'>;

export const useEnrollmentsQuery = (cohortId: string | undefined, showCancelled: boolean = false) => {
  return useQuery({
    queryKey: ['enrollments', cohortId, showCancelled],
    queryFn: async () => {
      if (!cohortId) throw new Error('Cohort ID is required');

        let query = supabase
          .from('enrollments')
          .select(`
            *,
            student_name:buyer_name,
            contacts (*),
            products (*),
            sellers (*)
          `)
        .eq('cohort_id', cohortId)
        .order('position_in_cohort', { ascending: true });

      const { data, error } = await query;

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

      // Return all data, let the UI handle filtering
      return data as Enrollment[];
    },
    enabled: !!cohortId,
  });
};

import { logAuditAction } from '@/lib/audit';

// ... (existing imports)

// ... (useEnrollmentsQuery remains same)

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
    onSuccess: (data, variables) => {
      logAuditAction({
        action: 'enrollment.create',
        entityId: data.id,
        entityType: 'enrollment',
        afterData: data,
      });

      queryClient.invalidateQueries({ queryKey: ['enrollments', variables.cohort_id] });
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['cohort', variables.cohort_id] });
      toast({
        title: 'Matrícula criada!',
        description: 'A matrícula foi adicionada com sucesso.',
      });

      // Notify Integrations
      supabase.functions.invoke('notify-integrations', {
        body: { enrollmentId: data.id, event: 'enrollment_created' }
      }).catch(console.error);
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
      // Fetch before data for audit
      const { data: beforeData } = await supabase
        .from('enrollments')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('enrollments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, cohort_id, beforeData };
    },
    onSuccess: (result) => {
      logAuditAction({
        action: 'enrollment.update',
        entityId: result.data.id,
        entityType: 'enrollment',
        beforeData: result.beforeData,
        afterData: result.data,
      });

      queryClient.invalidateQueries({ queryKey: ['enrollments', result.cohort_id] });
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['cohort', result.cohort_id] });
      toast({
        title: 'Matrícula atualizada!',
        description: 'A matrícula foi atualizada com sucesso.',
      });

      // Notify Integrations
      supabase.functions.invoke('notify-integrations', {
        body: { enrollmentId: result.data.id, event: 'enrollment_updated' }
      }).catch(console.error);
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

export const useCancelEnrollment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, cohort_id, current_metadata, reason, details }: { id: string; cohort_id: string; current_metadata?: any; reason?: string; details?: string }) => {
      const newMetadata = {
        ...(current_metadata || {}),
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        cancellation_details: details,
      };

      const { error } = await supabase
        .from('enrollments')
        .update({ external_metadata: newMetadata })
        .eq('id', id);

      if (error) throw error;
      return { id, cohort_id, newMetadata };
    },
    onSuccess: (result) => {
      logAuditAction({
        action: 'enrollment.cancel',
        entityId: result.id,
        entityType: 'enrollment',
        afterData: { status: 'cancelled', metadata: result.newMetadata },
      });

      queryClient.invalidateQueries({ queryKey: ['enrollments', result.cohort_id] });
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['cohort', result.cohort_id] });
      toast({
        title: 'Matrícula cancelada!',
        description: 'A matrícula foi marcada como cancelada.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cancelar matrícula',
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
      return { id, cohort_id };
    },
    onSuccess: (result) => {
      logAuditAction({
        action: 'enrollment.delete',
        entityId: result.id,
        entityType: 'enrollment',
      });

      queryClient.invalidateQueries({ queryKey: ['enrollments', result.cohort_id] });
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['cohort', result.cohort_id] });
      toast({
        title: 'Matrícula excluída!',
        description: 'A matrícula foi removida permanentemente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir matrícula',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
