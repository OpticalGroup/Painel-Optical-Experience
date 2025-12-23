import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OriginHierarchyData {
    funis: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
    macroOrigens: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
    microOrigens: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
    variacaoMicro: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
    variacaoNano: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
}

export function useOriginHierarchy() {
    return useQuery({
        queryKey: ["origin-hierarchy"],
        queryFn: async (): Promise<OriginHierarchyData> => {
            const { data: enrollments, error } = await supabase
                .from("enrollments")
                .select(`
                    id,
                    financial_status,
                    payment_amount,
                    funnel_id,
                    macro_origin_id,
                    micro_origin_id,
                    micro_variation_id,
                    funnels(name),
                    macro_origins(name),
                    micro_origins(name),
                    micro_variations(name)
                `);

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

            const funis = aggregateByField((e) => e.funnels?.name);
            const macroOrigens = aggregateByField((e) => e.macro_origins?.name);
            const microOrigens = aggregateByField((e) => e.micro_origins?.name);
            const variacaoMicro = aggregateByField((e) => e.micro_variations?.name);
            const variacaoNano: Array<{ name: string; count: number; paidCount: number; revenue: number }> = [];

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
