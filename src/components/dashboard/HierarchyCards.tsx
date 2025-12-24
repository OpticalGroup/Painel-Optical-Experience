import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, GraduationCap, Users, MapPin, TrendingUp, DollarSign, UserCheck, Target, CalendarClock, EyeOff, Eye } from "lucide-react";
import { cn, formatBRL } from "@/lib/utils";

// Types
type ViewMode = 'turmas' | 'vendedores' | 'nucleos';
type RankingCriteria = 'nearest' | 'conversion' | 'revenue' | 'enrolled' | 'paid';

interface CohortData {
    id: string;
    name: string;
    location?: string;
    startDate?: string;
    capacity: number;
    enrolledCount: number;
    reservedCount: number;
    paidCount: number;
    signedCount: number;
    revenue: number;
    hasChildren?: boolean;
}

interface VendedorData {
    id: string;
    name: string;
    totalSales: number;
    totalRevenue: number;
    conversionRate?: number;
}

interface OrigemData {
    id: string;
    source: string;
    count: number;
    paidCount: number;
    revenue: number;
    conversionRate?: number;
}

interface NucleoData {
    id: string;
    name: string;
    totalSales: number;
    totalRevenue: number;
    paidSales: number;
}

interface HierarchyCardsProps {
    cohorts: CohortData[];
    vendedores?: VendedorData[];
    origens?: OrigemData[];
    nucleos?: NucleoData[];
    onCohortClick?: (id: string) => void;
    isLoading?: boolean;
}

const RANKING_OPTIONS: { value: RankingCriteria; label: string; icon: string }[] = [
    { value: 'nearest', label: 'Próximo', icon: '📅' },
    { value: 'conversion', label: 'Conv.', icon: '📊' },
    { value: 'revenue', label: 'Receita', icon: '💰' },
    { value: 'enrolled', label: 'Matrículas', icon: '👥' },
    { value: 'paid', label: 'Pagos', icon: '✅' },
];

