import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthWidgetProps {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  onClick?: () => void;
  variant?: "default" | "warning" | "success";
}

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const HealthWidget = ({
  title,
  value,
  subtitle,
  icon: Icon,
  onClick,
  variant = "default",
  tooltip,
}: HealthWidgetProps & { tooltip?: string }) => {
  const variants = {
    default: "hover:shadow-md border-border",
    warning: "hover:shadow-md border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/10",
    success: "hover:shadow-md border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10",
  };

  const iconVariants = {
    default: "bg-primary/10 text-primary",
    warning: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
    success: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  };

  const WidgetContent = (
    <Card
      className={cn(
        "p-6 border transition-all duration-300 h-full",
        variants[variant],
        onClick && "cursor-pointer hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-foreground">{value}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className={cn("p-3 rounded-xl", iconVariants[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );

  if (!tooltip) return WidgetContent;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-full">{WidgetContent}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
