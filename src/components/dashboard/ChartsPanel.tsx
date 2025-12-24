import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, ArrowRight, TrendingUp, LayoutGrid, PieChart, Settings2, Eye, EyeOff, Clock, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatBRL } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
    PieChart as RechartsPie, Pie, Cell, BarChart, Bar
} from "recharts";
import { UnifiedTrendChart } from "@/components/trends";
import type { TrendDataPoint as UnifiedTrendDataPoint } from "@/components/trends";

// ============================================
// TYPES
// ============================================

interface CohortData {
    id: string;
    name: string;
    location?: string;
    startDate: string;
    endDate?: string;
    capacity: number;
    enrolledCount: number;
    reservedCount: number;
    paidCount: number;
    signedCount: number;
    isOverbooked?: boolean;
}

interface TrendDataPoint {
    month: string;
    value: number;
}

interface SunburstDataItem {
    name: string;
    value: number;
    color?: string;
}

interface ChartsPanelProps {
    nextCohort?: CohortData | null;
    trendData?: TrendDataPoint[];
    sunburstData?: SunburstDataItem[];
    onNewEnrollment?: () => void;
    onViewCohort?: (id: string) => void;
    isLoading?: boolean;
    // Hierarchy dimensions
    cohorts?: Array<{
        id: string;
        name: string;
        enrolledCount: number;
        paidCount: number;
        revenue: number;
        reservedCount: number;
    }>;
    vendedores?: Array<{
        id: string;
        name: string;
        totalSales: number;
        totalRevenue: number;
    }>;
    // Origin Hierarchy (5 levels)
    originHierarchy?: {
        funis: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
        macroOrigens: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
        microOrigens: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
        variacaoMicro: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
        variacaoNano: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
    };
    // UTM dimensions
    utmData?: {
        campaign: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
        source: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
        medium: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
        content: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
        term: Array<{ name: string; count: number; paidCount: number; revenue: number }>;
    };
    // Purchase Window data
    purchaseWindowData?: {
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
    };
    // Unified trend data with all metrics
    unifiedTrendData?: UnifiedTrendDataPoint[];
}

type ViewMode = "sunburst" | "purchase-window" | "trend";
type MetricType = "matriculas" | "pagos" | "receita" | "reservados";

const VIEW_MODES: { id: ViewMode; label: string; icon: React.ElementType }[] = [
    { id: "sunburst", label: "Sunburst", icon: PieChart },
    { id: "purchase-window", label: "Janela de Compra", icon: Clock },
    { id: "trend", label: "Tendência", icon: TrendingUp },
];

const METRIC_OPTIONS: { value: MetricType; label: string; icon: string }[] = [
    { value: "matriculas", label: "Matrículas", icon: "👥" },
    { value: "pagos", label: "Pagos", icon: "✅" },
    { value: "receita", label: "Receita", icon: "💰" },
    { value: "reservados", label: "Reservados", icon: "📋" },
];

