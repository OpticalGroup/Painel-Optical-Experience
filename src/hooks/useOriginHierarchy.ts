import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OriginHierarchyData {
    funis: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
    macroOrigens: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
    microOrigens: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
    variacaoMicro: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
    variacaoNano: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
}

export interface DateRange {
    from?: Date;
    to?: Date;
}

export function useOriginHierarchy(dateRange?: DateRange, cohortId?: string) {
    return useQuery({
        queryKey: ["origin-hierarchy", dateRange?.from, dateRange?.to, cohortId],
        queryFn: async (): Promise<OriginHierarchyData> => {
            let query = supabase
                .from("enrollments")
                .select(`
                    id,
                    created_at,
                    financial_status,
                    payment_amount,
                    funnel_id,
                    macro_origin_id,
                    micro_origin_id,
                    micro_variation_id,
                    cohort_id,
                    funnel_name,
                    macro_origin_name,
                    micro_origin_name,
                    micro_variation_name,
                    nano_variation_name
                `);

            if (dateRange?.from) {
                query = query.gte("created_at", dateRange.from.toISOString());
            }

            if (dateRange?.to) {
                const toDate = new Date(dateRange.to);
                toDate.setHours(23, 59, 59, 999);
                query = query.lte("created_at", toDate.toISOString());
            }

            if (cohortId && cohortId !== "all") {
                query = query.eq("cohort_id", cohortId);
            }

            const { data: enrollments, error } = await query;

            if (error) {
                console.error("Error fetching origin hierarchy data:", error);
                throw error;
            }

            if (!enrollments || enrollments.length === 0) {
                return {
                    funis: [],
                    macroOrigens: [],
                    microOrigens: [],
                    variacaoMicro: [],
                    variacaoNano: [],
                };
            }

            // Helper to aggregate by a field (either direct or from joined table)
            const aggregateByField = (
                getName: (e: any) => string | undefined
            ): Array<{ name: string; count: number; paidCount: number; revenue: number }> => {
                const map = new Map<string, { count: number; paidCount: number; revenue: number }>();

                enrollments.forEach((e) => {
                    const name = getName(e) || "Não Informado";
                    const current = map.get(name) || { count: 0, paidCount: 0, revenue: 0 };
                    const isPaid = e.financial_status === "paid";
                    const amount = Number(e.payment_amount) || 0;

                    map.set(name, {
                        count: current.count + 1,
                        paidCount: current.paidCount + (isPaid ? 1 : 0),
                        revenue: current.revenue + (isPaid ? amount : 0),
                    });
                });

                return Array.from(map.entries())
                    .map(([name, data]) => ({ name, ...data }))
                    .sort((a, b) => b.count - a.count);
            };

            const funis = aggregateByField((e) => e.funnel_name);
            const macroOrigens = aggregateByField((e) => e.macro_origin_name);
            const microOrigens = aggregateByField((e) => e.micro_origin_name);
            const variacaoMicro = aggregateByField((e) => e.micro_variation_name);
            const variacaoNano = aggregateByField((e) => e.nano_variation_name);

            return {
                funis,
                macroOrigens,
                microOrigens,
                variacaoMicro,
                variacaoNano,
            };
        },
        staleTime: 1000 * 60 * 5,
    });
}
