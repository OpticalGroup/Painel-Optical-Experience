import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OriginHierarchyData {
    funis: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
    macroCOrigens: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
    microOrigens: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
    variacaoMicro: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
    variacaoNano: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
}

export function useOriginHierarchy() {
    return useQuery({
        queryKey: ["origin-hierarchy"],
        queryFn: async (): Promise<OriginHierarchyData> => {
            // Try to fetch from enrollments with origin hierarchy fields
            // If tables don't exist yet, we'll use the source field as fallback
            const { data: enrollments, error } = await supabase
                .from("enrollments")
                .select(`
                    id,
                    source,
                    financial_status,
                    payment_amount,
                    product_name
                `);

            if (error) {
                console.error("Error fetching origin hierarchy data:", error);
                throw error;
            }

            if (!enrollments || enrollments.length === 0) {
                return {
                    funis: [],
                    macroCOrigens: [],
                    microOrigens: [],
                    variacaoMicro: [],
                    variacaoNano: [],
                };
            }

            // Helper to aggregate by a field
            const aggregateByField = (
                getValue: (e: typeof enrollments[0]) => string
            ): Array<{ name: string; count: number; paidCount: number; revenue: number }> => {
                const map = new Map<string, { count: number; paidCount: number; revenue: number }>();

                enrollments.forEach((e) => {
                    const value = getValue(e) || "Não informado";
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
                    .filter(item => item.name !== "Não informado" || item.count > 0)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10); // Top 10
            };

            // For now, we'll derive hierarchy from existing fields
            // This can be updated once the hierarchy tables are in place

            // Funil: Derive from product_name or a default
            const funis = aggregateByField((e) => {
                const product = e.product_name;
                if (!product) return "Optical Experience";
                if (product.toLowerCase().includes("mentorado")) return "Mentorado";
                if (product.toLowerCase().includes("premium")) return "Premium";
                return product;
            });

            // Macro Origins: Group sources into categories
            const macroOrigens = aggregateByField((e) => {
                const source = e.source || "";
                if (source.includes("Instagram") || source.includes("Facebook")) return "Redes Sociais";
                if (source.includes("Tráfego Pago")) return "Tráfego Pago";
                if (source.includes("Indicação") || source.includes("Programa")) return "Indicação";
                if (source.includes("API") || source.includes("WEB")) return "Digital";
                if (source.includes("Aluno")) return "Base de Clientes";
                return "Orgânico";
            });

            // Micro Origins: Use the actual source
            const microOrigens = aggregateByField((e) => e.source || "Não Rastreada");

            // Variação Micro: For now, we can use a placeholder or derive from source details
            // This would typically come from a dedicated field
            const variacaoMicro: Array<{ name: string; count: number; paidCount: number; revenue: number }> = [];

            // Variação Nano: Rarely used, leave empty for now
            const variacaoNano: Array<{ name: string; count: number; paidCount: number; revenue: number }> = [];

            return {
                funis,
                macroCOrigens: macroOrigens,
                microOrigens,
                variacaoMicro,
                variacaoNano,
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