// Dimension colors for sunburst rings
const DIMENSION_COLORS: Record<string, { primary: string; shades: string[] }> = {
    // Core Hierarchy
    turmas: { primary: "#8B5CF6", shades: ["#8B5CF6", "#7C3AED", "#6D28D9", "#5B21B6", "#4C1D95"] },
    vendedores: { primary: "#06B6D4", shades: ["#06B6D4", "#0891B2", "#0E7490", "#155E75", "#164E63"] },
    // Origin Hierarchy (5 levels)
    funil: { primary: "#F59E0B", shades: ["#F59E0B", "#D97706", "#B45309", "#92400E", "#78350F"] },
    origemMacro: { primary: "#10B981", shades: ["#10B981", "#059669", "#047857", "#065F46", "#064E3B"] },
    origemMicro: { primary: "#3B82F6", shades: ["#3B82F6", "#2563EB", "#1D4ED8", "#1E40AF", "#1E3A8A"] },
    variacaoMicro: { primary: "#8B5CF6", shades: ["#8B5CF6", "#7C3AED", "#6D28D9", "#5B21B6", "#4C1D95"] },
    variacaoNano: { primary: "#EC4899", shades: ["#EC4899", "#DB2777", "#BE185D", "#9D174D", "#831843"] },
    // Núcleos (from HierarchyCards)
    nucleos: { primary: "#06B6D4", shades: ["#06B6D4", "#0891B2", "#0E7490", "#155E75", "#164E63"] },
    // UTMs
    utmCampaign: { primary: "#EC4899", shades: ["#EC4899", "#DB2777", "#BE185D", "#9D174D", "#831843"] },
    utmSource: { primary: "#14B8A6", shades: ["#14B8A6", "#0D9488", "#0F766E", "#115E59", "#134E4A"] },
    utmMedium: { primary: "#A855F7", shades: ["#A855F7", "#9333EA", "#7E22CE", "#6B21A8", "#581C87"] },
    utmContent: { primary: "#F97316", shades: ["#F97316", "#EA580C", "#C2410C", "#9A3412", "#7C2D12"] },
    utmTerm: { primary: "#22D3EE", shades: ["#22D3EE", "#06B6D4", "#0891B2", "#0E7490", "#155E75"] },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateRingRadii(enabledRings: number, ringIndex: number): { inner: number; outer: number } {
    const baseInner = 25;
    const maxOuter = 95;
    const ringWidth = (maxOuter - baseInner) / enabledRings;

    return {
        inner: baseInner + (ringIndex * ringWidth),
        outer: baseInner + ((ringIndex + 1) * ringWidth) - 4,
    };
}

function getMetricValue(item: any, metric: MetricType, type: 'turma' | 'vendedor' | 'origem'): number {
    switch (metric) {
        case "matriculas":
            return type === 'turma' ? item.enrolledCount :
                type === 'vendedor' ? item.totalSales : item.count;
        case "pagos":
            return type === 'turma' ? item.paidCount :
                type === 'vendedor' ? item.totalSales : item.paidCount;
        case "receita":
            return type === 'turma' ? item.revenue :
                type === 'vendedor' ? item.totalRevenue : item.revenue;
        case "reservados":
            return type === 'turma' ? item.reservedCount :
                type === 'vendedor' ? 0 : 0;
        default:
            return 0;
    }
}

// ============================================
// CUSTOM TOOLTIP
// ============================================

interface HierarchyContext {
    funnel?: string;
    macroOrigin?: string;
    microOrigin?: string;
    variacaoMicro?: string;
}

function CustomSunburstTooltip({
    active,
    payload,
    metric,
    activeSegment,
    hierarchyMap
}: {
    active?: boolean;
    payload?: any[];
    metric?: MetricType;
    activeSegment?: any;
    hierarchyMap?: Record<string, HierarchyContext>;
}) {
    if (!active || (!activeSegment && (!payload || !payload.length))) return null;

    // Use the explicitly tracked hovered segment if available, otherwise fallback to payload
    const data = activeSegment || (payload && payload.length ? payload[0].payload : null);
    if (!data) return null;

    const metricLabel = metric === 'receita' ? 'receita' : metric === 'pagos' ? 'pagos' : 'matrículas';

    // Get hierarchy context for this segment
    const context = hierarchyMap?.[data.name];

    return (
        <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg px-4 py-3 shadow-xl min-w-[180px] max-w-[240px] z-[100]">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.color }} />
                {data.ringLabel}
            </div>
            <p className="font-semibold text-foreground text-sm">{data.name}</p>

            {/* Hierarchy Context */}
            {context && (
                <div className="mt-2 pt-2 border-t border-border/30 space-y-1">
                    {context.variacaoMicro && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span className="text-amber-400">🔸</span>
                            <span className="truncate">{context.variacaoMicro}</span>
                        </div>
                    )}
                    {context.microOrigin && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span className="text-blue-400">📍</span>
                            <span className="truncate">{context.microOrigin}</span>
                        </div>
                    )}
                    {context.macroOrigin && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span className="text-emerald-400">🌐</span>
                            <span className="truncate">{context.macroOrigin}</span>
                        </div>
                    )}
                    {context.funnel && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span className="text-orange-400">🎯</span>
                            <span className="truncate">{context.funnel}</span>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                    {metric === 'receita' ? formatBRL(data.value) : data.value.toLocaleString('pt-BR')} {metricLabel}
                </span>
                <span className="text-sm font-bold" style={{ color: data.color }}>
                    {data.percentage.toFixed(1)}%
                </span>
            </div>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ChartsPanel({
    nextCohort,
    trendData = [],
    sunburstData,
    onNewEnrollment,
    onViewCohort,
    isLoading = false,
    cohorts = [],
    vendedores = [],
    originHierarchy,
    utmData,
    purchaseWindowData,
    unifiedTrendData = [],
}: ChartsPanelProps) {
    const [activeView, setActiveView] = useState<ViewMode>("sunburst");
    const [selectedMetric, setSelectedMetric] = useState<MetricType>("matriculas");
    const [showControls, setShowControls] = useState(false);
    const [enabledRings, setEnabledRings] = useState<Record<string, boolean>>({
        // Core Hierarchy
        turmas: true,
        vendedores: true,
        // Origin Hierarchy (5 levels) - only 3 active by default
        funil: true,
        origemMacro: true,
        origemMicro: true,
        variacaoMicro: false,
        variacaoNano: false,
        // Núcleos
        nucleos: true,
        // UTMs - disabled by default
        utmCampaign: false,
        utmSource: false,
        utmMedium: false,
        utmContent: false,
        utmTerm: false,
    });

    // Unified metric getter that handles different data shapes
    const getUnifiedMetricValue = (item: any, metric: MetricType): number => {
        // Handle cases where item might have different property names
        const count = Number(item.count ?? item.enrolledCount ?? item.totalSales ?? 0);
        const paidCount = Number(item.paidCount ?? item.paidSales ?? item.totalSales ?? 0);
        const revenue = Number(item.revenue ?? item.totalRevenue ?? 0);
        const reservedCount = Number(item.reservedCount ?? 0);

        switch (metric) {
            case "matriculas": return count;
            case "pagos": return paidCount;
            case "receita": return revenue;
            case "reservados": return reservedCount;
            default: return count;
        }
    };

    // Core Hierarchy ring configurations
    const coreRingConfigs = useMemo(() => [
        {
            id: "turmas",
            label: "Turmas",
            enabled: enabledRings.turmas,
            icon: "📚",
            data: cohorts || [],
        },
        {
            id: "vendedores",
            label: "Vendedores",
            enabled: enabledRings.vendedores,
            icon: "👤",
            data: vendedores || [],
        },
    ], [enabledRings, cohorts, vendedores]);

    // Origin Hierarchy ring configurations (5 levels)
    const originRingConfigs = useMemo(() => [
        { id: "funil", label: "Funil", enabled: enabledRings.funil, icon: "🎯", data: originHierarchy?.funis || [] },
        { id: "origemMacro", label: "Origem Macro", enabled: enabledRings.origemMacro, icon: "🌐", data: originHierarchy?.macroOrigens || [] },
        { id: "origemMicro", label: "Origem Micro", enabled: enabledRings.origemMicro, icon: "📍", data: originHierarchy?.microOrigens || [] },
        { id: "variacaoMicro", label: "Variação Micro", enabled: enabledRings.variacaoMicro, icon: "🔸", data: originHierarchy?.variacaoMicro || [] },
        { id: "variacaoNano", label: "Variação Nano", enabled: enabledRings.variacaoNano, icon: "🔹", data: originHierarchy?.variacaoNano || [] },
    ], [enabledRings, originHierarchy]);

    // Núcleos ring configuration (separate from origin hierarchy)
    const nucleosRingConfig = useMemo(() => [
        { id: "nucleos", label: "Núcleos", enabled: enabledRings.nucleos, icon: "🔵", data: originHierarchy?.macroOrigens || [] },
    ], [enabledRings, originHierarchy]);

    // UTM ring configurations
    const utmRingConfigs = useMemo(() => [
        { id: "utmCampaign", label: "Campaign", enabled: enabledRings.utmCampaign, icon: "📢", data: utmData?.campaign || [] },
        { id: "utmSource", label: "Source", enabled: enabledRings.utmSource, icon: "🌐", data: utmData?.source || [] },
        { id: "utmMedium", label: "Medium", enabled: enabledRings.utmMedium, icon: "📡", data: utmData?.medium || [] },
        { id: "utmContent", label: "Content", enabled: enabledRings.utmContent, icon: "📝", data: utmData?.content || [] },
        { id: "utmTerm", label: "Term", enabled: enabledRings.utmTerm, icon: "🔍", data: utmData?.term || [] },
    ], [enabledRings, utmData]);

    // All ring configs combined
    const allRingConfigs = useMemo(() => [...coreRingConfigs, ...nucleosRingConfig, ...originRingConfigs, ...utmRingConfigs], [coreRingConfigs, nucleosRingConfig, originRingConfigs, utmRingConfigs]);

    const activeRings = useMemo(() =>
        allRingConfigs.filter(r => r.enabled && r.data && r.data.length > 0),
        [allRingConfigs]);

    const enabledCount = activeRings.length;

    const [hoveredSegment, setHoveredSegment] = useState<any>(null);

    // Transform data for rings with specific radii and colors
    const ringsData = useMemo(() => {
        return activeRings.map((ring, index) => {
            const radii = calculateRingRadii(enabledCount, index);
            const colorConfig = DIMENSION_COLORS[ring.id] || { primary: "#8B5CF6", shades: ["#8B5CF6"] };

            const total = ring.data.reduce((sum, item) =>
                sum + getUnifiedMetricValue(item, selectedMetric), 0);

            const segments = ring.data.map((item, idx) => {
                const value = getUnifiedMetricValue(item, selectedMetric);
                return {
                    id: `${ring.id}-${idx}`,
                    name: item.name || item.source || "Outro",
                    value,
                    percentage: total > 0 ? (value / total) * 100 : 0,
                    color: colorConfig.shades[idx % colorConfig.shades.length],
                    ringLabel: ring.label,
                };
            }).filter(seg => seg.value > 0);

            return {
                ...ring,
                innerRadius: radii.inner,
                outerRadius: radii.outer,
                segments,
                color: colorConfig.primary,
            };
        });
    }, [activeRings, enabledCount, selectedMetric]);

    const toggleRing = (ringId: string) => {
        setEnabledRings(prev => ({
            ...prev,
            [ringId]: !prev[ringId],
        }));
    };

    if (isLoading) {
        return (
            <div className="glass-card p-6 rounded-2xl border border-white/5 bg-white/[0.02] h-[520px]">
                <div className="animate-pulse space-y-6">
                    <div className="h-6 bg-muted/20 rounded w-1/3" />
                    <div className="h-48 bg-muted/10 rounded-xl" />
                    <div className="h-6 bg-muted/20 rounded w-1/3" />
                    <div className="h-32 bg-muted/10 rounded-xl" />
                </div>
            </div>
        );
    }

    const available = nextCohort ? (nextCohort.capacity - nextCohort.enrolledCount) : 0;
    const percentage = nextCohort ? (nextCohort.enrolledCount / nextCohort.capacity) * 100 : 0;

    return (
        <div className="glass-card p-6 rounded-2xl border border-white/5 bg-white/[0.02] h-[520px] flex flex-col">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 mb-4">
                <div className="inline-flex p-1 rounded-xl bg-muted/20 border border-white/5">
                    {VIEW_MODES.map((mode) => {
                        const Icon = mode.icon;
                        const isActive = activeView === mode.id;
                        return (
                            <button
                                key={mode.id}
                                onClick={() => setActiveView(mode.id)}
                                className={cn(
                                    "relative px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5",
                                    isActive
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground/80"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="chartsPanelActiveTab"
                                        className="absolute inset-0 bg-white/10 rounded-lg border border-white/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                                    />
                                )}
                                <Icon className="w-3.5 h-3.5 relative z-10" />
                                <span className="relative z-10 hidden sm:inline">{mode.label}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="flex-1 h-px bg-border/30" />

                {/* Settings button for Sunburst */}
                {activeView === "sunburst" && (
                    <button
                        onClick={() => setShowControls(!showControls)}
                        className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            showControls ? "bg-primary/20 text-primary" : "hover:bg-secondary/50 text-muted-foreground"
                        )}
                        title="Configurar dimensões"
                    >
                        <Settings2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Content based on active view */}
            <AnimatePresence mode="wait">
                {activeView === "sunburst" && (
                    <motion.div
                        key="sunburst"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 flex flex-col min-h-0"
                    >
                        {/* Controls Panel */}
                        <AnimatePresence>
                            {showControls && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-3 space-y-2"
                                >
                                    {/* Metric Selector */}
                                    <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-0.5">
                                        {METRIC_OPTIONS.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setSelectedMetric(option.value)}
                                                className={cn(
                                                    "flex-1 px-2 py-1 text-[10px] font-medium rounded-md transition-all flex items-center justify-center gap-1",
                                                    selectedMetric === option.value
                                                        ? "bg-primary text-primary-foreground"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                                )}
                                            >
                                                <span>{option.icon}</span>
                                                <span className="hidden sm:inline">{option.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Core Toggles */}
                                    <div className="p-2 bg-secondary/30 rounded-lg border border-border/30">
                                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5 px-1">📊 Core</div>
                                        <div className="flex flex-wrap gap-1">
                                            {coreRingConfigs.map((ring) => (
                                                <button
                                                    key={ring.id}
                                                    onClick={() => toggleRing(ring.id)}
                                                    className={cn(
                                                        "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap",
                                                        ring.enabled
                                                            ? "text-white shadow-sm"
                                                            : "bg-secondary/50 text-muted-foreground hover:bg-secondary/70"
                                                    )}
                                                    style={ring.enabled ? { backgroundColor: DIMENSION_COLORS[ring.id]?.primary || "#8B5CF6" } : {}}
                                                >
                                                    {ring.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                    <span>{ring.icon}</span>
                                                    <span>{ring.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Núcleos Toggle */}
                                    <div className="p-2 bg-secondary/30 rounded-lg border border-border/30">
                                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5 px-1">🔵 Núcleos</div>
                                        <div className="flex flex-wrap gap-1">
                                            {nucleosRingConfig.map((ring) => (
                                                <button
                                                    key={ring.id}
                                                    onClick={() => toggleRing(ring.id)}
                                                    className={cn(
                                                        "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap",
                                                        ring.enabled
                                                            ? "text-white shadow-sm"
                                                            : "bg-secondary/50 text-muted-foreground hover:bg-secondary/70"
                                                    )}
                                                    style={ring.enabled ? { backgroundColor: DIMENSION_COLORS[ring.id]?.primary || "#06B6D4" } : {}}
                                                >
                                                    {ring.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                    <span>{ring.icon}</span>
                                                    <span>{ring.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Origin Hierarchy Toggles (5 levels) */}
                                    <div className="p-2 bg-secondary/30 rounded-lg border border-border/30">
                                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5 px-1">🎯 Hierarquia de Origens</div>
                                        <div className="flex flex-wrap gap-1">
                                            {originRingConfigs.map((ring) => (
                                                <button
                                                    key={ring.id}
                                                    onClick={() => toggleRing(ring.id)}
                                                    className={cn(
                                                        "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap",
                                                        ring.enabled
                                                            ? "text-white shadow-sm"
                                                            : "bg-secondary/50 text-muted-foreground hover:bg-secondary/70"
                                                    )}
                                                    style={ring.enabled ? { backgroundColor: DIMENSION_COLORS[ring.id]?.primary || "#10B981" } : {}}
                                                >
                                                    {ring.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                    <span>{ring.icon}</span>
                                                    <span>{ring.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* UTM Toggles */}
                                    <div className="p-2 bg-secondary/30 rounded-lg border border-border/30">
                                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5 px-1">🔗 UTMs (Tráfego)</div>
                                        <div className="flex flex-wrap gap-1">
                                            {utmRingConfigs.map((ring) => (
                                                <button
                                                    key={ring.id}
                                                    onClick={() => toggleRing(ring.id)}
                                                    className={cn(
                                                        "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap",
                                                        ring.enabled
                                                            ? "text-white shadow-sm"
                                                            : "bg-secondary/50 text-muted-foreground hover:bg-secondary/70"
                                                    )}
                                                    style={ring.enabled ? { backgroundColor: DIMENSION_COLORS[ring.id]?.primary || "#EC4899" } : {}}
                                                >
                                                    {ring.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                    <span>{ring.icon}</span>
                                                    <span>{ring.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Sunburst Chart */}
                        <div className="flex-1 min-h-0 relative">
                            {enabledCount === 0 ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                    <p>Selecione pelo menos uma dimensão</p>
                                </div>
                            ) : (
                                <motion.div
                                    key={`chart-${enabledCount}-${selectedMetric}`}
                                    initial={{ opacity: 0, scale: 0.92 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                                    className="h-full relative"
                                >
                                    {/* Ambient glow */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div
                                            className="w-[70%] h-[70%] rounded-full opacity-20 blur-2xl"
                                            style={{
                                                background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(6, 182, 212, 0.2) 50%, transparent 70%)",
                                            }}
                                        />
                                    </div>



                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPie>
                                            <defs>
                                                <filter id="baseGlow" x="-5%" y="-5%" width="110%" height="110%">
                                                    <feGaussianBlur stdDeviation="0.8" result="blur" />
                                                    <feMerge>
                                                        <feMergeNode in="blur" />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                            </defs>

                                            {ringsData.map((ring, ringIndex) => (
                                                <Pie
                                                    key={ring.id}
                                                    data={ring.segments}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={`${ring.innerRadius}%`}
                                                    outerRadius={`${ring.outerRadius}%`}
                                                    paddingAngle={ring.segments.length > 1 ? 2 : 0}
                                                    animationBegin={ringIndex * 150}
                                                    animationDuration={800}
                                                    animationEasing="ease-out"
                                                    onMouseEnter={(_, index) => {
                                                        setHoveredSegment(ring.segments[index]);
                                                    }}
                                                    onMouseLeave={() => setHoveredSegment(null)}
                                                >
                                                    {ring.segments.map((segment) => {
                                                        const isHovered = hoveredSegment?.id === segment.id;
                                                        const hasHover = hoveredSegment !== null;

                                                        return (
                                                            <Cell
                                                                key={`${ring.id}-${segment.id}`}
                                                                fill={segment.color}
                                                                stroke={isHovered ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.06)"}
                                                                strokeWidth={isHovered ? 2 : 1}
                                                                style={{
                                                                    filter: isHovered ? "url(#baseGlow) brightness(1.2)" : "url(#baseGlow)",
                                                                    opacity: hasHover && !isHovered ? 0.4 : 1,
                                                                    transform: isHovered ? "scale(1.02)" : "scale(1)",
                                                                    transformOrigin: "center center",
                                                                    transition: "all 0.2s ease-out",
                                                                    cursor: "pointer",
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </Pie>
                                            ))}

                                            <Tooltip content={<CustomSunburstTooltip metric={selectedMetric} activeSegment={hoveredSegment} hierarchyMap={originHierarchy?.hierarchyMap} />} />
                                        </RechartsPie>
                                    </ResponsiveContainer>
                                </motion.div>
                            )}
                        </div>

                        {/* Legend */}
                        <div className="mt-2 pt-2 border-t border-white/5">
                            <div className="flex flex-wrap gap-2 justify-center">
                                {ringsData.map((ring) => (
                                    <div key={ring.id} className="flex items-center gap-1.5">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: ring.color }}
                                        />
                                        <span className="text-[10px] text-muted-foreground">
                                            {ring.icon} {ring.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeView === "purchase-window" && (
                    <motion.div
                        key="purchase-window"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Janela de Compra
                            </h3>
                        </div>

                        {purchaseWindowData ? (
                            <>
                                {/* Main Metric with Insights */}
                                <div className="mb-4">
                                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-violet-500/10 border border-primary/20">
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                                            Tempo Médio de Conversão
                                        </div>
                                        <div className="flex items-baseline justify-center gap-2">
                                            <span className="text-4xl font-bold tracking-tight text-foreground">
                                                {purchaseWindowData.averageDays.toFixed(0)}
                                            </span>
                                            <span className="text-lg text-muted-foreground">dias</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            baseado em {purchaseWindowData.totalConversions} conversões
                                        </div>
                                    </div>

                                    {/* Comparative Insights Strip */}
                                    {purchaseWindowData.byVendedor.length > 0 && (() => {
                                        const sortedBySpeed = [...purchaseWindowData.byVendedor].sort((a, b) => a.averageDays - b.averageDays);
                                        const sortedByVolume = [...purchaseWindowData.byVendedor].sort((a, b) => b.conversions - a.conversions);
                                        const fastest = sortedBySpeed[0];
                                        const mostVolume = sortedByVolume[0];
                                        const isSamePerson = fastest.name === mostVolume.name;

                                        return (
                                            <div className="grid grid-cols-2 gap-2 mt-3">
                                                {/* Top Agilidade */}
                                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="text-xs">⚡</span>
                                                        <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Top Agilidade</span>
                                                    </div>
                                                    <div className="text-sm font-medium text-foreground truncate">{fastest.name}</div>
                                                    <div className="text-xs text-muted-foreground">{fastest.averageDays.toFixed(0)} dias · {fastest.conversions} conv.</div>
                                                </div>

                                                {/* Top Volume */}
                                                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="text-xs">📈</span>
                                                        <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Top Volume</span>
                                                    </div>
                                                    <div className="text-sm font-medium text-foreground truncate">{mostVolume.name}</div>
                                                    <div className="text-xs text-muted-foreground">{mostVolume.conversions} conv. · {mostVolume.averageDays.toFixed(0)} dias</div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Ranking by Vendedor */}
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Trophy className="w-4 h-4 text-amber-400" />
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Ranking por Vendedor
                                        </span>
                                    </div>

                                    <div className="space-y-2 overflow-y-auto max-h-[200px] pr-1">
                                        {purchaseWindowData.byVendedor
                                            .sort((a, b) => a.averageDays - b.averageDays)
                                            .slice(0, 5)
                                            .map((vendedor, index) => {
                                                const isTop = index === 0;
                                                const maxDays = Math.max(...purchaseWindowData.byVendedor.map(v => v.averageDays));
                                                const barWidth = (vendedor.averageDays / maxDays) * 100;

                                                return (
                                                    <div
                                                        key={vendedor.name}
                                                        className={cn(
                                                            "p-3 rounded-lg border transition-all",
                                                            isTop
                                                                ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30"
                                                                : "bg-muted/20 border-white/5"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn(
                                                                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                                                                    isTop ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                                                                )}>
                                                                    {index + 1}
                                                                </span>
                                                                <span className="font-medium text-foreground text-sm">
                                                                    {vendedor.name}
                                                                </span>
                                                                {isTop && <span className="text-xs">🏆</span>}
                                                            </div>
                                                            <div className="text-right">
                                                                <span className={cn(
                                                                    "text-lg font-bold",
                                                                    isTop ? "text-emerald-400" : "text-foreground"
                                                                )}>
                                                                    {vendedor.averageDays.toFixed(0)}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground ml-1">dias</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                                                            <motion.div
                                                                className={cn(
                                                                    "h-full rounded-full",
                                                                    isTop ? "bg-emerald-500" : "bg-primary/60"
                                                                )}
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${barWidth}%` }}
                                                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                                            />
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground mt-1">
                                                            {vendedor.conversions} conversões
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                                <Clock className="w-12 h-12 mb-4 opacity-30" />
                                <p className="text-sm">Dados insuficientes</p>
                                <p className="text-xs mt-1">Necessário ter conversões para calcular a janela de compra</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeView === "trend" && (
                    <motion.div
                        key="trend"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 flex flex-col min-h-0"
                    >
                        {/* Use unifiedTrendData if available, otherwise fallback to trendData */}
                        {(() => {
                            const dataToUse = unifiedTrendData.length > 0
                                ? unifiedTrendData
                                : trendData.map(d => ({
                                    date: d.month,
                                    occupancyRate: d.value / 100,
                                    enrollments: 0,
                                } as UnifiedTrendDataPoint));

                            return dataToUse.length > 0 ? (
                                <div className="flex-1 min-h-0">
                                    <UnifiedTrendChart
                                        data={dataToUse}
                                        title="Tendências"
                                        defaultMetrics={['enrollments', 'revenue', 'conversionRate']}
                                    />
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                                    Sem dados suficientes para tendência
                                </div>
                            );
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
