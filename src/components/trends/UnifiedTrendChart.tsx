/**
 * UnifiedTrendChart - Customizable Metric Trend Visualization
 * 
 * A flexible trend chart that allows users to toggle any available metric
 * on/off. Uses clean, non-overwhelming UI with collapsible metric selector.
 * 
 * Adapted from Nexus Cortex for Optical Experience dashboard.
 */

import { useState, useMemo } from 'react';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    MetricId,
    MetricConfig,
    METRIC_CONFIGS,
    METRIC_PRESETS,
} from './metricConfigs';
import { TrendDataPoint } from './types';

// ============================================
// TYPES
// ============================================

type ChartPeriod = '7D' | '30D' | '90D' | '180D' | '1Y' | 'ALL' | 'CUSTOM';

interface CustomDateRange {
    startDate: Date | undefined;
    endDate: Date | undefined;
}

interface UnifiedTrendChartProps {
    data: TrendDataPoint[];
    title?: string;
    defaultMetrics?: MetricId[];
    className?: string;
}

interface ChartDataPoint {
    date: string;
    [key: string]: string | number | undefined;
}

// ============================================
// CONSTANTS
// ============================================

const PERIODS: { value: ChartPeriod; label: string }[] = [
    { value: '7D', label: '7D' },
    { value: '30D', label: '30D' },
    { value: '90D', label: '90D' },
    { value: '180D', label: '180D' },
    { value: '1Y', label: '1A' },
    { value: 'ALL', label: 'Tudo' },
    { value: 'CUSTOM', label: '📅' },
];

const formatDateShort = (date: Date): string => format(date, 'dd/MM/yy', { locale: ptBR });

// ============================================
// CUSTOM DATE RANGE MODAL
// ============================================

interface CustomDateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (range: CustomDateRange) => void;
    currentRange: CustomDateRange;
}

