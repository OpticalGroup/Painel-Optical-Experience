import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SortOption } from "./types";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface EnrollmentFiltersProps {
    sortBy: SortOption;
    onSortChange: (value: SortOption) => void;
    showCancelled: boolean;
    onShowCancelledChange: (value: boolean) => void;
}

export const EnrollmentFilters = ({
    sortBy,
    onSortChange,
    showCancelled,
    onShowCancelledChange
}: EnrollmentFiltersProps) => {
    return (
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <Switch
                    id="show-cancelled"
                    checked={showCancelled}
                    onCheckedChange={onShowCancelledChange}
                />
                <Label htmlFor="show-cancelled" className="text-sm text-muted-foreground cursor-pointer">
                    Mostrar Cancelados
                </Label>
            </div>

            <div className="h-6 w-px bg-border" />

            <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Ordenar por..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="date-desc">Mais Recentes</SelectItem>
                    <SelectItem value="date-asc">Mais Antigas</SelectItem>
                    <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                    <SelectItem value="cohort">Por Turma</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
};
