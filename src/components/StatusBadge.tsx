import { Badge } from "@/components/ui/badge";

type StatusType = "paid" | "signed" | "pending";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig = {
  paid: {
    label: "Pago",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  signed: {
    label: "Contrato Assinado",
    className: "bg-secondary/30 text-[hsl(23,23%,40%)] border-secondary",
  },
  pending: {
    label: "Pendente",
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
  },
};

export const StatusBadge = ({ status, className = "" }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${className} font-medium`}
    >
      {config.label}
    </Badge>
  );
};
