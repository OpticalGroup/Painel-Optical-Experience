import { Tables } from "@/integrations/supabase/types";

export type Enrollment = Tables<'enrollments'> & {
    cohorts?: {
        name: string;
    };
};

export type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc' | 'cohort';
