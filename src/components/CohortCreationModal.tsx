import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus } from "lucide-react";
import { useCoursesQuery } from "@/integrations/supabase/hooks/useCourses";

interface CohortCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingCohorts: string[];
  onCohortsCreated: (cohortMapping: Record<string, string>) => void;
  onSkip: () => void;
}

interface CohortFormData {
  name: string;
  courseId: string;
  year: number;
  startDate: string;
  location: string;
  capacity: number;
}

export const CohortCreationModal = ({
  open,
  onOpenChange,
  missingCohorts,
  onCohortsCreated,
  onSkip,
}: CohortCreationModalProps) => {
  const { data: courses } = useCoursesQuery();
  const [cohortForms, setCohortForms] = useState<Record<string, CohortFormData>>(() => {
    const forms: Record<string, CohortFormData> = {};
    missingCohorts.forEach(cohortName => {
      forms[cohortName] = {
        name: cohortName,
        courseId: '', // Será validado antes do submit
        year: new Date().getFullYear(),
        startDate: '',
        location: '',
        capacity: 22,
      };
    });
    return forms;
  });

  const updateCohortForm = (cohortName: string, field: keyof CohortFormData, value: string | number) => {
    setCohortForms(prev => ({
      ...prev,
      [cohortName]: {
        ...prev[cohortName],
        [field]: value,
      },
    }));
  };

  const validateForms = (): boolean => {
    return Object.values(cohortForms).every(
      form => form.courseId && form.startDate && form.location && form.capacity > 0
    );
  };

  const handleCreateCohorts = async () => {
    // Esta função será chamada quando o usuário confirmar a criação
    // Retornaremos os dados para o componente pai processar
    onCohortsCreated(cohortForms as any);
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
                  <Label htmlFor={`course-${index}`}>
                    Curso *
                  </Label>
                  <Select
                    value={cohortForms[cohortName]?.courseId || undefined}
                    onValueChange={(value) => updateCohortForm(cohortName, 'courseId', value)}
                  >
                    <SelectTrigger className="focus:ring-primary">
                      <SelectValue placeholder="Selecione o curso" />
                    </SelectTrigger>
                    <SelectContent className="bg-card z-50">
                      {courses?.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
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
                    value={cohortForms[cohortName]?.year}
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
                    value={cohortForms[cohortName]?.startDate}
                    onChange={(e) => updateCohortForm(cohortName, 'startDate', e.target.value)}
                    className="focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`location-${index}`}>
                    Local *
                  </Label>
                  <Input
                    id={`location-${index}`}
                    value={cohortForms[cohortName]?.location}
                    onChange={(e) => updateCohortForm(cohortName, 'location', e.target.value)}
                    placeholder="Ex: São Paulo - SP"
                    className="focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`capacity-${index}`}>
                    Capacidade
                  </Label>
                  <Input
                    id={`capacity-${index}`}
                    type="number"
                    value={cohortForms[cohortName]?.capacity}
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
