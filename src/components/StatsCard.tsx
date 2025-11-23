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
    <Card className="p-6 border border-border bg-card hover:shadow-md transition-all duration-300 h-full">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            {trend && (
              <span
                className={`text-sm font-medium ${trend.isPositive ? "text-primary" : "text-destructive"
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
        <div className="p-3 bg-primary/10 rounded-xl">
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
