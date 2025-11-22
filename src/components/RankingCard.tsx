import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";

interface RankingItem {
  name: string;
  value: number;
  subtitle?: string;
  percentage?: number;
}

interface RankingCardProps {
  title: string;
  items: RankingItem[];
  icon?: React.ComponentType<{ className?: string }>;
  maxItems?: number;
}

export const RankingCard = ({ title, items, icon: Icon = Trophy, maxItems = 5 }: RankingCardProps) => {
  const sortedItems = [...items].sort((a, b) => b.value - a.value).slice(0, maxItems);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="p-6 border border-border bg-card hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-primary/10 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">Top {maxItems} performance</p>
        </div>
      </div>

      <div className="space-y-3">
        {sortedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum dado disponível
          </p>
        ) : (
          sortedItems.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            const displayPercentage = item.percentage !== undefined ? item.percentage : percentage;

            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-card border-2 border-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.name}
                  </p>
                  {item.subtitle && (
                    <p className="text-xs text-muted-foreground">
                      {item.subtitle}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-foreground">
                    {item.value}
                  </span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                    {displayPercentage.toFixed(0)}%
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
