import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Calendar, MapPin } from "lucide-react";

interface CohortCardEnhancedProps {
  name: string;
  enrolled: number;
  capacity: number;
  paid: number;
  reserved: number;
  signed: number;
  startDate: string;
  location?: string;
  onViewDetails: () => void;
}

// Helper to create SVG arc path
const createArc = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string => {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  
  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
};

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

export const CohortCardEnhanced = ({
  name,
  enrolled,
  capacity,
  paid,
  reserved,
  signed,
  startDate,
  location = "São Paulo, BR",
  onViewDetails,
}: CohortCardEnhancedProps) => {
  const available = capacity - enrolled;
  const percentage = (enrolled / capacity) * 100;
  const isOverbooked = percentage > 100;
  const waitlist = isOverbooked ? enrolled - capacity : 0;

  // Calculate percentages for concentric rings
  // Ring 1 (outer): Enrolled vs Capacity
  const enrolledPercentage = Math.min((enrolled / capacity) * 100, 100);
  const enrolledAngle = (enrolledPercentage / 100) * 360;
  
  // Ring 2 (middle): Paid vs Enrolled
  const paidPercentage = enrolled > 0 ? (paid / enrolled) * 100 : 0;
  const paidAngle = (paidPercentage / 100) * 360;
  
  // Ring 3 (inner): Signed vs Paid
  const signedPercentage = paid > 0 ? (signed / paid) * 100 : 0;
  const signedAngle = (signedPercentage / 100) * 360;

  return (
    <Card className="group relative overflow-hidden border-0 bg-card hover:shadow-xl transition-all duration-500 rounded-2xl">
      {/* Header Section */}
      <div className="p-8 pb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-foreground leading-tight mb-3">
              {name}
            </h3>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{startDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            </div>
          </div>
          
          {isOverbooked && (
            <div className="px-3 py-1.5 bg-primary/10 rounded-full">
              <span className="text-xs font-bold text-primary tracking-wide">
                LOTADO
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart and Stats Section */}
      <div className="px-8 pb-8">
        <div className="flex items-center gap-10">
          {/* Concentric Rings - Apple Watch Style */}
          <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
            <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
              {/* Ring 1 (Outer) - Enrolled vs Capacity */}
              <circle
                cx="80"
                cy="80"
                r="72"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="6"
                opacity="0.15"
              />
              {enrolledAngle > 0 && (
                <path
                  d={createArc(80, 80, 72, 0, enrolledAngle)}
                  fill="none"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="6"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              )}

              {/* Ring 2 (Middle) - Paid vs Capacity */}
              <circle
                cx="80"
                cy="80"
                r="56"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="6"
                opacity="0.12"
              />
              {paid > 0 && (
                <path
                  d={createArc(80, 80, 56, 0, (paid / capacity) * 360)}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              )}

              {/* Ring 3 (Inner) - Signed vs Capacity */}
              <circle
                cx="80"
                cy="80"
                r="40"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="6"
                opacity="0.15"
              />
              {signed > 0 && (
                <path
                  d={createArc(80, 80, 40, 0, (signed / capacity) * 360)}
                  fill="none"
                  stroke="hsl(var(--secondary))"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              )}
            </svg>
            
            {/* Center text - with white background circle for better contrast */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-card shadow-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground tracking-tight leading-none">
                    {Math.round(percentage)}%
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-none">ocupado</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-3">
            {/* Outer Ring: Enrolled/Reserved */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/50"></div>
                <span className="text-sm text-muted-foreground">Total Reservado</span>
              </div>
              <div className="text-right">
                <span className="text-base font-semibold text-foreground">{enrolled}</span>
                <span className="text-sm text-muted-foreground ml-1">/ {capacity}</span>
              </div>
            </div>
            
            {/* Middle Ring: Paid/Confirmed */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-sm text-muted-foreground">Confirmados</span>
              </div>
              <div className="text-right">
                <span className="text-base font-semibold text-primary">{paid}</span>
                <span className="text-sm text-muted-foreground ml-1">/ {capacity}</span>
              </div>
            </div>
            
            {/* Inner Ring: Signed */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                <span className="text-sm font-semibold text-secondary-foreground">Assinados</span>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-secondary-foreground">{signed}</span>
                <span className="text-sm text-muted-foreground ml-1">/ {capacity}</span>
              </div>
            </div>
            
            {/* Available/Waitlist */}
            <div className="flex items-center justify-between py-2 mt-4 pt-4 border-t border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-muted"></div>
                <span className="text-sm text-muted-foreground">
                  {isOverbooked ? 'Lista de Espera' : 'Disponíveis'}
                </span>
              </div>
              <div className="text-right">
                {isOverbooked ? (
                  <span className="text-base font-semibold text-foreground">{waitlist}</span>
                ) : (
                  <>
                    <span className="text-base font-semibold text-foreground">{available > 0 ? available : 0}</span>
                    <span className="text-sm text-muted-foreground ml-1">/ {capacity}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="px-8 pb-8 pt-0">
        <Button
          onClick={onViewDetails}
          variant="ghost"
          className="w-full justify-between hover:bg-accent/50 transition-all duration-300 py-6 rounded-xl"
        >
          <span className="text-sm font-medium">Ver Detalhes</span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </Card>
  );
};
