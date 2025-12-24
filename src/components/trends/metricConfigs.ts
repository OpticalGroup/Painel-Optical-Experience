/**
 * Metric Configurations for Trend Charts - Optical Experience
 * 
 * Centralized configuration for all available metrics in the enrollment dashboard.
 * Includes colors, formatting, and axis assignment.
 */

// ============================================
// TYPES
// ============================================

export type MetricId =
    // Matrículas
    | 'enrollments' | 'paid' | 'pending' | 'signed'
    // Financeiro
    | 'revenue' | 'ticketMedio'
    // Taxas
    | 'conversionRate' | 'occupancyRate'
    // Capacidade
    | 'capacity' | 'available';

export interface MetricConfig {
    id: MetricId;
    label: string;
    shortLabel: string;
    color: string;
    gradientId: string;
    yAxisId: 'left' | 'right';
    type: 'area' | 'line';
    format: (value: number) => string;
    unit?: string;
    category: 'enrollments' | 'financial' | 'rates' | 'capacity';
    defaultEnabled?: boolean;
}

// ============================================
// FORMATTERS
// ============================================

const formatCurrency = (v: number): string => {
    if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}K`;
    return `R$ ${v.toFixed(0)}`;
};

const formatNumber = (v: number): string => {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return v.toFixed(0);
};

const formatPercent = (v: number): string => `${(v * 100).toFixed(1)}%`;

// ============================================
// METRIC CONFIGURATIONS
// ============================================

export const METRIC_CONFIGS: MetricConfig[] = [
    // Matrículas
    {
        id: 'enrollments',
        label: 'Matrículas Totais',
        shortLabel: 'Matr.',
        color: '#3b82f6',
        gradientId: 'gradientEnrollments',
        yAxisId: 'left',
        type: 'area',
        format: formatNumber,
        category: 'enrollments',
        defaultEnabled: true,
    },
    {
        id: 'paid',
        label: 'Pagos',
        shortLabel: 'Pagos',
        color: '#10b981',
        gradientId: 'gradientPaid',
        yAxisId: 'left',
        type: 'area',
        format: formatNumber,
        category: 'enrollments',
        defaultEnabled: true,
    },
    {
        id: 'pending',
        label: 'Pendentes',
        shortLabel: 'Pend.',
        color: '#f59e0b',
        gradientId: 'gradientPending',
        yAxisId: 'left',
        type: 'area',
        format: formatNumber,
        category: 'enrollments',
    },
    {
        id: 'signed',
        label: 'Assinados',
        shortLabel: 'Assin.',
        color: '#8b5cf6',
        gradientId: 'gradientSigned',
        yAxisId: 'left',
        type: 'area',
        format: formatNumber,
        category: 'enrollments',
    },

    // Financeiro
    {
        id: 'revenue',
        label: 'Receita',
        shortLabel: 'Receita',
        color: '#8b5cf6',
        gradientId: 'gradientRevenue',
        yAxisId: 'left',
        type: 'area',
        format: formatCurrency,
        unit: 'R$',
        category: 'financial',
        defaultEnabled: true,
    },
    {
        id: 'ticketMedio',
        label: 'Ticket Médio',
        shortLabel: 'Ticket',
        color: '#06b6d4',
        gradientId: 'gradientTicket',
        yAxisId: 'right',
        type: 'line',
        format: formatCurrency,
        unit: 'R$',
        category: 'financial',
    },

    // Taxas
    {
        id: 'conversionRate',
        label: 'Taxa de Conversão',
        shortLabel: 'Conv.',
        color: '#10b981',
        gradientId: 'gradientConversion',
        yAxisId: 'right',
        type: 'line',
        format: formatPercent,
        unit: '%',
        category: 'rates',
        defaultEnabled: true,
    },
    {
        id: 'occupancyRate',
        label: 'Taxa de Ocupação',
        shortLabel: 'Ocup.',
        color: '#ec4899',
        gradientId: 'gradientOccupancy',
        yAxisId: 'right',
        type: 'line',
        format: formatPercent,
        unit: '%',
        category: 'rates',
    },

    // Capacidade
    {
        id: 'capacity',
        label: 'Capacidade Total',
        shortLabel: 'Cap.',
        color: '#64748b',
        gradientId: 'gradientCapacity',
        yAxisId: 'left',
        type: 'line',
        format: formatNumber,
        category: 'capacity',
    },
    {
        id: 'available',
        label: 'Vagas Disponíveis',
        shortLabel: 'Disp.',
        color: '#94a3b8',
        gradientId: 'gradientAvailable',
        yAxisId: 'left',
        type: 'area',
        format: formatNumber,
        category: 'capacity',
    },
];

// Helpers
export const getMetricById = (id: MetricId): MetricConfig | undefined =>
    METRIC_CONFIGS.find(m => m.id === id);

export const getMetricsByCategory = (category: MetricConfig['category']): MetricConfig[] =>
    METRIC_CONFIGS.filter(m => m.category === category);

export const getDefaultMetrics = (): MetricId[] =>
    METRIC_CONFIGS.filter(m => m.defaultEnabled).map(m => m.id);

// Presets for quick selection
export const METRIC_PRESETS: Record<string, { label: string; metrics: MetricId[]; icon: string }> = {
    overview: {
        label: 'Visão Geral',
        icon: '📊',
        metrics: ['enrollments', 'revenue', 'conversionRate'],
    },
    enrollments: {
        label: 'Matrículas',
        icon: '👥',
        metrics: ['enrollments', 'paid', 'pending'],
    },
    financial: {
        label: 'Financeiro',
        icon: '💰',
        metrics: ['revenue', 'ticketMedio'],
    },
    performance: {
        label: 'Performance',
        icon: '📈',
        metrics: ['conversionRate', 'occupancyRate'],
    },
};

export const CATEGORY_LABELS: Record<MetricConfig['category'], string> = {
    enrollments: '👥 Matrículas',
    financial: '💰 Financeiro',
    rates: '📊 Taxas',
    capacity: '🏢 Capacidade',
};
