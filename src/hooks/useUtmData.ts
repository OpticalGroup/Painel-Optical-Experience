import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UtmData {
    campaign: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
    source: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
    medium: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
    content: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
    term: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
}

export function useUtmData() {
    return useQuery({
        queryKey: ["utm-data"],
        queryFn: async (): Promise<UtmData> => {
            // Fetch enrollments with UTM data
            const { data: enrollments, error } = await supabase
                .from("enrollments")
                .select("utm_source, utm_medium, utm_campaign, utm_content, utm_term, financial_status, payment_amount, product_name")
                .eq("product_name", "Optical Experience");

            if (error) {
                console.error("Error fetching UTM data:", error);
                throw error;
            }

            if (!enrollments || enrollments.length === 0) {
                return {
                    campaign: [],
                    source: [],
                    medium: [],
                    content: [],
                    term: [],
                };
            }

            // Helper to aggregate by a UTM field
            const aggregateByField = (field: keyof typeof enrollments[0]): Array<{ name: string; count: number; paidCount: number; revenue: number }> => {
                const map = new Map<string, { count: number; paidCount: number; revenue: number }>();

                enrollments.forEach((e) => {
                    const value = (e[field] as string) || "Não informado";
                    const current = map.get(value) || { count: 0, paidCount: 0, revenue: 0 };
                    const isPaid = e.financial_status === "paid";

                    map.set(value, {
                        count: current.count + 1,
                        paidCount: current.paidCount + (isPaid ? 1 : 0),
                        revenue: current.revenue + (isPaid ? (e.payment_amount || 2000) : 0),
                    });
                });

                return Array.from(map.entries())
                    .map(([name, data]) => ({ name, ...data }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10); // Top 10
            };

            return {
                campaign: aggregateByField("utm_campaign"),
                source: aggregateByField("utm_source"),
                medium: aggregateByField("utm_medium"),
                content: aggregateByField("utm_content"),
                term: aggregateByField("utm_term"),
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
