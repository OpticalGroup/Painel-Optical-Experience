import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Users, GraduationCap, TrendingUp, DollarSign } from "lucide-react";
import { cn, formatBRL } from "@/lib/utils";

interface HeroMetricProps {
    label: string;
    value: string;
    subValue?: string;
    trend?: { value: string; isPositive: boolean };
    delay?: number;
    color?: "default" | "success" | "primary";
}

function HeroMetric({ label, value, subValue, trend, delay = 0, color = "default" }: HeroMetricProps) {
    const colorStyles = {
        default: "text-foreground",
        success: "text-success",
        primary: "text-primary"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col"
        >
            <span className="text-overline text-muted-foreground/60 mb-2">
                {label}
            </span>
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                <span className={cn(
                    "text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight",
                    colorStyles[color]
                )}>
                    {value}
                </span>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
                        trend.isPositive
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                    )}>
                        {trend.isPositive
                            ? <ArrowUpRight className="w-3 h-3" />
                            : <ArrowDownRight className="w-3 h-3" />
                        }
                        {trend.value}
                    </div>
                )}
            </div>
            {subValue && (
                <span className="text-sm text-muted-foreground mt-2 font-light">
                    {subValue}
                </span>
            )}
        </motion.div>
    );
}

interface SecondaryMetricProps {
    label: string;
    value: string | number;
    subLabel?: string;
    icon?: React.ElementType;
}

function SecondaryMetric({ label, value, subLabel, icon: Icon }: SecondaryMetricProps) {
    return (
        <div className="flex flex-col p-4 border-l border-border/10 first:border-0">
            <div className="flex items-center gap-2 mb-1">
                {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground/50" />}
                <span className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider">
                    {label}
                </span>
            </div>
            <span className="text-2xl font-normal text-foreground/90">
                {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </span>
            {subLabel && (
                <span className="text-xs text-muted-foreground/40 mt-1">{subLabel}</span>
            )}
        </div>
    );
}

interface HeroKPIsProps {
    totalRevenue: number;
    totalEnrolled: number;
    totalPaid: number;
    totalCapacity: number;
    cohortsCount: number;
    conversionRate?: number;
    revenueTrend?: { value: string; isPositive: boolean };
    conversionTrend?: { value: string; isPositive: boolean };
    isLoading?: boolean;
}

export function HeroKPIs({
    totalRevenue,
    totalEnrolled,
    totalPaid,
    totalCapacity,
    cohortsCount,
    conversionRate,
    revenueTrend = { value: "15%", isPositive: true },
    conversionTrend,
    isLoading = false
}: HeroKPIsProps) {
    const calculatedConversion = conversionRate ?? (totalEnrolled > 0 ? (totalPaid / totalEnrolled) * 100 : 0);
    const availableSpots = totalCapacity - totalEnrolled;

    if (isLoading) {
        return (
            <div className="flex flex-col gap-8 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 px-2">
                    <div className="h-24 bg-muted/20 rounded-xl" />
                    <div className="h-24 bg-muted/20 rounded-xl" />
                </div>
                <div className="h-20 bg-muted/10 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8">
            {/* Hero Section - 2 Main KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-12 px-0 sm:px-2">
                <HeroMetric
                    label="Receita Total"
                    value={formatBRL(totalRevenue)}
                    subValue="arrecadado (pagamentos confirmados)"
                    trend={revenueTrend}
                    delay={0}
                    color="default"
                />
                <HeroMetric
                    label="Taxa de Conversão"
                    value={`${calculatedConversion.toFixed(1)}%`}
                    subValue="matrículas pagas / total matriculados"
                    trend={conversionTrend}
                    delay={0.1}
                    color="default"
                />
            </div>

            {/* Secondary Metrics Strip */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-0 glass-card rounded-2xl border border-white/5"
            >
                <SecondaryMetric
                    label="Total Alunos"
                    value={totalEnrolled}
                    subLabel={`de ${totalCapacity} vagas`}
                    icon={Users}
                />
                <SecondaryMetric
                    label="Turmas Ativas"
                    value={cohortsCount}
                    subLabel="em andamento"
                    icon={GraduationCap}
                />
                <SecondaryMetric
                    label="Matrículas Pagas"
                    value={totalPaid}
                    subLabel="confirmadas"
                    icon={TrendingUp}
                />
                <SecondaryMetric
                    label="Vagas Disponíveis"
                    value={availableSpots > 0 ? availableSpots : 0}
                    subLabel={availableSpots < 0 ? `${Math.abs(availableSpots)} em lista de espera` : "abertas"}
                    icon={DollarSign}
                />
            </motion.div>
        </div>
    );
}
