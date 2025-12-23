import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus } from "lucide-react";
import { useProductsQuery } from "@/integrations/supabase/hooks/useProducts";

interface CohortCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingCohorts: string[];
  onCohortsCreated: (cohortMapping: Record<string, any>) => void;
  onSkip: () => void;
}

interface CohortFormData {
  name: string;
  courseId: string;
  year: number;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  status: "open" | "full" | "completed" | "cancelled";
}

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const COMMON_LOCATIONS = [
  "São Paulo - SP",
  "Rio de Janeiro - RJ",
  "Belo Horizonte - MG",
  "Salvador - BA",
  "Fortaleza - CE",
  "Brasília - DF",
  "Curitiba - PR",
  "Manaus - AM",
  "Recife - PE",
  "Porto Alegre - RS",
  "Belém - PA",
  "Goiânia - GO",
  "São Luís - MA",
  "Maceió - AL",
  "Campo Grande - MS",
  "Natal - RN",
  "Teresina - PI",
  "João Pessoa - PB",
  "Aracaju - SE",
  "Cuiabá - MT",
  "Porto Velho - RO",
  "Florianópolis - SC",
  "Macapá - AP",
  "Rio Branco - AC",
  "Vitória - ES",
  "Boa Vista - RR",
  "Palmas - TO",
  "Online",
  "Híbrido"
];

