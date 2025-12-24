/**
 * Types for Trend Charts - Optical Experience
 */

export interface TrendDataPoint {
    date: string;
    enrollments?: number;
    paid?: number;
    pending?: number;
    revenue?: number;
    ticketMedio?: number;
    conversionRate?: number;
    occupancyRate?: number;
    capacity?: number;
    available?: number;
}

export interface DailyMetrics {
    date: string;
    enrollments: number;
    paid: number;
    pending: number;
    revenue: number;
    capacity: number;
    available: number;
}

export interface ChartDataPoint {
    date: string;
    [key: string]: string | number | undefined;
}
