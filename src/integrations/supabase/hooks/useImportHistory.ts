import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import { useToast } from '@/hooks/use-toast';

export interface ImportHistory {
  id: string;
  imported_by: string | null;
  user_email: string | null;
  imported_at: string;
  total_students: number;
  successful_imports: number;
  failed_imports: number;
  cohorts_affected: string[];
  file_name: string | null;
  import_type: string;
  notes: string | null;
}

export const useImportHistoryQuery = () => {
  return useQuery({
    queryKey: ['import-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('csv_import_history')
        .select('*')
        .order('imported_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ImportHistory[];
    },
  });
};

export const useCreateImportRecord = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (record: Omit<ImportHistory, 'id' | 'imported_at' | 'imported_by' | 'user_email'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('csv_import_history')
        .insert({
          ...record,
          imported_by: user?.id,
          user_email: user?.email,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-history'] });
    },
    onError: (error: Error) => {
      console.error('Failed to record import history:', error);
      // Don't show toast error to user - this is background logging
    },
  });
};
