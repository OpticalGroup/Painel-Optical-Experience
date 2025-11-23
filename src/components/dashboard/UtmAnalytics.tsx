import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AllUtmStats, UtmStatsItem } from "@/integrations/supabase/hooks/useEnrollmentAnalytics";
import { TrendingUp, Filter, Link, Tag, FileText, Globe, MousePointer, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UtmAnalyticsProps {
    data: AllUtmStats;
    onStatusFilterChange: (status: string) => void;
    currentStatusFilter: string;
}

const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "#059669", // Emerald 600
    "#d97706", // Amber 600
    "#4f46e5", // Indigo 600
    "#db2777", // Pink 600
    "#7c3aed", // Violet 600
    "#0d9488", // Teal 600
];

const renderActiveShape = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 5) * cos;
    const sy = cy + (outerRadius + 5) * sin;
    const mx = cx + (outerRadius + 15) * cos;
    const my = cy + (outerRadius + 15) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 12;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-sm font-bold">
                {payload.name.substring(0, 10)}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 6}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 4}
                outerRadius={outerRadius + 8}
                fill={fill}
            />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={textAnchor} fill="#888" fontSize={10}>
                {`${value}`}
            </text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} dy={12} textAnchor={textAnchor} fill="#999" fontSize={9}>
                {`(${(percent * 100).toFixed(0)}%)`}
            </text>
        </g>
    );
};

const UtmChart = ({ title, icon: Icon, data }: { title: string; icon: any; data: UtmStatsItem[] }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    if (!data || data.length === 0) {
        return (
            <Card className="h-[300px] flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground text-sm">
                        <p>Sem dados</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-[300px] flex flex-col hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 relative min-h-0">
                <div className="h-full w-full absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            {/* @ts-ignore */}
                            <Pie
                                activeIndex={activeIndex}
                                activeShape={renderActiveShape}
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={2}
                                dataKey="count"
                                onMouseEnter={onPieEnter}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                        stroke="hsl(var(--background))"
                                        strokeWidth={2}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export const UtmAnalytics = ({ data, onStatusFilterChange, currentStatusFilter }: UtmAnalyticsProps) => {
    if (!data) return null;

    return (
        <div className="space-y-4 col-span-1 lg:col-span-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Análise de Rastreamento (UTM)
                </h2>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={currentStatusFilter} onValueChange={onStatusFilterChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Status</SelectItem>
                            <SelectItem value="active">Ativos (Sem Cancelados)</SelectItem>
                            <SelectItem value="paid">Pagos</SelectItem>
                            <SelectItem value="pending">Pendentes</SelectItem>
                            <SelectItem value="cancelled">Cancelados</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <UtmChart title="Origem (Source)" icon={Link} data={data.source} />
                <UtmChart title="Meio (Medium)" icon={Globe} data={data.medium} />
                <UtmChart title="Campanha (Campaign)" icon={Tag} data={data.campaign} />
                <UtmChart title="Termo (Term)" icon={Search} data={data.term} />
                <UtmChart title="Conteúdo (Content)" icon={FileText} data={data.content} />
                <UtmChart title="Página (Page)" icon={MousePointer} data={data.page} />
            </div>
        </div>
    );
};
