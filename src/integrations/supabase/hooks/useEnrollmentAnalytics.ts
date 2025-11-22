import { useQuery } from "@tanstack/react-query";
import { supabase } from "../client";
import { differenceInDays } from "date-fns";

export interface SalesRepStats {
  name: string;
  totalSales: number;
  paidSales: number;
  totalRevenue: number;
}

export interface SourceStats {
  source: string;
  count: number;
  paidCount: number;
  conversionRate: number;
}

export interface ConversionStats {
  cohortId: string;
  cohortName: string;
  avgDays: number;
  totalConversions: number;
}

export const useEnrollmentAnalytics = (dateRange?: { from?: Date; to?: Date }) => {
  return useQuery({
    queryKey: ["enrollment-analytics", dateRange],
    queryFn: async () => {
      // Buscar enrollments com filtros opcionais de data
      let query = supabase
        .from("enrollments")
        .select(`
          id,
          sales_rep,
          source,
          financial_status,
          payment_amount,
          lead_date,
          purchase_date,
          created_at,
          cohort_id,
          cohorts (
            id,
            name
          )
        `);

      // Aplicar filtros de data se fornecidos
      if (dateRange?.from) {
        query = query.gte("created_at", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte("created_at", dateRange.to.toISOString());
      }

      const { data: enrollments, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      // Calcular estatísticas por vendedor
      const salesRepMap = new Map<string, SalesRepStats>();
      enrollments?.forEach((enrollment) => {
        const rep = enrollment.sales_rep || "Não atribuído";
        if (!salesRepMap.has(rep)) {
          salesRepMap.set(rep, {
            name: rep,
            totalSales: 0,
            paidSales: 0,
            totalRevenue: 0,
          });
        }
        const stats = salesRepMap.get(rep)!;
        stats.totalSales++;
        if (enrollment.financial_status === "paid") {
          stats.paidSales++;
          stats.totalRevenue += Number(enrollment.payment_amount) || 0;
        }
      });

      // Calcular estatísticas por origem
      const sourceMap = new Map<string, SourceStats>();
      enrollments?.forEach((enrollment) => {
        const source = enrollment.source || "Outro";
        if (!sourceMap.has(source)) {
          sourceMap.set(source, {
            source,
            count: 0,
            paidCount: 0,
            conversionRate: 0,
          });
        }
        const stats = sourceMap.get(source)!;
        stats.count++;
        if (enrollment.financial_status === "paid") {
          stats.paidCount++;
        }
      });

      // Calcular taxa de conversão
      sourceMap.forEach((stats) => {
        stats.conversionRate = stats.count > 0 ? (stats.paidCount / stats.count) * 100 : 0;
      });

      // Calcular janela de conversão por turma
      const cohortConversionMap = new Map<string, { days: number[]; name: string }>();
      enrollments?.forEach((enrollment) => {
        if (enrollment.lead_date && enrollment.purchase_date) {
          const cohortId = enrollment.cohort_id;
          const cohortName = enrollment.cohorts?.name || "Turma desconhecida";
          
          if (!cohortConversionMap.has(cohortId)) {
            cohortConversionMap.set(cohortId, { days: [], name: cohortName });
          }
          
          const days = differenceInDays(
            new Date(enrollment.purchase_date),
            new Date(enrollment.lead_date)
          );
          
          if (days >= 0) {
            cohortConversionMap.get(cohortId)!.days.push(days);
          }
        }
      });

      const conversionStats: ConversionStats[] = Array.from(cohortConversionMap.entries())
        .map(([cohortId, data]) => {
          const avgDays = data.days.reduce((sum, d) => sum + d, 0) / data.days.length;
          return {
            cohortId,
            cohortName: data.name,
            avgDays,
            totalConversions: data.days.length,
          };
        })
        .filter((stat) => stat.totalConversions > 0);

      return {
        salesReps: Array.from(salesRepMap.values()),
        sources: Array.from(sourceMap.values()),
        conversions: conversionStats,
      };
    },
  });
};
