import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, TrendingUp, DollarSign, ArrowRight, Calendar, MapPin, Upload, FileSignature, Clock, Target, CalendarIcon, HelpCircle, SlidersHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn, formatBRL } from "@/lib/utils";
import { HeroKPIs } from "@/components/dashboard/HeroKPIs";
import { HierarchyCards } from "@/components/dashboard/HierarchyCards";
import { ChartsPanel } from "@/components/dashboard/ChartsPanel";
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
import { usePurchaseWindow } from "@/hooks/usePurchaseWindow";
import { useUtmData } from "@/hooks/useUtmData";
import { useOriginHierarchy } from "@/hooks/useOriginHierarchy";

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
  const { data: purchaseWindowData } = usePurchaseWindow(dateRange);
  const { data: utmData } = useUtmData(dateRange);
  const { data: originHierarchy } = useOriginHierarchy(dateRange);
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

  // Gerar dados de tendência baseado em dados reais
  const trendData = useMemo(() => {
    if (!cohorts || cohorts.length === 0) return [];

    const months = [];
    let startDate: Date;
    let endDate: Date;

    if (dateRange.from && dateRange.to) {
      startDate = new Date(dateRange.from);
      endDate = new Date(dateRange.to);
    } else {
      // Default: últimos 6 meses
      endDate = new Date();
      startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 5);
      startDate.setDate(1); // Começo do mês
    }

    // Iterar mês a mês do startDate até endDate
    const current = new Date(startDate);
    current.setDate(1); // Garantir que começa no dia 1 pra não pular meses curtos

    while (current <= endDate || (current.getMonth() === endDate.getMonth() && current.getFullYear() === endDate.getFullYear())) {
      const monthName = format(current, "MMM/yy", { locale: ptBR });

      // Filtrar cohorts deste mês
      const monthCohorts = cohorts.filter(c => {
        const cohortDate = new Date(c.start_date);
        return cohortDate.getMonth() === current.getMonth() &&
          cohortDate.getFullYear() === current.getFullYear();
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

      // Avançar para próximo mês
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }, [cohorts, dateRange]);

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
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 lg:py-4 gap-3">
          {/* Left: Title */}
          <div className="flex items-center gap-3 min-w-0">
            <SidebarTrigger />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
                Visão Geral
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden md:block">
                Acompanhamento de métricas e próxima turma
              </p>
            </div>
          </div>

          {/* Desktop Controls (lg+) */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
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
                    <Button variant="outline" size="sm" onClick={() => {
                      const today = new Date();
                      const lastMonth = new Date(today);
                      lastMonth.setMonth(today.getMonth() - 1);
                      setDateRange({ from: lastMonth, to: today });
                    }}>Último mês</Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const today = new Date();
                      const lastThreeMonths = new Date(today);
                      lastThreeMonths.setMonth(today.getMonth() - 3);
                      setDateRange({ from: lastThreeMonths, to: today });
                    }}>Últimos 3 meses</Button>
                    <Button variant="outline" size="sm" onClick={() => setDateRange({ from: undefined, to: undefined })}>Limpar</Button>
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
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas as Turmas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Turmas</SelectItem>
                {cohorts?.map((cohort) => (
                  <SelectItem key={cohort.id} value={cohort.id}>{cohort.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ExportButton type="dashboard" label="Exportar Dashboard" />

            <Button onClick={() => setCsvImportModalOpen(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>

            <Button onClick={() => setModalOpen(true)} className="bg-primary hover:bg-primary/90 gap-2">
              <Users className="h-4 w-4" />
              Nova Matrícula
            </Button>

            <UserMenu />
          </div>

          {/* Mobile/Tablet Controls */}
          <div className="flex items-center gap-2 lg:hidden flex-shrink-0">
            <Button onClick={() => setModalOpen(true)} size="sm" className="bg-primary hover:bg-primary/90 h-9 px-3 gap-1.5">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Matrícula</span>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
                <SheetHeader className="text-left mb-6">
                  <SheetTitle>Filtros e Opções</SheetTitle>
                </SheetHeader>

                <div className="space-y-4 overflow-y-auto">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Período</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start h-11", !dateRange.from && "text-muted-foreground")}>
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {dateRange.from ? (
                            dateRange.to ? `${format(dateRange.from, "dd/MM/yy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yy", { locale: ptBR })}` : format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                          ) : "Filtrar por período"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="center">
                        <CalendarComponent mode="range" selected={{ from: dateRange.from, to: dateRange.to }} onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })} numberOfMonths={1} locale={ptBR} />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Turma</label>
                    <Select value={selectedCohortId} onValueChange={setSelectedCohortId}>
                      <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder="Todas as Turmas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Turmas</SelectItem>
                        {cohorts?.map((cohort) => (
                          <SelectItem key={cohort.id} value={cohort.id}>{cohort.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="h-px bg-border my-4" />

                  <Button onClick={() => setCsvImportModalOpen(true)} variant="outline" className="w-full justify-start h-11 gap-2">
                    <Upload className="h-4 w-4" />
                    Importar CSV
                  </Button>

                  <ExportButton type="dashboard" label="Exportar Dashboard" className="w-full justify-start h-11" />

                  <Button variant="ghost" onClick={() => window.open('/documentation', '_blank')} className="w-full justify-start h-11 gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Ver Documentação
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <UserMenu />
          </div>
        </div>
      </header>

      {/* Hero KPIs - Estilo Nexus Cortex */}
      <motion.section
        className="px-8 pt-6 pb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <HeroKPIs
          totalRevenue={totalRevenue}
          totalEnrolled={totalEnrolled}
          totalPaid={totalPaid}
          totalCapacity={totalCapacity}
          cohortsCount={cohorts?.length || 0}
          isLoading={isLoading}
        />
      </motion.section>

      {/* Main Content: Grid 7:5 - Estilo Nexus Cortex */}
      <section className="px-4 sm:px-6 lg:px-8 py-2">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
          {/* LEFT: Hierarchy Cards (7 colunas) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="xl:col-span-7"
          >
            <HierarchyCards
              cohorts={filteredCohorts.map(c => ({
                id: c.id,
                name: c.name,
                location: c.location,
                startDate: c.start_date,
                capacity: c.capacity,
                enrolledCount: c.stats?.enrolled_count || 0,
                reservedCount: c.stats?.reserved_count || 0,
                paidCount: c.stats?.paid_count || 0,
                signedCount: c.stats?.signed_count || 0,
                revenue: c.stats?.total_revenue ?? ((c.stats?.paid_count || 0) * (c.price || 2000)), // Usa real do banco ou estimativa
                hasChildren: true,
              }))}
              vendedores={analytics?.salesReps?.map(rep => ({
                id: rep.name,
                name: rep.name,
                totalSales: rep.totalSales,
                totalRevenue: rep.totalRevenue,
                conversionRate: rep.conversionRate,
              })) || []}
              origens={analytics?.sources?.map(src => ({
                id: src.source,
                source: src.source,
                count: src.count,
                paidCount: src.paidCount,
                revenue: src.paidCount * 2000, // Estimativa
                conversionRate: src.conversionRate,
              })) || []}
              onCohortClick={(id) => navigate(`/cohorts/${id}`)}
              isLoading={isLoading}
            />
          </motion.div>

          {/* RIGHT: Charts Panel (5 colunas) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="xl:col-span-5"
          >
            <ChartsPanel
              nextCohort={nextCohort ? {
                id: nextCohort.id,
                name: nextCohort.name,
                location: nextCohort.location,
                startDate: nextCohort.start_date,
                endDate: nextCohort.end_date,
                capacity: nextCohort.capacity,
                enrolledCount: nextCohort.stats?.enrolled_count || 0,
                reservedCount: nextCohort.stats?.reserved_count || 0,
                paidCount: nextCohort.stats?.paid_count || 0,
                signedCount: nextCohort.stats?.signed_count || 0,
                isOverbooked: nextCohort.stats?.is_overbooked,
              } : null}
              trendData={trendData}
              onNewEnrollment={() => setModalOpen(true)}
              onViewCohort={(id) => navigate(`/cohorts/${id}`)}
              isLoading={isLoading}
              cohorts={filteredCohorts.map(c => ({
                id: c.id,
                name: c.name,
                enrolledCount: c.stats?.enrolled_count || 0,
                paidCount: c.stats?.paid_count || 0,
                revenue: c.stats?.total_revenue || (c.stats?.paid_count || 0) * (c.price || 2000),
                reservedCount: c.stats?.reserved_count || 0,
              }))}
              vendedores={analytics?.salesReps?.map(rep => ({
                id: rep.name,
                name: rep.name,
                totalSales: rep.totalSales,
                totalRevenue: rep.totalRevenue,
              })) || []}
              originHierarchy={originHierarchy}
              utmData={utmData}
              purchaseWindowData={purchaseWindowData}
            />
          </motion.div>
        </div>
      </section>

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
