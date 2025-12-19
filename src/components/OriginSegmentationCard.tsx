import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { MapPin, TrendingUp, Users, Layers, Target, Crosshair, GitBranch } from "lucide-react";
import { Enrollment } from "@/components/enrollments/types";
import { useOriginHierarchy } from "@/integrations/supabase/hooks/useOriginHierarchy";

interface OriginSegmentationCardProps {
  enrollments: Enrollment[];
  isLoading?: boolean;
}

// Cores vibrantes para o gráfico
const COLORS = [
  "hsl(280, 85%, 65%)",   // Purple (Primary)
  "hsl(340, 85%, 60%)",   // Pink
  "hsl(200, 85%, 55%)",   // Blue
  "hsl(160, 75%, 50%)",   // Teal
  "hsl(45, 90%, 55%)",    // Yellow
  "hsl(25, 90%, 55%)",    // Orange
  "hsl(320, 75%, 60%)",   // Magenta
  "hsl(180, 70%, 50%)",   // Cyan
  "hsl(100, 65%, 50%)",   // Green
  "hsl(0, 75%, 60%)",     // Red
  "hsl(260, 70%, 60%)",   // Violet
  "hsl(220, 70%, 55%)",   // Indigo
];

interface OriginData {
  name: string;
  value: number;
  paid: number;
  pending: number;
  revenue: number;
  percentage: number;
  color: string;
}

type ViewLevel = 'source' | 'funnel' | 'macro' | 'micro' | 'variation';

