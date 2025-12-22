import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  tooltip,
}: StatsCardProps & { tooltip?: string }) => {
  const CardContent = (
    <Card className="glass-card hud-border p-6 hover:glow-cyan transition-all duration-300 h-full group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-foreground font-mono">{value}</h3>
            {trend && (
              <span
                className={`text-sm font-medium ${trend.isPositive ? "text-success ticker-up" : "text-destructive ticker-down"
                  }`}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className="p-3 rounded-xl transition-all duration-300 group-hover:scale-110"
          style={{
            background: 'linear-gradient(135deg, hsl(172 66% 50% / 0.15) 0%, hsl(199 89% 48% / 0.1) 100%)',
          }}
        >
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  );

  if (!tooltip) return CardContent;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-full cursor-help">{CardContent}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
