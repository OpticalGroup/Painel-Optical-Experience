import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type ReportType = 'dashboard' | 'cohorts' | 'cohort-detail' | 'sales-reps' | 'sources' | 'conversion';

interface ExportOptions {
  type: ReportType;
  cohortId?: string;
  format?: 'csv' | 'json';
}

export const useExportReport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportReport = async (options: ExportOptions) => {
    setIsExporting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Você precisa estar autenticado para exportar relatórios");
      }

      const response = await supabase.functions.invoke('generate-report', {
        body: options,
      });

      if (response.error) {
        throw response.error;
      }

      // If CSV format, the response.data will be the CSV string
      if (options.format === 'csv' || !options.format) {
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio-${options.type}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Relatório exportado com sucesso!",
        description: "O arquivo foi baixado para seu computador.",
      });
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Erro ao exportar relatório",
        description: error.message || "Ocorreu um erro ao gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return { exportReport, isExporting };
};
