import { Card } from "@/components/ui/card";
import { Timer, TrendingDown } from "lucide-react";
import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConversionData {
  cohortName: string;
  avgDays: number;
  totalConversions: number;
}

interface ConversionAnalysisProps {
  data: ConversionData[];
  action?: React.ReactNode;
}

export const ConversionAnalysis = ({ data, action }: ConversionAnalysisProps) => {
  const globalAvg = useMemo(() => {
    if (data.length === 0) return 0;
    const totalDays = data.reduce((sum, item) => sum + (item.avgDays * item.totalConversions), 0);
    const totalConversions = data.reduce((sum, item) => sum + item.totalConversions, 0);
    return totalConversions > 0 ? totalDays / totalConversions : 0;
  }, [data]);

  const sortedData = [...data].sort((a, b) => a.avgDays - b.avgDays);

  return (
    <Card className="p-6 border border-border bg-card hover:shadow-md transition-all duration-300">

      {/* ... inside component ... */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-lg">
            <Timer className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      Janela de Conversão
                    </h3>
                    <p className="text-sm text-muted-foreground">Tempo médio Lead → Pagamento</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tempo médio entre a data de chegada do lead e a data do pagamento.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{globalAvg.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">dias em média</div>
          </div>
          {action && <div>{action}</div>}
        </div>
      </div>

      <div className="space-y-2.5">
        {sortedData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma conversão registrada ainda
          </p>
        ) : (
          sortedData.map((item, index) => {
            const isAboveAvg = item.avgDays > globalAvg;

            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-1.5 h-8 rounded-full ${isAboveAvg ? 'bg-yellow-500' : 'bg-green-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.cohortName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.totalConversions} conversões
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-foreground">
                    {item.avgDays.toFixed(0)}
                  </span>
                  <span className="text-sm text-muted-foreground">dias</span>
                  {isAboveAvg && (
                    <TrendingDown className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          ⚡ Turmas com conversão rápida têm melhor taxa de fechamento
        </p>
      </div>
    </Card>
  );
};
