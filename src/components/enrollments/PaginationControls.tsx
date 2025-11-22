import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading: boolean;
}

export const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
    isLoading
}: PaginationControlsProps) => {
    return (
        <div className="flex items-center justify-end gap-2 py-4">
            <div className="text-sm text-muted-foreground mr-4">
                Página {currentPage} de {totalPages}
            </div>
            <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
};
