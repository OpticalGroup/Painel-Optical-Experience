import { useQuery } from '@tanstack/react-query';
import { supabase } from '../client';
import { Tables } from '../types';

type Course = Tables<'courses'>;

export const useCoursesQuery = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Course[];
    },
  });
};