export const CohortCreationModal = ({
  open,
  onOpenChange,
  missingCohorts,
  onCohortsCreated,
  onSkip,
}: CohortCreationModalProps) => {
  const { data: products } = useProductsQuery();

  // Deduplicate products by name
  const uniqueProducts = products?.filter((product, index, self) =>
    index === self.findIndex((t) => (
      t.name === product.name
    ))
  ) || [];
  const [cohortForms, setCohortForms] = useState<Record<string, CohortFormData>>({});

  useEffect(() => {
    const forms: Record<string, CohortFormData> = {};
    missingCohorts.forEach(cohortName => {
      // Tentar extrair o ano do nome da turma
      const yearMatch = cohortName.match(/\d{4}/);
      const suggestedYear = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();

      // Tentar encontrar um produto correspondente no nome da turma
      let suggestedProductId = '';
      if (uniqueProducts.length === 1) {
        suggestedProductId = uniqueProducts[0].id;
      } else if (uniqueProducts.length > 0) {
        const lowerName = cohortName.toLowerCase();
        const foundProduct = uniqueProducts.find(p => 
          lowerName.includes(p.name.toLowerCase()) || 
          p.name.toLowerCase().includes(lowerName.replace(/\d{4}/, '').trim())
        );
        if (foundProduct) {
          suggestedProductId = foundProduct.id;
        }
      }

      // Tentar extrair o mês para sugerir data de início
      const monthMap: Record<string, number> = {
        'janeiro': 0, 'fevereiro': 1, 'março': 2, 'marco': 2, 'abril': 3, 'maio': 4, 'junho': 5,
        'julho': 6, 'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
      };
      
      let suggestedStartDate = '';
      const lowerName = cohortName.toLowerCase();
      for (const [monthName, monthIndex] of Object.entries(monthMap)) {
        if (lowerName.includes(monthName)) {
          const date = new Date(suggestedYear, monthIndex, 1);
          suggestedStartDate = date.toISOString().split('T')[0];
          break;
        }
      }

      forms[cohortName] = {
        name: cohortName,
        courseId: suggestedProductId,
        year: suggestedYear,
        startDate: suggestedStartDate,
        endDate: '',
        location: '',
        capacity: 22,
        status: 'open',
      };

      // Automação para Optical Experience na sugestão inicial
      const suggestedProduct = uniqueProducts.find(p => p.id === suggestedProductId);
      if (suggestedProduct?.name.toLowerCase().includes("optical experience") && suggestedStartDate) {
        const startDate = new Date(suggestedStartDate + 'T12:00:00');
        // Se a data sugerida não for terça-feira, ajustar para a próxima terça-feira
        const dayOfWeek = startDate.getDay();
        if (dayOfWeek !== 2) {
          const daysUntilTuesday = (2 - dayOfWeek + 7) % 7;
          startDate.setDate(startDate.getDate() + (daysUntilTuesday === 0 ? 7 : daysUntilTuesday));
          forms[cohortName].startDate = startDate.toISOString().split('T')[0];
        }
        
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 3);
        forms[cohortName].endDate = endDate.toISOString().split('T')[0];
      }
    });
    setCohortForms(forms);
  }, [missingCohorts]);

  const updateCohortForm = (cohortName: string, field: keyof CohortFormData, value: string | number) => {
    setCohortForms(prev => {
      const currentForm = prev[cohortName];
      const updatedForm = { ...currentForm, [field]: value };

      // Automação para Optical Experience
      const product = uniqueProducts.find(p => p.id === updatedForm.courseId);
      if (product?.name.toLowerCase().includes("optical experience")) {
        if ((field === 'startDate' || field === 'courseId') && updatedForm.startDate) {
          const startDate = new Date(updatedForm.startDate + 'T12:00:00');
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 3);
          updatedForm.endDate = endDate.toISOString().split('T')[0];
        }
      }

      return {
        ...prev,
        [cohortName]: updatedForm,
      };
    });
  };

  const validateForms = (): boolean => {
    return Object.values(cohortForms).every(
      form => form.courseId && form.startDate && form.location && form.capacity > 0
    );
  };

  const handleCreateCohorts = async () => {
    // Esta função será chamada quando o usuário confirmar a criação
    // Retornaremos os dados para o componente pai processar
    onCohortsCreated(cohortForms);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-primary text-2xl">
            Criar Turmas Ausentes
          </DialogTitle>
          <DialogDescription>
            As seguintes turmas não foram encontradas no sistema. Configure-as antes de continuar com a importação.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-primary/50 bg-primary/5 flex-shrink-0">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>{missingCohorts.length} turma(s) ausente(s).</strong> Preencha os dados de cada turma ou pule para importar apenas os alunos de turmas existentes.
          </AlertDescription>
        </Alert>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {missingCohorts.map((cohortName, index) => (
            <div key={cohortName} className="border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Plus className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  Turma {index + 1}: {cohortName}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`product-${index}`}>
                      Produto *
                    </Label>
                    <Select
                      value={cohortForms[cohortName]?.courseId || undefined}
                      onValueChange={(value) => updateCohortForm(cohortName, 'courseId', value)}
                    >
                      <SelectTrigger className="focus:ring-primary">
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>
                      <SelectContent className="bg-card z-50">
                        {uniqueProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`year-${index}`}>
                      Ano *
                    </Label>
                    <Input
                      id={`year-${index}`}
                      type="number"
                      value={cohortForms[cohortName]?.year || new Date().getFullYear()}
                      onChange={(e) => updateCohortForm(cohortName, 'year', parseInt(e.target.value))}
                      className="focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`startDate-${index}`}>
                      Data de Início *
                    </Label>
                    <Input
                      id={`startDate-${index}`}
                      type="date"
                      value={cohortForms[cohortName]?.startDate || ''}
                      onChange={(e) => updateCohortForm(cohortName, 'startDate', e.target.value)}
                      className="focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`endDate-${index}`}>
                      Data de Término
                    </Label>
                    <Input
                      id={`endDate-${index}`}
                      type="date"
                      value={cohortForms[cohortName]?.endDate || ''}
                      onChange={(e) => updateCohortForm(cohortName, 'endDate', e.target.value)}
                      className="focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`location-${index}`}>
                      Local *
                    </Label>
                    <div className="space-y-2">
                      <Select
                        value={COMMON_LOCATIONS.includes(cohortForms[cohortName]?.location) ? cohortForms[cohortName]?.location : (cohortForms[cohortName]?.location ? "other" : undefined)}
                        onValueChange={(value) => {
                          if (value === "other") {
                            updateCohortForm(cohortName, 'location', '');
                          } else {
                            updateCohortForm(cohortName, 'location', value);
                          }
                        }}
                      >
                        <SelectTrigger className="focus:ring-primary">
                          <SelectValue placeholder="Selecione o local" />
                        </SelectTrigger>
                        <SelectContent className="bg-card z-50">
                          {COMMON_LOCATIONS.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              {loc}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">Outro...</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {(!COMMON_LOCATIONS.includes(cohortForms[cohortName]?.location) || cohortForms[cohortName]?.location === '') && (
                        <Input
                          id={`location-custom-${index}`}
                          value={cohortForms[cohortName]?.location || ''}
                          onChange={(e) => updateCohortForm(cohortName, 'location', e.target.value)}
                          placeholder="Digite o local personalizado"
                          className="focus-visible:ring-primary animate-in fade-in slide-in-from-top-1"
                        />
                      )}
                    </div>
                  </div>

                <div className="space-y-2">
                  <Label htmlFor={`status-${index}`}>
                    Status
                  </Label>
                  <Select
                    value={cohortForms[cohortName]?.status || 'open'}
                    onValueChange={(value: any) => updateCohortForm(cohortName, 'status', value)}
                  >
                    <SelectTrigger className="focus:ring-primary">
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

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`capacity-${index}`}>
                    Capacidade
                  </Label>
                  <Input
                    id={`capacity-${index}`}
                    type="number"
                    value={cohortForms[cohortName]?.capacity || 22}
                    onChange={(e) => updateCohortForm(cohortName, 'capacity', parseInt(e.target.value))}
                    className="focus-visible:ring-primary"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4 border-t border-border flex-shrink-0">
          <Button
            variant="outline"
            onClick={onSkip}
            className="flex-1"
          >
            Pular (Ignorar turmas ausentes)
          </Button>
          <Button
            onClick={handleCreateCohorts}
            disabled={!validateForms()}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            Criar {missingCohorts.length} Turma(s) e Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
