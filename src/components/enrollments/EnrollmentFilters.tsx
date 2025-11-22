import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SortOption } from "./types";

interface EnrollmentFiltersProps {
    sortBy: SortOption;
    onSortChange: (value: SortOption) => void;
}

export const EnrollmentFilters = ({ sortBy, onSortChange }: EnrollmentFiltersProps) => {
    return (
        <div className="flex items-center gap-3">
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
