import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays } from "date-fns";

export interface PurchaseWindowData {
    averageDays: number;
    totalConversions: number;
    byVendedor: Array<{
        name: string;
        averageDays: number;
        conversions: number;
    }>;
    byOrigem?: Array<{
        name: string;
        averageDays: number;
        conversions: number;
    }>;
}

export function usePurchaseWindow() {
    return useQuery({
        queryKey: ["purchase-window"],
        queryFn: async (): Promise<PurchaseWindowData> => {
            // Fetch enrollments with both lead_date and purchase_date
            const { data: enrollments, error } = await supabase
                .from("enrollments")
                .select("id, lead_date, purchase_date, sales_rep, source, financial_status")
                .not("lead_date", "is", null)
                .not("purchase_date", "is", null)
                .eq("financial_status", "paid");

            if (error) {
                console.error("Error fetching purchase window data:", error);
                throw error;
            }

            if (!enrollments || enrollments.length === 0) {
                return {
                    averageDays: 0,
                    totalConversions: 0,
                    byVendedor: [],
                    byOrigem: [],
                };
            }

            // Calculate days between lead_date and purchase_date for each enrollment
            const conversions = enrollments.map((e) => {
                const leadDate = new Date(e.lead_date!);
                const purchaseDate = new Date(e.purchase_date!);
                const days = differenceInDays(purchaseDate, leadDate);
                return {
                    ...e,
                    days: Math.max(0, days), // Ensure non-negative
                };
            });

            // Calculate overall average
            const totalDays = conversions.reduce((sum, c) => sum + c.days, 0);
            const averageDays = conversions.length > 0 ? totalDays / conversions.length : 0;

            // Group by vendedor (sales_rep)
            const vendedorMap = new Map<string, { totalDays: number; count: number }>();
            conversions.forEach((c) => {
                const rep = c.sales_rep || "Não informado";
                const current = vendedorMap.get(rep) || { totalDays: 0, count: 0 };
                vendedorMap.set(rep, {
                    totalDays: current.totalDays + c.days,
                    count: current.count + 1,
                });
            });

            const byVendedor = Array.from(vendedorMap.entries())
                .map(([name, data]) => ({
                    name,
                    averageDays: data.count > 0 ? data.totalDays / data.count : 0,
                    conversions: data.count,
                }))
                .sort((a, b) => a.averageDays - b.averageDays); // Sort by fastest first

            // Group by origem (source)
            const origemMap = new Map<string, { totalDays: number; count: number }>();
            conversions.forEach((c) => {
                const source = c.source || "Não informado";
                const current = origemMap.get(source) || { totalDays: 0, count: 0 };
                origemMap.set(source, {
                    totalDays: current.totalDays + c.days,
                    count: current.count + 1,
                });
            });

            const byOrigem = Array.from(origemMap.entries())
                .map(([name, data]) => ({
                    name,
                    averageDays: data.count > 0 ? data.totalDays / data.count : 0,
                    conversions: data.count,
                }))
                .sort((a, b) => a.averageDays - b.averageDays);

            return {
                averageDays,
                totalConversions: conversions.length,
                byVendedor,
                byOrigem,
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
