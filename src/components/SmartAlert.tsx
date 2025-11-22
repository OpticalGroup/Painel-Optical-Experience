import { AlertTriangle, TrendingDown, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SmartAlertProps {
  type: "warning" | "danger" | "success";
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const SmartAlert = ({
  type,
  title,
  message,
  actionLabel,
  onAction,
  className,
}: SmartAlertProps) => {
  const styles = {
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-950/20",
      border: "border-yellow-200 dark:border-yellow-800",
      icon: "text-yellow-600 dark:text-yellow-400",
      title: "text-yellow-900 dark:text-yellow-100",
      IconComponent: AlertTriangle,
    },
    danger: {
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-200 dark:border-red-800",
      icon: "text-red-600 dark:text-red-400",
      title: "text-red-900 dark:text-red-100",
      IconComponent: TrendingDown,
    },
    success: {
      bg: "bg-green-50 dark:bg-green-950/20",
      border: "border-green-200 dark:border-green-800",
      icon: "text-green-600 dark:text-green-400",
      title: "text-green-900 dark:text-green-100",
      IconComponent: Sparkles,
    },
  };

  const style = styles[type];
  const Icon = style.IconComponent;

  return (
    <Card
      className={cn(
        "p-4 border-2",
        style.bg,
        style.border,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", style.icon)} />
        <div className="flex-1 space-y-1">
          <h4 className={cn("font-semibold text-sm", style.title)}>
            {title}
          </h4>
          <p className="text-sm text-muted-foreground">{message}</p>
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              size="sm"
              variant="outline"
              className="mt-2"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