export function HierarchyCards({
    cohorts,
    vendedores = [],
    origens = [],
    nucleos = [],
    onCohortClick,
    isLoading = false,
}: HierarchyCardsProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('turmas');
    const [ranking, setRanking] = useState<RankingCriteria>('nearest');
    const [hidePast, setHidePast] = useState(true);

    // Calculate totals
    const totals = useMemo(() => {
        return cohorts.reduce(
            (acc, c) => ({
                capacity: acc.capacity + c.capacity,
                enrolled: acc.enrolled + c.enrolledCount,
                reserved: acc.reserved + c.reservedCount,
                paid: acc.paid + c.paidCount,
                signed: acc.signed + c.signedCount,
                revenue: acc.revenue + c.revenue,
            }),
            { capacity: 0, enrolled: 0, reserved: 0, paid: 0, signed: 0, revenue: 0 }
        );
    }, [cohorts]);

    // Filter past cohorts if hidePast is enabled
    const filteredCohorts = useMemo(() => {
        if (!hidePast) return cohorts;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return cohorts.filter(c => {
            if (!c.startDate) return true; // Keep if no date
            const cohortDate = new Date(c.startDate);
            return cohortDate >= today;
        });
    }, [cohorts, hidePast]);

    // Sort data based on ranking
    const sortedCohorts = useMemo(() => {
        return [...filteredCohorts].sort((a, b) => {
            switch (ranking) {
                case 'nearest':
                    // Sort by start date (nearest first)
                    const dateA = a.startDate ? new Date(a.startDate).getTime() : Infinity;
                    const dateB = b.startDate ? new Date(b.startDate).getTime() : Infinity;
                    return dateA - dateB;
                case 'conversion':
                    const convA = a.enrolledCount > 0 ? a.paidCount / a.enrolledCount : 0;
                    const convB = b.enrolledCount > 0 ? b.paidCount / b.enrolledCount : 0;
                    return convB - convA;
                case 'revenue':
                    return b.revenue - a.revenue;
                case 'enrolled':
                    return b.enrolledCount - a.enrolledCount;
                case 'paid':
                    return b.paidCount - a.paidCount;
                default:
                    return 0;
            }
        });
    }, [filteredCohorts, ranking]);

    const sortedVendedores = useMemo(() => {
        return [...vendedores].sort((a, b) => {
            switch (ranking) {
                case 'conversion':
                    return (b.conversionRate || 0) - (a.conversionRate || 0);
                case 'revenue':
                    return b.totalRevenue - a.totalRevenue;
                case 'paid':
                case 'enrolled':
                    return b.totalSales - a.totalSales;
                default:
                    return b.totalSales - a.totalSales;
            }
        });
    }, [vendedores, ranking]);

    const sortedOrigens = useMemo(() => {
        return [...origens].sort((a, b) => {
            switch (ranking) {
                case 'conversion':
                    return (b.conversionRate || 0) - (a.conversionRate || 0);
                case 'revenue':
                    return b.revenue - a.revenue;
                case 'paid':
                    return b.paidCount - a.paidCount;
                case 'enrolled':
                    return b.count - a.count;
                default:
                    return b.count - a.count;
            }
        });
    }, [origens, ranking]);

    const sortedNucleos = useMemo(() => {
        return [...nucleos].sort((a, b) => {
            switch (ranking) {
                case 'revenue':
                    return b.totalRevenue - a.totalRevenue;
                case 'conversion':
                    const convA = a.totalSales > 0 ? a.paidSales / a.totalSales : 0;
                    const convB = b.totalSales > 0 ? b.paidSales / b.totalSales : 0;
                    return convB - convA;
                case 'paid':
                    return b.paidSales - a.paidSales;
                case 'enrolled':
                    return b.totalSales - a.totalSales;
                default:
                    return b.paidSales - a.paidSales;
            }
        });
    }, [nucleos, ranking]);

    if (isLoading) {
        return (
            <div className="glass-card p-5 rounded-2xl border border-white/5 bg-white/[0.02] h-[520px]">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-muted/20 rounded-xl" />
                    <div className="h-6 bg-muted/10 rounded w-1/3" />
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-16 bg-muted/10 rounded-lg" />
                        ))}
                    </div>
                    <div className="space-y-3 mt-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-28 bg-muted/10 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-5 rounded-2xl border border-white/5 bg-white/[0.02] h-[520px] overflow-y-auto">
            <div className="space-y-4">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-secondary/30 rounded-xl p-1">
                    <button
                        onClick={() => setViewMode('turmas')}
                        className={cn(
                            "flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5",
                            viewMode === 'turmas'
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        )}
                    >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Turmas</span>
                    </button>
                    <button
                        onClick={() => setViewMode('vendedores')}
                        className={cn(
                            "flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5",
                            viewMode === 'vendedores'
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        )}
                    >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Vendedores</span>
                    </button>
                    <button
                        onClick={() => setViewMode('nucleos')}
                        className={cn(
                            "flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5",
                            viewMode === 'nucleos'
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        )}
                    >
                        <Target className="w-3.5 h-3.5" />
                        <span>Núcleos</span>
                    </button>
                </div>

                {/* Title + Ranking Row */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {viewMode === 'turmas' ? 'TURMAS' : viewMode === 'vendedores' ? 'VENDEDORES' : 'NÚCLEOS'}
                        </h3>

                        {/* Hide Past Toggle - Only for Turmas */}
                        {viewMode === 'turmas' && (
                            <button
                                onClick={() => setHidePast(!hidePast)}
                                className={cn(
                                    "flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md transition-all border",
                                    hidePast
                                        ? "bg-primary/20 text-primary border-primary/30"
                                        : "bg-muted/20 text-muted-foreground border-transparent hover:bg-muted/30"
                                )}
                                title={hidePast ? "Mostrando apenas turmas futuras" : "Mostrando todas as turmas"}
                            >
                                {hidePast ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                <span className="hidden sm:inline">{hidePast ? "Futuras" : "Todas"}</span>
                            </button>
                        )}
                    </div>

                    {/* Ranking Selector */}
                    <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-0.5">
                        {RANKING_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setRanking(option.value)}
                                className={cn(
                                    "px-2 py-1 text-[10px] font-medium rounded-md transition-all flex items-center gap-1",
                                    ranking === option.value
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                )}
                                title={`Ordenar por ${option.label}`}
                            >
                                <span>{option.icon}</span>
                                <span className="hidden sm:inline">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary KPIs Strip */}
                {viewMode === 'turmas' && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="py-4"
                    >
                        <div className="grid grid-cols-5 gap-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-slate-400 mb-1">{Math.max(0, totals.capacity - totals.enrolled)}</div>
                                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Disponíveis</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-400 mb-1">{totals.enrolled}</div>
                                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Matrículas</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-amber-400 mb-1">{totals.reserved}</div>
                                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Reservados</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-emerald-400 mb-1">{totals.paid}</div>
                                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Pagos</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-violet-400 mb-1">{totals.signed}</div>
                                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Assinados</div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Divider */}
                <div className="border-t border-white/[0.06] mb-3" />

                {/* Cards Grid */}
                <div className="space-y-3">
                    <AnimatePresence mode="wait">
                        {viewMode === 'turmas' && (
                            <motion.div
                                key="turmas-view"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-3"
                            >
                                {sortedCohorts.length > 0 ? (
                                    sortedCohorts.map((cohort, index) => (
                                        <CohortCard
                                            key={cohort.id}
                                            cohort={cohort}
                                            onClick={() => onCohortClick?.(cohort.id)}
                                            rank={index + 1}
                                            isTopRanked={index === 0}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground">
                                        Nenhuma turma encontrada.
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {viewMode === 'vendedores' && (
                            <motion.div
                                key="vendedores-view"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-3"
                            >
                                {sortedVendedores.length > 0 ? (
                                    sortedVendedores.map((vendedor, index) => (
                                        <VendedorCard
                                            key={vendedor.id}
                                            vendedor={vendedor}
                                            rank={index + 1}
                                            isTopRanked={index === 0}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground">
                                        Nenhum vendedor encontrado.
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {viewMode === 'nucleos' && (
                            <motion.div
                                key="nucleos-view"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-3"
                            >
                                {sortedNucleos.length > 0 ? (
                                    sortedNucleos.map((nucleo, index) => (
                                        <NucleoCard
                                            key={nucleo.id}
                                            nucleo={nucleo}
                                            rank={index + 1}
                                            isTopRanked={index === 0}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground">
                                        Nenhum núcleo encontrado.
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// Nucleo Card Component
interface NucleoCardProps {
    nucleo: NucleoData;
    rank?: number;
    isTopRanked?: boolean;
}

function NucleoCard({ nucleo, rank, isTopRanked = false }: NucleoCardProps) {
    const conversionRate = nucleo.totalSales > 0 ? (nucleo.paidSales / nucleo.totalSales) * 100 : 0;
    
    return (
        <div
            className={cn(
                "w-full p-4 rounded-xl border transition-all duration-200 relative",
                isTopRanked
                    ? "border-amber-400/50 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-600/10 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                    : "border-white/5 bg-white/[0.02]"
            )}
        >
            {isTopRanked && (
                <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full shadow-lg z-10">
                    <span className="text-xs">🏆</span>
                    <span className="text-[9px] font-bold text-amber-900 uppercase tracking-wide">Top 1</span>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <div className="font-semibold text-foreground">{nucleo.name}</div>
                        <div className="text-xs text-muted-foreground">{nucleo.paidSales} vendas pagas de {nucleo.totalSales} total</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">{formatBRL(nucleo.totalRevenue)}</div>
                    <div className={cn(
                        "text-xs font-semibold",
                        conversionRate >= 50 ? "text-emerald-400" : conversionRate >= 30 ? "text-amber-400" : "text-red-400"
                    )}>
                        {conversionRate.toFixed(0)}% conv.
                    </div>
                </div>
            </div>
        </div>
    );
}

// Cohort Card Component
interface CohortCardProps {
    cohort: CohortData;
    onClick?: () => void;
    rank?: number;
    isTopRanked?: boolean;
}

function CohortCard({ cohort, onClick, rank, isTopRanked = false }: CohortCardProps) {
    const conversionRate = cohort.enrolledCount > 0
        ? (cohort.paidCount / cohort.enrolledCount) * 100
        : 0;
    const occupancyRate = (cohort.enrolledCount / cohort.capacity) * 100;
    const availableCount = Math.max(0, cohort.capacity - cohort.enrolledCount);
    const maxValue = Math.max(cohort.enrolledCount, cohort.reservedCount, cohort.paidCount, availableCount, 1);

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left p-4 rounded-xl border transition-all duration-200 relative min-h-[120px]",
                isTopRanked
                    ? "border-amber-400/50 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-600/10 hover:from-amber-500/15 hover:to-amber-600/15 shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-[0_0_35px_rgba(251,191,36,0.35)] hover:scale-[1.01] cursor-pointer group"
                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 hover:scale-[1.01] cursor-pointer group"
            )}
        >
            {/* Top Ranked Badge */}
            {isTopRanked && (
                <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full shadow-lg z-10">
                    <span className="text-xs">🏆</span>
                    <span className="text-[9px] font-bold text-amber-900 uppercase tracking-wide">Top 1</span>
                </div>
            )}

            <div className="flex items-start justify-between gap-4">
                {/* Left: Name + Metrics */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">📚</span>
                        <span className="font-semibold text-foreground truncate">{cohort.name}</span>
                        {cohort.location && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {cohort.location}
                            </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-4 gap-3">
                        {/* Vagas Disponíveis */}
                        <div>
                            <div className="text-[10px] text-muted-foreground uppercase mb-1">Disponíveis</div>
                            <div className="text-lg font-bold text-slate-400">{cohort.capacity - cohort.enrolledCount}</div>
                            <div className="h-1 rounded-full bg-slate-500/20 mt-1">
                                <div
                                    className="h-full rounded-full bg-slate-500/40"
                                    style={{ width: `${(Math.max(0, cohort.capacity - cohort.enrolledCount) / maxValue) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Matriculados */}
                        <div>
                            <div className="text-[10px] text-muted-foreground uppercase mb-1">Matriculados</div>
                            <div className="text-lg font-bold text-blue-400">{cohort.enrolledCount}</div>
                            <div className="h-1 rounded-full bg-blue-500/20 mt-1">
                                <div
                                    className="h-full rounded-full bg-blue-500"
                                    style={{ width: `${(cohort.enrolledCount / maxValue) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Reservados */}
                        <div>
                            <div className="text-[10px] text-muted-foreground uppercase mb-1">Reservados</div>
                            <div className="text-lg font-bold text-amber-400">{cohort.reservedCount}</div>
                            <div className="h-1 rounded-full bg-amber-500/20 mt-1">
                                <div
                                    className="h-full rounded-full bg-amber-500"
                                    style={{ width: `${(cohort.reservedCount / maxValue) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Pagos */}
                        <div>
                            <div className="text-[10px] text-muted-foreground uppercase mb-1">Pagos</div>
                            <div className="text-lg font-bold text-emerald-400">{cohort.paidCount}</div>
                            <div className="h-1 rounded-full bg-emerald-500/20 mt-1">
                                <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{ width: `${(cohort.paidCount / maxValue) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Revenue + Conversion */}
                <div className="text-right shrink-0 flex flex-col justify-between">
                    <div className="mb-2 pb-2 border-b border-white/5">
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Ocupação</div>
                        <div className="text-sm font-semibold text-foreground">{occupancyRate.toFixed(0)}%</div>
                    </div>

                    <div>
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Receita</div>
                        <div className="text-xl font-bold text-foreground">{formatBRL(cohort.revenue)}</div>
                        <div className={cn(
                            "text-xs font-semibold",
                            conversionRate >= 80 ? "text-emerald-400" : conversionRate >= 50 ? "text-amber-400" : "text-red-400"
                        )}>
                            {conversionRate.toFixed(0)}% conv.
                        </div>
                    </div>
                </div>
            </div>
        </button>
    );
}

// Vendedor Card Component
interface VendedorCardProps {
    vendedor: VendedorData;
    rank?: number;
    isTopRanked?: boolean;
}

function VendedorCard({ vendedor, rank, isTopRanked = false }: VendedorCardProps) {
    return (
        <div
            className={cn(
                "w-full p-4 rounded-xl border transition-all duration-200 relative",
                isTopRanked
                    ? "border-amber-400/50 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-600/10 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                    : "border-white/5 bg-white/[0.02]"
            )}
        >
            {isTopRanked && (
                <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full shadow-lg z-10">
                    <span className="text-xs">🏆</span>
                    <span className="text-[9px] font-bold text-amber-900 uppercase tracking-wide">Top 1</span>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <div className="font-semibold text-foreground">{vendedor.name}</div>
                        <div className="text-xs text-muted-foreground">{vendedor.totalSales} vendas</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">{formatBRL(vendedor.totalRevenue)}</div>
                    {vendedor.conversionRate && (
                        <div className="text-xs text-muted-foreground">{vendedor.conversionRate.toFixed(0)}% conv.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Origem Card Component
interface OrigemCardProps {
    origem: OrigemData;
    rank?: number;
    isTopRanked?: boolean;
}

function OrigemCard({ origem, rank, isTopRanked = false }: OrigemCardProps) {
    return (
        <div
            className={cn(
                "w-full p-4 rounded-xl border transition-all duration-200 relative",
                isTopRanked
                    ? "border-amber-400/50 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-600/10 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                    : "border-white/5 bg-white/[0.02]"
            )}
        >
            {isTopRanked && (
                <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full shadow-lg z-10">
                    <span className="text-xs">🏆</span>
                    <span className="text-[9px] font-bold text-amber-900 uppercase tracking-wide">Top 1</span>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <div className="font-semibold text-foreground">{origem.source}</div>
                        <div className="text-xs text-muted-foreground">{origem.count} leads • {origem.paidCount} pagos</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">{formatBRL(origem.revenue)}</div>
                    {origem.conversionRate !== undefined && (
                        <div className={cn(
                            "text-xs font-semibold",
                            origem.conversionRate >= 30 ? "text-emerald-400" : origem.conversionRate >= 15 ? "text-amber-400" : "text-red-400"
                        )}>
                            {origem.conversionRate.toFixed(0)}% conv.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