function CustomDateModal({ isOpen, onClose, onApply, currentRange }: CustomDateModalProps) {
    const [startDate, setStartDate] = useState<Date | undefined>(currentRange.startDate);
    const [endDate, setEndDate] = useState<Date | undefined>(currentRange.endDate);

    const handleApply = () => {
        onApply({ startDate, endDate });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Período Personalizado</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Data Inicial</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {startDate ? formatDateShort(startDate) : 'Selecionar'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <CalendarComponent
                                        mode="single"
                                        selected={startDate}
                                        onSelect={setStartDate}
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Data Final</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {endDate ? formatDateShort(endDate) : 'Selecionar'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <CalendarComponent
                                        mode="single"
                                        selected={endDate}
                                        onSelect={setEndDate}
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <Button onClick={handleApply} disabled={!startDate || !endDate}>
                        Aplicar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ============================================
// HELPER COMPONENTS
// ============================================

interface MiniPeriodSelectorProps {
    value: ChartPeriod;
    onChange: (p: ChartPeriod) => void;
    customRange?: CustomDateRange;
    onCustomClick: () => void;
}

function MiniPeriodSelector({ value, onChange, customRange, onCustomClick }: MiniPeriodSelectorProps) {
    return (
        <div className="flex items-center gap-0.5 bg-secondary/30 rounded-lg p-0.5">
            {PERIODS.map((period) => (
                <button
                    key={period.value}
                    onClick={() => {
                        if (period.value === 'CUSTOM') {
                            onCustomClick();
                        } else {
                            onChange(period.value);
                        }
                    }}
                    className={cn(
                        'px-2 py-0.5 text-[10px] font-medium rounded-md transition-all',
                        value === period.value
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    )}
                    title={period.value === 'CUSTOM' && customRange?.startDate && customRange?.endDate
                        ? `${formatDateShort(customRange.startDate)} - ${formatDateShort(customRange.endDate)}`
                        : undefined
                    }
                >
                    {period.label}
                </button>
            ))}
        </div>
    );
}

// Preset dropdown
function PresetDropdown({ onSelect }: { onSelect: (metrics: MetricId[]) => void }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 hover:bg-secondary text-[10px] font-medium text-muted-foreground transition-colors">
                    ✨ Presets
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1" align="start">
                <div className="space-y-0.5">
                    {Object.entries(METRIC_PRESETS).map(([key, preset]) => (
                        <button
                            key={key}
                            onClick={() => onSelect(preset.metrics)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-secondary/50 transition-colors"
                        >
                            <span>{preset.icon}</span>
                            <span>{preset.label}</span>
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}

// Metric toggle button (compact)
function MetricToggle({
    metric,
    enabled,
    onToggle,
}: {
    metric: MetricConfig;
    enabled: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            onClick={onToggle}
            className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-all',
                enabled
                    ? 'bg-secondary text-foreground ring-1 ring-primary/30'
                    : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
            )}
        >
            <div
                className={cn('w-2 h-2 rounded-full', enabled ? 'opacity-100' : 'opacity-40')}
                style={{ backgroundColor: metric.color }}
            />
            {metric.shortLabel}
        </button>
    );
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
    if (!active || !payload?.length) return null;

    return (
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-xl">
            <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
            <div className="space-y-0.5">
                {payload.map((entry: any, index: number) => {
                    const metric = METRIC_CONFIGS.find((m) => m.id === entry.dataKey);
                    return (
                        <div key={index} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-muted-foreground">{entry.name}:</span>
                            <span className="font-medium" style={{ color: entry.color }}>
                                {metric ? metric.format(entry.value) : entry.value}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function UnifiedTrendChart({
    data,
    title = 'Tendências',
    defaultMetrics = ['enrollments', 'revenue', 'conversionRate'],
    className,
}: UnifiedTrendChartProps) {
    const [period, setPeriod] = useState<ChartPeriod>('30D');
    const [showMetricSelector, setShowMetricSelector] = useState(false);
    const [enabledMetrics, setEnabledMetrics] = useState<Set<MetricId>>(new Set(defaultMetrics));
    const [showCustomDateModal, setShowCustomDateModal] = useState(false);
    const [customRange, setCustomRange] = useState<CustomDateRange>({
        startDate: undefined,
        endDate: undefined,
    });

    // Handle custom date range apply
    const handleCustomRangeApply = (range: CustomDateRange) => {
        setCustomRange(range);
        setPeriod('CUSTOM');
    };

    // Get filtered data based on period
    const getFilteredData = <T extends { date: string }>(dataArray: T[]): T[] => {
        if (period === 'CUSTOM' && customRange.startDate && customRange.endDate) {
            const startStr = customRange.startDate.toISOString().slice(0, 10);
            const endStr = customRange.endDate.toISOString().slice(0, 10);
            return dataArray.filter((d) => d.date >= startStr && d.date <= endStr);
        }

        const getDays = (): number => {
            switch (period) {
                case '7D': return 7;
                case '30D': return 30;
                case '90D': return 90;
                case '180D': return 180;
                case '1Y': return 365;
                case 'ALL': return dataArray.length;
                default: return 30;
            }
        };

        return dataArray.slice(-getDays());
    };

    // Prepare chart data
    const chartData = useMemo((): ChartDataPoint[] => {
        const filtered = getFilteredData(data);
        return filtered.map((d) => ({
            ...d,
            // Ensure all metrics are present
            conversionRate: d.conversionRate ?? (d.enrollments && d.paid ? d.paid / d.enrollments : undefined),
            occupancyRate: d.occupancyRate ?? (d.capacity && d.enrollments ? d.enrollments / d.capacity : undefined),
            ticketMedio: d.ticketMedio ?? (d.revenue && d.paid ? d.revenue / d.paid : undefined),
        }));
    }, [data, period, customRange]);

    // Toggle metric
    const toggleMetric = (id: MetricId) => {
        setEnabledMetrics((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Apply preset
    const applyPreset = (metrics: MetricId[]) => {
        setEnabledMetrics(new Set(metrics));
    };

    // Get enabled metric configs
    const enabledConfigs = METRIC_CONFIGS.filter((m) => enabledMetrics.has(m.id));
    const hasLeftAxis = enabledConfigs.some((m) => m.yAxisId === 'left');
    const hasRightAxis = enabledConfigs.some((m) => m.yAxisId === 'right');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn('h-full w-full flex flex-col', className)}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-2 shrink-0">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    {title}
                </h3>

                <div className="flex items-center gap-2">
                    <MiniPeriodSelector
                        value={period}
                        onChange={setPeriod}
                        customRange={customRange}
                        onCustomClick={() => setShowCustomDateModal(true)}
                    />

                    {/* Settings toggle */}
                    <button
                        onClick={() => setShowMetricSelector(!showMetricSelector)}
                        className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            showMetricSelector
                                ? 'bg-primary/20 text-primary'
                                : 'hover:bg-secondary/50 text-muted-foreground'
                        )}
                        title="Configurar métricas"
                    >
                        <Settings2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Metric Selector (Collapsible) */}
            <AnimatePresence>
                {showMetricSelector && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="mb-2 shrink-0 overflow-hidden"
                    >
                        <div className="p-2 bg-secondary/20 rounded-lg border border-border/30 space-y-1.5">
                            {/* Presets row */}
                            <div className="flex items-center gap-2">
                                <PresetDropdown onSelect={applyPreset} />
                                <span className="text-[9px] text-muted-foreground">ou escolha métricas:</span>
                            </div>

                            {/* Metrics by category - compact grid */}
                            <div className="flex flex-wrap gap-1">
                                {METRIC_CONFIGS.map((metric) => (
                                    <MetricToggle
                                        key={metric.id}
                                        metric={metric}
                                        enabled={enabledMetrics.has(metric.id)}
                                        onToggle={() => toggleMetric(metric.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chart */}
            <div className="flex-1 min-h-0">
                {enabledConfigs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        <p>Selecione ao menos uma métrica</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <defs>
                                {enabledConfigs.map((m) => (
                                    <linearGradient key={m.gradientId} id={m.gradientId} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={m.color} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={m.color} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.2)" vertical={false} />

                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                                interval="preserveStartEnd"
                            />

                            {hasLeftAxis && (
                                <YAxis
                                    yAxisId="left"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                                    width={35}
                                />
                            )}

                            {hasRightAxis && (
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                                    width={25}
                                />
                            )}

                            <Tooltip content={<CustomTooltip />} />

                            {/* Render metrics */}
                            {enabledConfigs.map((metric) =>
                                metric.type === 'area' ? (
                                    <Area
                                        key={metric.id}
                                        yAxisId={metric.yAxisId}
                                        type="monotone"
                                        dataKey={metric.id}
                                        name={metric.label}
                                        stroke={metric.color}
                                        strokeWidth={1.5}
                                        fillOpacity={1}
                                        fill={`url(#${metric.gradientId})`}
                                    />
                                ) : (
                                    <Line
                                        key={metric.id}
                                        yAxisId={metric.yAxisId}
                                        type="monotone"
                                        dataKey={metric.id}
                                        name={metric.label}
                                        stroke={metric.color}
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                )
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Statistics Legend - Average vs Current */}
            {enabledConfigs.length > 0 && chartData.length > 0 && (
                <div className="mt-2 shrink-0">
                    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(enabledConfigs.length, 4)}, 1fr)` }}>
                        {enabledConfigs.map((metric) => {
                            // Calculate average and current for this metric
                            const values = chartData
                                .map((d) => Number(d[metric.id]) || 0)
                                .filter((v) => v !== 0);

                            if (values.length === 0) {
                                return (
                                    <div
                                        key={metric.id}
                                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/20 border border-border/20"
                                    >
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: metric.color }} />
                                        <span className="text-[10px] text-muted-foreground">{metric.shortLabel}</span>
                                    </div>
                                );
                            }

                            const average = values.reduce((a, b) => a + b, 0) / values.length;
                            const current = values[values.length - 1];
                            const percentDiff = average !== 0 ? ((current - average) / average) * 100 : 0;

                            // Determine status
                            const isAbove = percentDiff > 5;
                            const isBelow = percentDiff < -5;
                            const statusIcon = isAbove ? '🔺' : isBelow ? '🔻' : '➡️';
                            const statusColor = isAbove ? 'text-emerald-400' : isBelow ? 'text-rose-400' : 'text-muted-foreground';

                            return (
                                <div
                                    key={metric.id}
                                    className="flex flex-col gap-0.5 px-2 py-1.5 rounded-lg bg-secondary/20 border border-border/20"
                                >
                                    {/* Metric Header */}
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: metric.color }} />
                                        <span className="text-[10px] font-medium text-foreground truncate">{metric.shortLabel}</span>
                                        <span className={cn("text-[9px] ml-auto", statusColor)}>{statusIcon}</span>
                                    </div>

                                    {/* Values Row */}
                                    <div className="flex items-center justify-between gap-2 text-[9px]">
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground/60">Média</span>
                                            <span className="text-muted-foreground font-medium">{metric.format(average)}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-muted-foreground/60">Atual</span>
                                            <span className={cn("font-semibold", statusColor)}>{metric.format(current)}</span>
                                        </div>
                                    </div>

                                    {/* Difference Indicator */}
                                    <div className={cn("text-[8px] text-center font-medium", statusColor)}>
                                        {percentDiff > 0 ? '+' : ''}{percentDiff.toFixed(1)}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Custom Date Range Modal */}
            <CustomDateModal
                isOpen={showCustomDateModal}
                onClose={() => setShowCustomDateModal(false)}
                onApply={handleCustomRangeApply}
                currentRange={customRange}
            />
        </motion.div>
    );
}
