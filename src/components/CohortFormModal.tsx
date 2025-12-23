import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useProductsQuery } from "@/integrations/supabase/hooks/useProducts";
import { useCreateCohort, useUpdateCohort } from "@/integrations/supabase/hooks/useCohorts";
import type { Tables } from "@/integrations/supabase/types";

type Cohort = Tables<'cohorts'>;

interface CohortFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohort?: Cohort | null;
}

export const CohortFormModal = ({ open, onOpenChange, cohort }: CohortFormModalProps) => {
  const [name, setName] = useState(cohort?.name || "");
  const [productId, setProductId] = useState<string | undefined>(cohort?.course_id);
  const [year, setYear] = useState(cohort?.year?.toString() || new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState<Date | undefined>(
    cohort?.start_date ? new Date(cohort.start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    cohort?.end_date ? new Date(cohort.end_date) : undefined
  );
  const [location, setLocation] = useState(cohort?.location || "");
  const [capacity, setCapacity] = useState(cohort?.capacity?.toString() || "30");
  const [status, setStatus] = useState<"open" | "full" | "completed" | "cancelled">(
    cohort?.status || "open"
  );

  const { data: products, isLoading: productsLoading } = useProductsQuery();

  // Deduplicate products by name (just in case)
  const uniqueProducts = products?.filter((product, index, self) =>
    index === self.findIndex((t) => (
      t.name === product.name
    ))
  );
  const createCohort = useCreateCohort();
  const updateCohort = useUpdateCohort();

  // Update form when cohort changes
  useEffect(() => {
    if (cohort) {
      setName(cohort.name);
      setProductId(cohort.course_id);
      setYear(cohort.year.toString());
      setStartDate(new Date(cohort.start_date));
      setEndDate(cohort.end_date ? new Date(cohort.end_date) : undefined);
      setLocation(cohort.location);
      setCapacity(cohort.capacity.toString());
      setStatus(cohort.status);
    } else {
      resetForm();
    }
  }, [cohort, open]);

  const resetForm = () => {
    setName("");
    setProductId(undefined);
    setYear(new Date().getFullYear().toString());
    setStartDate(undefined);
    setEndDate(undefined);
    setLocation("");
    setCapacity("30");
    setStatus("open");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productId || !startDate || !name || !location) {
      return;
    }

    const cohortData = {
      name,
      course_id: productId,
      year: parseInt(year),
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
      location,
      capacity: parseInt(capacity),
      status,
    };

    if (cohort) {
      await updateCohort.mutateAsync({ id: cohort.id, ...cohortData });
    } else {
      await createCohort.mutateAsync(cohortData);
    }

    onOpenChange(false);
    resetForm();
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary text-xl">
            {cohort ? "Editar Turma" : "Nova Turma"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Turma *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Optical Experience Setembro 2025"
              required
              className="focus:border-[#D6CDC8]"
            />
          </div>

          {/* Product */}
          <div className="space-y-2">
            <Label htmlFor="product">Produto *</Label>
            <Select value={productId || undefined} onValueChange={setProductId} required>
              <SelectTrigger className="focus:border-[#D6CDC8]">
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent className="bg-card z-50">
                {productsLoading ? (
                  <SelectItem value="__loading__" disabled>Carregando...</SelectItem>
                ) : (
                  uniqueProducts?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Year and Capacity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Ano *</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min={2020}
                max={2050}
                required
                className="focus:border-[#D6CDC8]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidade *</Label>
              <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                min={1}
                max={100}
                required
                className="focus:border-[#D6CDC8]"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal focus:border-[#D6CDC8]",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Término</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal focus:border-[#D6CDC8]",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Localização *</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: São Paulo, BR"
              required
              className="focus:border-[#D6CDC8]"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger className="focus:border-[#D6CDC8]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card z-50">
                <SelectItem value="open">Aberta</SelectItem>
                <SelectItem value="full">Lotada</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
              disabled={createCohort.isPending || updateCohort.isPending}
            >
              {cohort ? "Atualizar Turma" : "Criar Turma"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
