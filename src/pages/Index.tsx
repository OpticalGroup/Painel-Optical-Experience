import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, TrendingUp, DollarSign, ArrowRight, Calendar, MapPin, Upload, FileSignature, Clock, Target, CalendarIcon, HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn, formatBRL } from "@/lib/utils";
import { StatsCard } from "@/components/StatsCard";
import { Card } from "@/components/ui/card";
import { EnrollmentModal, EnrollmentData } from "@/components/EnrollmentModal";
import { CsvImportModal } from "@/components/CsvImportModal";
import { useToast } from "@/hooks/use-toast";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { UserMenu } from "@/components/UserMenu";
import { useCohortsQuery } from "@/integrations/supabase/hooks/useCohorts";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SmartAlert } from "@/components/SmartAlert";
import { HealthWidget } from "@/components/HealthWidget";
import { TrendChart } from "@/components/TrendChart";
import { RankingCard } from "@/components/RankingCard";
import { ConversionAnalysis } from "@/components/ConversionAnalysis";
import { UtmAnalytics } from "@/components/dashboard/UtmAnalytics";
import { useEnrollmentAnalytics } from "@/integrations/supabase/hooks/useEnrollmentAnalytics";
import { ExportButton } from "@/components/ExportButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Index = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [csvImportModalOpen, setCsvImportModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedCohortId, setSelectedCohortId] = useState<string>("all");
  const [utmStatusFilter, setUtmStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: cohorts, isLoading } = useCohortsQuery();
  const { data: analytics, isLoading: isLoadingAnalytics } = useEnrollmentAnalytics({
    ...dateRange,
    cohortId: selectedCohortId,
    status: utmStatusFilter
  });

  // Encontrar a próxima turma baseado na data atual
  const today = new Date();

  // Filtrar cohorts baseado no dateRange
  const filteredCohorts = useMemo(() => {
    if (!cohorts) return [];
    let filtered = cohorts;

    if (dateRange.from) {
      filtered = filtered.filter(c => new Date(c.start_date) >= dateRange.from!);
    }
    if (dateRange.to) {
      filtered = filtered.filter(c => new Date(c.start_date) <= dateRange.to!);
    }

    return filtered;
  }, [cohorts, dateRange]);

  const upcomingCohorts = filteredCohorts
    .filter(c => new Date(c.start_date) > today)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  const nextCohort = upcomingCohorts[0] || filteredCohorts?.[0];

  // Calculate totals com base nos analytics (que respeitam o filtro de data de criação da matrícula)
  const totalEnrolled = analytics?.summary?.totalEnrolled || 0;
  const totalPaid = analytics?.summary?.totalPaid || 0;
  const totalRevenue = analytics?.summary?.totalRevenue || 0;

  // Capacity ainda vem dos cohorts filtrados pois é uma métrica de turma
  const totalCapacity = filteredCohorts.reduce((sum, c) => sum + c.capacity, 0);

  // Smart insights calculations com base nos cohorts filtrados
  const paidWithoutSignature = useMemo(() => {
    return filteredCohorts.reduce((sum, c) => {
      const paidCount = c.stats?.paid_count || 0;
      const signedCount = c.stats?.signed_count || 0;
      return sum + Math.max(0, paidCount - signedCount);
    }, 0);
  }, [filteredCohorts]);

  // Calcular matrículas aguardando pagamento há mais de 7 dias
  const oldReserves = useMemo(() => {
    if (!analytics?.salesReps) return 0;
    // Por enquanto retornando 0, precisa de campo de data de reserva na tabela
    return 0;
  }, [analytics]);

  // Gerar dados de tendência baseado em dados reais dos últimos 6 meses
  const trendData = useMemo(() => {
    if (!cohorts || cohorts.length === 0) return [];

    const months = [];
    const now = new Date();

    // Gerar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = format(date, "MMM", { locale: ptBR });

      // Filtrar cohorts deste mês
      const monthCohorts = cohorts.filter(c => {
        const cohortDate = new Date(c.start_date);
        return cohortDate.getMonth() === date.getMonth() &&
          cohortDate.getFullYear() === date.getFullYear();
      });

      // Calcular ocupação média do mês
      const avgOccupancy = monthCohorts.length > 0
        ? monthCohorts.reduce((sum, c) => {
          const occupancy = ((c.stats?.enrolled_count || 0) / c.capacity) * 100;
          return sum + occupancy;
        }, 0) / monthCohorts.length
        : 0;

      months.push({
        month: monthName,
        value: avgOccupancy,
      });
    }

    return months;
  }, [cohorts]);

  // Smart alerts para próxima turma
  const nextCohortAlerts = useMemo(() => {
    if (!nextCohort) return [];

    const alerts = [];
    const occupancyRate = (nextCohort.stats?.enrolled_count || 0) / nextCohort.capacity;
    const daysUntilStart = differenceInDays(new Date(nextCohort.start_date), today);

    if (occupancyRate >= 0.9) {
      alerts.push({
        type: "warning" as const,
        title: "AÇÃO COMERCIAL NECESSÁRIA",
        message: `A turma está com ${Math.round(occupancyRate * 100)}% de ocupação. Considere abrir uma nova turma.`,
        actionLabel: "Ver Turmas",
      });
    }

    if (occupancyRate < 0.5 && daysUntilStart < 30 && daysUntilStart > 0) {
      alerts.push({
        type: "danger" as const,
        title: "RISCO DE CANCELAMENTO",
        message: `Apenas ${Math.round(occupancyRate * 100)}% ocupada faltando ${daysUntilStart} dias para iniciar.`,
        actionLabel: "Estratégia Comercial",
      });
    }

    return alerts;
  }, [nextCohort, today]);

  const handleEnrollmentSubmit = (data: EnrollmentData) => {
    // Modal handles the mutation directly
  };

  // Dados do gráfico da próxima turma
  const available = nextCohort ? (nextCohort.stats?.available_spots || 0) : 0;
  const enrolled = nextCohort ? (nextCohort.stats?.enrolled_count || 0) : 0;
  const paid = nextCohort ? (nextCohort.stats?.paid_count || 0) : 0;
  const reserved = nextCohort ? (nextCohort.stats?.reserved_count || 0) : 0;
  const percentage = nextCohort ? (enrolled / nextCohort.capacity) * 100 : 0;
  const isOverbooked = nextCohort?.stats?.is_overbooked || false;

  const chartData = [
    { name: "Pago", value: paid, color: "hsl(var(--primary))" },
    { name: "Reservado", value: reserved, color: "hsl(var(--secondary))" },
    { name: "Aberto", value: available > 0 ? available : 0, color: "hsl(var(--muted))" },
  ];

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Visão Geral
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Acompanhamento de métricas e próxima turma
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary"
              onClick={() => window.open('/documentation', '_blank')}
              title="Ver Documentação"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "gap-2 justify-start text-left font-normal",
                    !dateRange.from && !dateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "dd/MM/yy", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    <span>Filtrar por período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const lastMonth = new Date(today);
                        lastMonth.setMonth(today.getMonth() - 1);
                        setDateRange({ from: lastMonth, to: today });
                      }}
                    >
                      Último mês
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const lastThreeMonths = new Date(today);
                        lastThreeMonths.setMonth(today.getMonth() - 3);
                        setDateRange({ from: lastThreeMonths, to: today });
                      }}
                    >
                      Últimos 3 meses
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDateRange({ from: undefined, to: undefined })}
                    >
                      Limpar
                    </Button>
                  </div>
                  <CalendarComponent
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </div>
              </PopoverContent>
            </Popover>

            <Select value={selectedCohortId} onValueChange={setSelectedCohortId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todas as Turmas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Turmas</SelectItem>
                {cohorts?.map((cohort) => (
                  <SelectItem key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ExportButton type="dashboard" label="Exportar Dashboard" />
            <Button
              onClick={() => setModalOpen(true)}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              <Users className="h-4 w-4" />
              Nova Matrícula
            </Button>
            <Button
              onClick={() => setCsvImportModalOpen(true)}
              variant="outline"
            >
              <Upload className="h-4 w-4" />
              Importar CSV
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Dados Vitais do Funil - PRIMEIRA DOBRA */}
      <section className="px-8 pt-6 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </>
          ) : (
            <>
              <StatsCard
                title="Total de Alunos"
                value={totalEnrolled}
                subtitle={`de ${totalCapacity} vagas`}
                icon={Users}
                trend={{ value: "12%", isPositive: true }}
                tooltip="Total de alunos matriculados em todas as turmas ativas no período selecionado."
              />
              <StatsCard
                title="Turmas Ativas"
                value={cohorts?.length || 0}
                subtitle="em andamento"
                icon={GraduationCap}
                tooltip="Número de turmas que estão atualmente em andamento ou programadas."
              />
              <StatsCard
                title="Matrículas Pagas"
                value={totalPaid}
                subtitle="pagamento confirmado"
                icon={TrendingUp}
                trend={{ value: "8%", isPositive: true }}
                tooltip="Total de alunos que já realizaram o pagamento integral ou da primeira parcela."
              />
              <StatsCard
                title="Receita Total"
                value={formatBRL(totalRevenue / 100)}
                subtitle="arrecadado (valores pagos)"
                icon={DollarSign}
                trend={{ value: "15%", isPositive: true }}
                tooltip="Receita total gerada pelas matrículas no período selecionado."
              />
            </>
          )}
        </div>
      </section>

      {/* Próxima Turma - DESTAQUE PRINCIPAL */}
      <section className="px-8 py-6">
        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : !nextCohort ? (
          <Card className="border border-border bg-card p-8">
            <p className="text-center text-muted-foreground">
              Nenhuma turma encontrada. Crie uma nova turma para começar.
            </p>
          </Card>
        ) : (
          <Card className="border border-border bg-card hover:shadow-xl transition-all duration-300">
            <div className="p-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Próxima Turma
                  </p>
                  <h2 className="text-4xl font-bold text-foreground leading-tight mb-4">
                    {nextCohort.name}
                  </h2>
                  <div className="flex flex-col gap-2.5 text-base text-muted-foreground">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="h-5 w-5" />
                      <span>
                        {format(new Date(nextCohort.start_date), "dd 'a' ", { locale: ptBR })}
                        {nextCohort.end_date && format(new Date(nextCohort.end_date), "dd/MM", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <MapPin className="h-5 w-5" />
                      <span>{nextCohort.location}</span>
                    </div>
                  </div>
                </div>

                {isOverbooked && (
                  <div className="px-4 py-2 bg-primary/10 rounded-full">
                    <span className="text-base font-bold text-primary animate-pulse-purple">
                      LOTADO
                    </span>
                  </div>
                )}
              </div>

              {/* 4 Stages Visualization */}
              <div className="space-y-6 mb-8">
                {/* Stacked Progress Bar */}
                <div className="relative">
                  <div className="h-6 bg-muted rounded-full overflow-hidden flex">
                    {/* Confirmados (paid) */}
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${(paid / nextCohort.capacity) * 100}%` }}
                    />
                    {/* Reservados */}
                    <div
                      className="h-full bg-secondary transition-all duration-500"
                      style={{ width: `${(reserved / nextCohort.capacity) * 100}%` }}
                    />
                    {/* Assinados - overlay with pattern */}
                    <div
                      className="h-full bg-secondary/60 border-r-2 border-secondary transition-all duration-500"
                      style={{ width: `${((nextCohort.stats?.signed_count || 0) / nextCohort.capacity) * 100}%` }}
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-3xl font-bold text-foreground">
                      {Math.round(percentage)}%
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">ocupado</span>
                  </div>
                </div>

                {/* 4 Stages Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  {/* Disponíveis / Lista de Espera */}
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {available > 0 ? available : Math.abs(available)}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {available > 0 ? "Disponíveis" : "Lista de Espera"}
                    </div>
                  </div>

                  {/* Reservados */}
                  <div className="text-center p-4 rounded-lg bg-secondary/20 border border-secondary">
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {reserved}
                    </div>
                    <div className="text-sm font-medium text-secondary-foreground">
                      Reservados
                    </div>
                  </div>

                  {/* Confirmados/Pagos */}
                  <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/30">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {paid}
                    </div>
                    <div className="text-sm font-medium text-primary">
                      Confirmados
                    </div>
                  </div>

                  {/* Contratos Assinados */}
                  <div className="text-center p-4 rounded-lg bg-secondary/40 border-2 border-secondary shadow-sm">
                    <div className="text-3xl font-bold text-secondary-foreground mb-1">
                      {nextCohort.stats?.signed_count || 0}
                    </div>
                    <div className="text-sm font-semibold text-secondary-foreground">
                      Assinados
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-border">
                <Button
                  onClick={() => setModalOpen(true)}
                  className="flex-1 bg-primary hover:bg-primary/90 h-12 text-base font-medium"
                >
                  Nova Matrícula
                </Button>
                <Button
                  onClick={() => navigate(`/cohorts/${nextCohort.id}`)}
                  variant="outline"
                  className="flex-1 border-secondary hover:bg-secondary/10 h-12 text-base font-medium"
                >
                  Ver Inscritos
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </section >

      {/* Smart Alerts */}
      {
        !isLoading && nextCohortAlerts.length > 0 && (
          <section className="px-8 pb-6">
            <div className="space-y-3">
              {nextCohortAlerts.map((alert, index) => (
                <SmartAlert
                  key={index}
                  type={alert.type}
                  title={alert.title}
                  message={alert.message}
                  actionLabel={alert.actionLabel}
                  onAction={() => navigate('/cohorts')}
                />
              ))}
            </div>
          </section>
        )
      }

      {/* Rankings e Análise de Conversão */}
      {
        !isLoadingAnalytics && analytics && (
          <section className="px-8 pb-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Performance e Inteligência</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Rankings e análise de comportamento</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <RankingCard
                title="Top Vendedores"
                icon={Target}
                items={analytics.salesReps.map(rep => ({
                  name: rep.name,
                  value: rep.totalSales,
                  subtitle: formatBRL(rep.totalRevenue / 100),
                }))}
                action={<ExportButton type="sales-reps" label="Exportar" size="sm" variant="ghost" />}
              />
              <RankingCard
                title="Melhores Origens"
                icon={TrendingUp}
                items={analytics.sources.map(source => ({
                  name: source.source,
                  value: source.count,
                  subtitle: `${source.paidCount} pagos`,
                  percentage: source.conversionRate,
                }))}
                action={<ExportButton type="sources" label="Exportar" size="sm" variant="ghost" />}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <UtmAnalytics
                data={analytics.utmStats}
                onStatusFilterChange={setUtmStatusFilter}
                currentStatusFilter={utmStatusFilter}
              />
              <ConversionAnalysis
                data={analytics.conversions}
                action={<ExportButton type="conversion" label="Exportar" size="sm" variant="ghost" />}
              />
            </div>
          </section>
        )
      }

      {/* Saúde Operacional */}
      {
        !isLoading && (
          <section className="px-8 pb-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground">Saúde Operacional</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Indicadores de ação imediata</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <HealthWidget
                title="Pagos sem Assinatura"
                value={paidWithoutSignature}
                subtitle="requerem follow-up"
                icon={FileSignature}
                onClick={() => navigate('/cohorts')}
                variant={paidWithoutSignature > 5 ? "warning" : "default"}
                tooltip="Alunos que já pagaram mas ainda não assinaram o contrato. Priorize o contato!"
              />
              <HealthWidget
                title="Aguardando Pagamento"
                value={oldReserves}
                subtitle="há mais de 7 dias"
                icon={Clock}
                onClick={() => navigate('/cohorts')}
                variant={oldReserves > 10 ? "warning" : "default"}
                tooltip="Reservas feitas há mais de 7 dias que ainda não foram pagas. Considere liberar a vaga."
              />
              <TrendChart
                data={trendData}
                title="Tendência de Ocupação"
                subtitle="Últimos 6 meses"
              />
            </div>
          </section>
        )
      }

      {/* Enrollment Modal */}
      <EnrollmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleEnrollmentSubmit}
      />

      {/* CSV Import Modal Multi-turma */}
      <CsvImportModal
        open={csvImportModalOpen}
        onOpenChange={setCsvImportModalOpen}
        multiCohort={true}
      />
    </>
  );
};

export default Index;