export const OriginSegmentationCard = ({ enrollments, isLoading }: OriginSegmentationCardProps) => {
  const [viewLevel, setViewLevel] = useState<ViewLevel>('source');
  const { funnels, macroOrigins, microOrigins, microVariations, isLoading: hierarchyLoading } = useOriginHierarchy();

  const originData = useMemo(() => {
    // Filtra apenas matrículas ativas (não canceladas)
    const activeEnrollments = enrollments.filter(
      e => (e.external_metadata as any)?.status !== 'cancelled'
    );

    // Agrupa por origem baseado no nível selecionado
    const originMap = new Map<string, {
      count: number;
      paid: number;
      pending: number;
      revenue: number;
    }>();

    activeEnrollments.forEach(enrollment => {
      let groupKey: string;

      switch (viewLevel) {
        case 'funnel':
          // Group by funnel_id
          const funnelId = (enrollment as any).funnel_id;
          const funnel = funnels.find(f => f.id === funnelId);
          groupKey = funnel?.name || 'Sem Funil';
          break;
        case 'macro':
          // Group by macro_origin_id
          const macroId = (enrollment as any).macro_origin_id;
          const macro = macroOrigins.find(m => m.id === macroId);
          groupKey = macro?.name || enrollment.source || 'Não Rastreada';
          break;
        case 'micro':
          // Group by micro_origin_id
          const microId = (enrollment as any).micro_origin_id;
          const micro = microOrigins.find(m => m.id === microId);
          groupKey = micro?.name || 'Sem Origem Micro';
          break;
        case 'variation':
          // Group by micro_variation_id
          const variationId = (enrollment as any).micro_variation_id;
          const variation = microVariations.find(v => v.id === variationId);
          groupKey = variation?.name || 'Sem Variação';
          break;
        default:
          // Default: use source field (legacy)
          groupKey = enrollment.source || "Não Rastreada";
      }

      const existing = originMap.get(groupKey) || { count: 0, paid: 0, pending: 0, revenue: 0 };

      existing.count += 1;
      if (enrollment.financial_status === 'paid') {
        existing.paid += 1;
        existing.revenue += enrollment.payment_amount || 0;
      } else {
        existing.pending += 1;
      }

      originMap.set(groupKey, existing);
    });

    // Converte para array e ordena por quantidade
    const origins: OriginData[] = Array.from(originMap.entries())
      .map(([name, data], index) => ({
        name,
        value: data.count,
        paid: data.paid,
        pending: data.pending,
        revenue: data.revenue,
        percentage: activeEnrollments.length > 0
          ? Math.round((data.count / activeEnrollments.length) * 100)
          : 0,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);

    return origins;
  }, [enrollments, viewLevel, funnels, macroOrigins, microOrigins, microVariations]);

  const totalEnrollments = originData.reduce((sum, o) => sum + o.value, 0);
  const totalPaid = originData.reduce((sum, o) => sum + o.paid, 0);
  const totalRevenue = originData.reduce((sum, o) => sum + o.revenue, 0);

  const getViewLevelLabel = () => {
    switch (viewLevel) {
      case 'funnel': return 'Funil';
      case 'macro': return 'Origem Macro';
      case 'micro': return 'Origem Micro';
      case 'variation': return 'Variação';
      default: return 'Origem (Legado)';
    }
  };

  const getViewLevelIcon = () => {
    switch (viewLevel) {
      case 'funnel': return <Layers className="h-4 w-4" />;
      case 'macro': return <Target className="h-4 w-4" />;
      case 'micro': return <Crosshair className="h-4 w-4" />;
      case 'variation': return <GitBranch className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  if (isLoading || hierarchyLoading) {
    return (
      <Card className="p-6 border border-border bg-card animate-pulse">
        <div className="h-64 bg-muted rounded"></div>
      </Card>
    );
  }

  if (originData.length === 0) {
    return (
      <Card className="p-6 border border-border bg-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Segmentação por Origem</h3>
            <p className="text-sm text-muted-foreground">Distribuição das matrículas por fonte</p>
          </div>
        </div>
        <p className="text-center text-muted-foreground py-8">
          Nenhuma matrícula registrada nesta turma.
        </p>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as OriginData;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-foreground">{data.name}</p>
          <div className="mt-2 space-y-1 text-sm">
            <p className="text-muted-foreground">
              Total: <span className="text-foreground font-medium">{data.value} matrículas</span>
            </p>
            <p className="text-muted-foreground">
              Pagas: <span className="text-primary font-medium">{data.paid}</span>
            </p>
            <p className="text-muted-foreground">
              Pendentes: <span className="text-secondary font-medium">{data.pending}</span>
            </p>
            <p className="text-muted-foreground">
              Receita: <span className="text-foreground font-medium">
                {data.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            {getViewLevelIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Segmentação por {getViewLevelLabel()}</h3>
            <p className="text-sm text-muted-foreground">Distribuição das matrículas</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Matrículas</p>
            <p className="text-lg font-bold text-foreground">{totalEnrollments}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Receita Total</p>
            <p className="text-lg font-bold text-primary">
              {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>
      </div>

      {/* View Level Selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button
          variant={viewLevel === 'source' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewLevel('source')}
          className="gap-1"
        >
          <MapPin className="h-3 w-3" />
          Origem (Legado)
        </Button>
        <Button
          variant={viewLevel === 'funnel' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewLevel('funnel')}
          className="gap-1"
        >
          <Layers className="h-3 w-3" />
          Funil
        </Button>
        <Button
          variant={viewLevel === 'macro' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewLevel('macro')}
          className="gap-1"
        >
          <Target className="h-3 w-3" />
          Macro
        </Button>
        <Button
          variant={viewLevel === 'micro' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewLevel('micro')}
          className="gap-1"
        >
          <Crosshair className="h-3 w-3" />
          Micro
        </Button>
        <Button
          variant={viewLevel === 'variation' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewLevel('variation')}
          className="gap-1"
        >
          <GitBranch className="h-3 w-3" />
          Variação
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={originData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percentage }) => `${percentage}%`}
                labelLine={false}
              >
                {originData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Lista de Origens */}
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
          {originData.map((origin, index) => (
            <div
              key={origin.name}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: origin.color }}
                />
                <div>
                  <p className="font-medium text-foreground text-sm">{origin.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      <Users className="h-3 w-3 mr-1" />
                      {origin.value}
                    </Badge>
                    {origin.paid > 0 && (
                      <Badge className="text-xs px-1.5 py-0 bg-primary/20 text-primary border-0">
                        {origin.paid} pagas
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">{origin.percentage}%</p>
                {origin.revenue > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {origin.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights Rápidos */}
      {originData.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Melhor {getViewLevelLabel().toLowerCase()}:</span>
            <span className="font-semibold text-foreground">{originData[0].name}</span>
            <span className="text-muted-foreground">com</span>
            <Badge className="bg-primary/20 text-primary border-0">
              {originData[0].percentage}% das matrículas
            </Badge>
          </div>
        </div>
      )}
    </Card>
  );
};
