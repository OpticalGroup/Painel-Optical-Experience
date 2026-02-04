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

export interface UtmStatsItem {
  name: string;
  count: number;
  percentage: number;
}

export interface AllUtmStats {
  source: UtmStatsItem[];
  medium: UtmStatsItem[];
  campaign: UtmStatsItem[];
  content: UtmStatsItem[];
  term: UtmStatsItem[];
  page: UtmStatsItem[];
}

export interface NucleoStats {
  id: string;
  name: string;
  totalSales: number;
  paidSales: number;
  totalRevenue: number;
}

export interface CohortAnalyticsStats {
  cohortId: string;
  enrolledCount: number;
  paidCount: number;
  reservedCount: number;
  signedCount: number;
  revenue: number;
}

export interface AnalyticsFilters {
  from?: Date;
  to?: Date;
  cohortId?: string;
  status?: string;
}

export const useEnrollmentAnalytics = (filters?: AnalyticsFilters) => {
  return useQuery({
    queryKey: ["enrollment-analytics", filters],
    queryFn: async () => {
      // Buscar enrollments com filtros opcionais de data
      let query = supabase
        .from("enrollments")
        .select(`
          id,
          sales_rep,
          student_name,
          macro_origin_id,
          macro_origins!enrollments_macro_origin_id_fkey(name),
          financial_status,
          contract_status,
          payment_amount,
          lead_date,
          purchase_date,
          created_at,
          cohort_id,
          utm_source,
          utm_medium,
          utm_campaign,
          external_metadata,
          nucleo_id
        `);

      // Aplicar filtros de data se fornecidos
      if (filters?.from) {
        query = query.gte("created_at", filters.from.toISOString());
      }
      if (filters?.to) {
        query = query.lte("created_at", filters.to.toISOString());
      }
      if (filters?.cohortId && filters.cohortId !== "all") {
        if (filters.cohortId.includes(',')) {
          query = query.in("cohort_id", filters.cohortId.split(','));
        } else {
          query = query.eq("cohort_id", filters.cohortId);
        }
      }

      // Fetch enrollments, nucleos, and sellers in parallel
      const [enrollmentsResponse, nucleosResponse, sellersResponse] = await Promise.all([
        query.order("created_at", { ascending: false }),
        supabase.from('nucleos').select('id, name'),
        supabase.from('sellers').select('name, nucleo_id')
      ]);

      const enrollments = enrollmentsResponse.data;
      const nucleos = nucleosResponse.data || [];
      const sellers = sellersResponse.data || [];
      const error = enrollmentsResponse.error || nucleosResponse.error || sellersResponse.error;

      if (error) throw error;

      // Create maps for quick access
      const nucleoMap = new Map<string, string>();
      nucleos.forEach(n => nucleoMap.set(n.id, n.name));

      const sellerNucleoMap = new Map<string, string>();
      sellers.forEach(s => {
        if (s.name && s.nucleo_id) {
          sellerNucleoMap.set(s.name, s.nucleo_id);
        }
      });

      // Filter out cancelled enrollments for analytics unless specifically requested
      // or if we want to show stats for cancelled students
      const activeEnrollments = enrollments?.filter(e => {
        const metadata = e.external_metadata as any;
        // Se houver filtro de status, aplicar
        if (filters?.status && filters.status !== 'all') {
          // Mapear status financeiro ou status do aluno
          if (filters.status === 'paid' && e.financial_status !== 'paid') return false;
          if (filters.status === 'pending' && e.financial_status !== 'pending') return false;
          if (filters.status === 'cancelled' && metadata?.status !== 'cancelled') return false;
          // Se o filtro for 'active' (padrão), excluir cancelados
          if (filters.status === 'active' && metadata?.status === 'cancelled') return false;
        } else {
          // Comportamento padrão: excluir cancelados
          if (metadata?.status === 'cancelled') return false;
        }
        return true;
      });

      // Use activeEnrollments instead of enrollments for calculations
      const dataToAnalyze = activeEnrollments || [];

      // Calcular estatísticas por vendedor
      const salesRepMap = new Map<string, SalesRepStats>();
      dataToAnalyze.forEach((enrollment) => {
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

      // Calcular estatísticas por origem (Macro Origin)
      const sourceMap = new Map<string, SourceStats>();
      dataToAnalyze.forEach((enrollment: any) => {
        const source = enrollment.macro_origins?.name || "Não informado";
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

      // Helper para calcular stats de UTM
      const calculateUtmTypeStats = (type: 'source' | 'medium' | 'campaign' | 'term' | 'content' | 'page') => {
        const map = new Map<string, number>();
        let total = 0;

        dataToAnalyze.forEach((enrollment) => {
          const metadata = enrollment.external_metadata as any;
          // Tentar pegar do nível superior (se existir) ou do metadata
          let value = '';

          if (type === 'source') value = enrollment.utm_source || metadata?.utm_source;
          else if (type === 'medium') value = enrollment.utm_medium || metadata?.utm_medium;
          else if (type === 'campaign') value = enrollment.utm_campaign || metadata?.utm_campaign;
          else if (type === 'term') value = metadata?.utm_term; // Assumindo metadata por enquanto
          else if (type === 'content') value = metadata?.utm_content;
          else if (type === 'page') value = metadata?.utm_page;

          if (value) {
            map.set(value, (map.get(value) || 0) + 1);
            total++;
          }
        });

        return Array.from(map.entries())
          .map(([name, count]) => ({
            name,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0,
          }))
          .sort((a, b) => b.count - a.count);
      };

      const utmStats: AllUtmStats = {
        source: calculateUtmTypeStats('source'),
        medium: calculateUtmTypeStats('medium'),
        campaign: calculateUtmTypeStats('campaign'),
        term: calculateUtmTypeStats('term'),
        content: calculateUtmTypeStats('content'),
        page: calculateUtmTypeStats('page'),
      };

      // Calcular taxa de conversão
      sourceMap.forEach((stats) => {
        stats.conversionRate = stats.count > 0 ? (stats.paidCount / stats.count) * 100 : 0;
      });

      // Calcular janela de conversão por turma
      const cohortConversionMap = new Map<string, { days: number[]; name: string }>();
      dataToAnalyze.forEach((enrollment) => {
        if (enrollment.lead_date && enrollment.purchase_date) {
          const cohortId = enrollment.cohort_id;
          const cohortName = "Turma";

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

      // Calcular resumo geral
      const summary = {
        totalEnrolled: dataToAnalyze.length,
        totalRevenue: dataToAnalyze
          .filter(e => e.financial_status === 'paid')
          .reduce((sum, e) => sum + (Number(e.payment_amount) || 0), 0),
        totalPaid: dataToAnalyze.filter(e => e.financial_status === 'paid').length,
      };

      // Calcular estatísticas por turma (Cohort)
      const cohortStatsMap = new Map<string, CohortAnalyticsStats>();
      const nucleoStatsMap = new Map<string, NucleoStats>();

      dataToAnalyze.forEach((enrollment) => {
        const cohortId = enrollment.cohort_id;
        if (cohortId) {
          if (!cohortStatsMap.has(cohortId)) {
            cohortStatsMap.set(cohortId, {
              cohortId,
              enrolledCount: 0,
              paidCount: 0,
              reservedCount: 0,
              signedCount: 0,
              revenue: 0,
            });
          }
          const stats = cohortStatsMap.get(cohortId)!;
          stats.enrolledCount++;
          if (enrollment.financial_status === "paid") {
            stats.paidCount++;
            stats.revenue += Number(enrollment.payment_amount) || 0;
          } else if (enrollment.financial_status === "pending") {
            stats.reservedCount++;
          }

          if (enrollment.contract_status === "signed") {
            stats.signedCount++;
          }
        }

        // Calculate Nucleo stats
        // First try direct link, then fallback to seller configuration
        let nId = (enrollment as any).nucleo_id;

        if (!nId && enrollment.sales_rep) {
          const sellerNucleo = sellerNucleoMap.get(enrollment.sales_rep);
          if (sellerNucleo) {
            nId = sellerNucleo;
          }
        }

        const nName = nId ? nucleoMap.get(nId) : undefined;

        if (nId) {
          if (!nucleoStatsMap.has(nId)) {
            nucleoStatsMap.set(nId, {
              id: nId,
              name: nName || "Desconhecido", // Fallback if name is missing
              totalSales: 0,
              paidSales: 0,
              totalRevenue: 0
            });
          }
          const nStats = nucleoStatsMap.get(nId)!;
          nStats.totalSales++;

          if (enrollment.financial_status === "paid") {
            nStats.paidSales++;
            nStats.totalRevenue += Number(enrollment.payment_amount) || 0;
          }
        }

        // Attach inferred data to enrollment object so UI components can use it
        if (nId && !(enrollment as any).nucleo_id) {
          (enrollment as any).nucleo_id = nId;
        }
        if (nName) {
          (enrollment as any).nucleo_name = nName;
        }
      });

      return {
        summary,
        salesReps: Array.from(salesRepMap.values()),
        sources: Array.from(sourceMap.values()),
        cohortStats: Array.from(cohortStatsMap.values()),
        nucleos: Array.from(nucleoStatsMap.values()),
        utmStats,
        conversions: conversionStats,
        enrollments: dataToAnalyze,
      };
    },
  });
};
