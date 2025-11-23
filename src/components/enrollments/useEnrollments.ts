import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Enrollment, SortOption } from "./types";
import { useMemo } from "react";
export { useCancelEnrollment, useDeleteEnrollment, useCreateEnrollment, useUpdateEnrollment } from "@/integrations/supabase/hooks/useEnrollments";

export const useEnrollments = (sortBy: SortOption, page: number = 1, pageSize: number = 10, showCancelled: boolean = false) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['all-enrollments', page, pageSize, showCancelled],
        queryFn: async () => {
            let query = supabase
                .from('enrollments')
                .select('*, cohorts(name)', { count: 'exact' });

            if (showCancelled) {
                // "Steve Jobs" Approach: Client-side filtering for maximum reliability.
                // We fetch all records and filter in memory to bypass potential JSONB query issues.
                // This ensures that if the data exists, the user WILL see it.
                const { data, error } = await query.order('created_at', { ascending: false });

                if (error) throw error;

                // Filter for cancelled status
                const cancelledEnrollments = (data || []).filter(e => {
                    const metadata = e.external_metadata as any;
                    return metadata?.status === 'cancelled';
                });

                // Manual Pagination
                const from = (page - 1) * pageSize;
                const to = from + pageSize;
                const paginatedData = cancelledEnrollments.slice(from, to);

                return {
                    enrollments: paginatedData as Enrollment[],
                    count: cancelledEnrollments.length
                };
            } else {
                // Show ONLY active enrollments (not cancelled)
                // Server-side filtering works fine for exclusion
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;

                query = query.or('external_metadata->>status.neq.cancelled,external_metadata->>status.is.null');

                const { data, error, count } = await query
                    .order('created_at', { ascending: false })
                    .range(from, to);

                if (error) throw error;

                return {
                    enrollments: data as Enrollment[],
                    count: count || 0
                };
            }
        },
        placeholderData: keepPreviousData,
    });

    const enrollments = data?.enrollments || [];
    const totalCount = data?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const sortedEnrollments = useMemo(() => {
        if (!enrollments) return [];

        const sorted = [...enrollments];

        switch (sortBy) {
            case 'name-asc':
                return sorted.sort((a, b) => a.student_name.localeCompare(b.student_name));
            case 'name-desc':
                return sorted.sort((a, b) => b.student_name.localeCompare(a.student_name));
            case 'date-asc':
                return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            case 'date-desc':
                return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            case 'cohort':
                return sorted.sort((a, b) => {
                    const nameA = a.cohorts?.name || '';
                    const nameB = b.cohorts?.name || '';
                    return nameA.localeCompare(nameB);
                });
            default:
                return sorted;
        }
    }, [enrollments, sortBy]);

    return {
        enrollments: sortedEnrollments,
        isLoading,
        error,
        totalCount,
        totalPages
    };
};
