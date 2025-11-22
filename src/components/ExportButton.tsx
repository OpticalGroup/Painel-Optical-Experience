import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useExportReport } from "@/hooks/useExportReport";

type ReportType = 'dashboard' | 'cohorts' | 'cohort-detail' | 'sales-reps' | 'sources' | 'conversion';

interface ExportButtonProps {
  type: ReportType;
  cohortId?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
  showDropdown?: boolean;
}

export const ExportButton = ({
  type,
  cohortId,
  variant = "outline",
  size = "default",
  label = "Exportar",
  showDropdown = false,
}: ExportButtonProps) => {
  const { exportReport, isExporting } = useExportReport();

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    await exportReport({ type, cohortId, format });
  };

  if (showDropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="ml-2">{label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport('csv')}>
            <Download className="mr-2 h-4 w-4" />
            Exportar como CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('json')}>
            <Download className="mr-2 h-4 w-4" />
            Exportar como JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => handleExport('csv')}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span className="ml-2">{label}</span>
    </Button>
  );
};
