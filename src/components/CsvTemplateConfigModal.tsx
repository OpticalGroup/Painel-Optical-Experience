import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileDown, Save, Trash2, FolderOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useTemplatePresets,
  useCreateTemplatePreset,
  useDeleteTemplatePreset,
} from "@/integrations/supabase/hooks/useTemplatePresets";

interface CsvTemplateConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  multiCohort?: boolean;
}

interface FieldConfig {
  key: string;
  label: string;
  csvLabel: string;
  required: boolean;
  category: string;
}

const FIELD_CONFIGS: FieldConfig[] = [
  // Categoria: Identificação
  { key: 'cohort_identifier', label: 'Nome da Turma', csvLabel: 'Nome da Turma / cohort_identifier', required: true, category: 'Identificação' },
  { key: 'student_name', label: 'Nome Completo', csvLabel: 'Nome Completo / student_name', required: true, category: 'Identificação' },
  { key: 'email', label: 'Email', csvLabel: 'Email / email', required: true, category: 'Identificação' },
  { key: 'cpf', label: 'CPF', csvLabel: 'CPF / cpf', required: true, category: 'Identificação' },
  { key: 'phone', label: 'Telefone', csvLabel: 'Telefone / phone', required: false, category: 'Identificação' },

  // Categoria: Vendas
  { key: 'sales_rep', label: 'Vendedor', csvLabel: 'Vendedor / sales_rep', required: true, category: 'Vendas' },
  { key: 'source', label: 'Origem', csvLabel: 'Origem / source', required: true, category: 'Vendas' },
  { key: 'lead_date', label: 'Data do Lead', csvLabel: 'Data Lead / lead_date', required: false, category: 'Vendas' },
  { key: 'purchase_date', label: 'Data da Compra', csvLabel: 'Data Compra / purchase_date', required: false, category: 'Vendas' },

  // Categoria: Pagamento
  { key: 'financial_status', label: 'Status Pagamento', csvLabel: 'Status Pagamento / financial_status', required: false, category: 'Pagamento' },
  { key: 'contract_status', label: 'Status Contrato', csvLabel: 'Status Contrato / contract_status', required: false, category: 'Pagamento' },
  { key: 'payment_details', label: 'Detalhes do Pagamento', csvLabel: 'Detalhes do Pagamento / payment_details', required: false, category: 'Pagamento' },
  { key: 'payment_amount', label: 'Valor', csvLabel: 'Valor / payment_amount', required: false, category: 'Pagamento' },
  { key: 'payment_proof_url', label: 'URL do Comprovante', csvLabel: 'URL Comprovante / payment_proof_url', required: false, category: 'Pagamento' },

  // Categoria: Endereço
  { key: 'address', label: 'Endereço', csvLabel: 'Endereço / address', required: false, category: 'Endereço' },
  { key: 'city', label: 'Cidade', csvLabel: 'Cidade / city', required: false, category: 'Endereço' },
  { key: 'state', label: 'Estado', csvLabel: 'Estado / state', required: false, category: 'Endereço' },
  { key: 'zipcode', label: 'CEP', csvLabel: 'CEP / zipcode', required: false, category: 'Endereço' },

  // Categoria: Produto
  { key: 'product_name', label: 'Nome do Produto', csvLabel: 'Produto / product_name', required: false, category: 'Produto' },
  { key: 'observations', label: 'Observações', csvLabel: 'Observações / observations', required: false, category: 'Produto' },

  // Categoria: Marketing
  { key: 'utm_source', label: 'UTM Source', csvLabel: 'UTM Source / utm_source', required: false, category: 'Marketing' },
  { key: 'utm_medium', label: 'UTM Medium', csvLabel: 'UTM Medium / utm_medium', required: false, category: 'Marketing' },
  { key: 'utm_campaign', label: 'UTM Campaign', csvLabel: 'UTM Campaign / utm_campaign', required: false, category: 'Marketing' },
  { key: 'utm_term', label: 'UTM Term', csvLabel: 'UTM Term / utm_term', required: false, category: 'Marketing' },
  { key: 'utm_content', label: 'UTM Content', csvLabel: 'UTM Content / utm_content', required: false, category: 'Marketing' },
];

export const CsvTemplateConfigModal = ({ open, onOpenChange, multiCohort = false }: CsvTemplateConfigModalProps) => {
  // Filtrar campos baseado no modo
  const availableFields = multiCohort
    ? FIELD_CONFIGS
    : FIELD_CONFIGS.filter(field => field.key !== 'cohort_identifier');

  // Inicializar com campos obrigatórios selecionados
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(availableFields.filter(field => field.required).map(field => field.key))
  );

  // Estado para salvar template
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  // Hooks para gerenciar templates
  const { data: savedTemplates } = useTemplatePresets(multiCohort);
  const createTemplate = useCreateTemplatePreset();
  const deleteTemplate = useDeleteTemplatePreset();

  const handleToggleField = (fieldKey: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldKey)) {
      newSelected.delete(fieldKey);
    } else {
      newSelected.add(fieldKey);
    }
    setSelectedFields(newSelected);
  };

  const handleSelectBasic = () => {
    const basicFields = availableFields.filter(field => field.required);
    setSelectedFields(new Set(basicFields.map(field => field.key)));
  };

  const handleSelectComplete = () => {
    setSelectedFields(new Set(availableFields.map(field => field.key)));
  };

  const handleSelectCategory = (category: string, select: boolean) => {
    const newSelected = new Set(selectedFields);
    availableFields
      .filter(field => field.category === category)
      .forEach(field => {
        if (select) {
          newSelected.add(field.key);
        } else if (!field.required) {
          newSelected.delete(field.key);
        }
      });
    setSelectedFields(newSelected);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;

    await createTemplate.mutateAsync({
      name: templateName.trim(),
      description: templateDescription.trim() || undefined,
      selected_fields: Array.from(selectedFields),
      multi_cohort: multiCohort,
    });

    setShowSaveDialog(false);
    setTemplateName('');
    setTemplateDescription('');
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = savedTemplates?.find(t => t.id === templateId);
    if (!template) return;

    setSelectedFields(new Set(template.selected_fields));
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    await deleteTemplate.mutateAsync(templateToDelete);
    setShowDeleteDialog(false);
    setTemplateToDelete(null);
  };

  const generateTemplate = () => {
    // Gerar CSV com campos selecionados
    const selectedConfigs = availableFields.filter(field => selectedFields.has(field.key));

    // Header com labels bilíngues
    const headers = selectedConfigs.map(field => field.csvLabel).join(',');

    // Linhas de exemplo
    const exampleRow1 = selectedConfigs.map(field => {
      const examples: Record<string, string> = {
        cohort_identifier: 'Turma Janeiro 2025',
        student_name: 'João Silva',
        email: 'joao@email.com',
        cpf: '123.456.789-00',
        phone: '11999999999',
        sales_rep: 'Ana Paula',
        source: 'Instagram Bio',
        financial_status: 'paid',
        contract_status: 'signed',
        payment_details: 'À vista - Pix realizado 10/11/2024',
        payment_amount: 'R$ 7.500,00',
        purchase_date: '06/11/2024',
        lead_date: '01/11/2024',
        address: 'Rua Exemplo, 123, Bairro',
        city: 'Salvador',
        state: 'BA',
        zipcode: '41820700',
        product_name: 'Optical Experience',
        payment_proof_url: 'https://exemplo.com/comprovante.pdf',
        observations: 'Cliente indicado pelo Daniel',
        utm_source: 'instagram',
        utm_medium: 'social',
        utm_campaign: 'black_friday',
        utm_term: '',
        utm_content: '',
      };
      return examples[field.key] || '';
    }).join(',');

    const exampleRow2 = selectedConfigs.map(field => {
      const examples: Record<string, string> = {
        cohort_identifier: 'Turma Março 2025',
        student_name: 'Maria Santos',
        email: 'maria@email.com',
        cpf: '987.654.321-00',
        phone: '11988888888',
        sales_rep: 'João Costa',
        source: 'Programa de Indicação',
        financial_status: 'pending',
        contract_status: 'pending',
        payment_details: 'Entrada R$1000 + 10x R$350 no cartão',
        payment_amount: 'R$ 4.500,00',
        purchase_date: '07/11/2024',
        lead_date: '15/10/2024',
        address: 'Av Principal, 456',
        city: 'Aracaju',
        state: 'SE',
        zipcode: '49000000',
        product_name: 'Optical Experience',
        payment_proof_url: '',
        observations: '',
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        utm_term: '',
        utm_content: '',
      };
      return examples[field.key] || '';
    }).join(',');

    const csvContent = `${headers}\n${exampleRow1}\n${exampleRow2}`;

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `template_personalizado_${selectedFields.size}_campos.csv`;
    link.click();

    onOpenChange(false);
  };

  // Agrupar por categoria
  const categories = Array.from(new Set(availableFields.map(field => field.category)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-primary text-2xl flex items-center gap-2">
            <FileDown className="h-6 w-6" />
            Personalizar Template CSV
          </DialogTitle>
          <DialogDescription>
            Selecione os campos que deseja incluir no template de importação
          </DialogDescription>
        </DialogHeader>

        {/* Templates salvos */}
        {savedTemplates && savedTemplates.length > 0 && (
          <Alert className="border-primary/30 bg-primary/5">
            <FolderOpen className="h-4 w-4 text-primary" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Templates Salvos</span>
              </div>
              <ScrollArea className="h-20 mt-2">
                <div className="space-y-1">
                  {savedTemplates.map(template => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted/30 group"
                    >
                      <button
                        onClick={() => handleLoadTemplate(template.id)}
                        className="flex-1 text-left"
                      >
                        <p className="text-sm font-medium text-foreground">{template.name}</p>
                        {template.description && (
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {template.selected_fields.length} campos
                        </p>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTemplateToDelete(template.id);
                          setShowDeleteDialog(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AlertDescription>
          </Alert>
        )}

        {/* Botões rápidos */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectBasic}
            className="flex-1"
          >
            Básico ({availableFields.filter(f => f.required).length} campos)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectComplete}
            className="flex-1"
          >
            Completo ({availableFields.length} campos)
          </Button>
        </div>

        {/* Lista de campos por categoria */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {categories.map(category => {
              const categoryFields = availableFields.filter(field => field.category === category);
              const selectedInCategory = categoryFields.filter(field => selectedFields.has(field.key)).length;
              const allSelected = selectedInCategory === categoryFields.length;
              const someSelected = selectedInCategory > 0 && selectedInCategory < categoryFields.length;

              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      {category}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectCategory(category, !allSelected)}
                      className="h-7 text-xs"
                    >
                      {allSelected ? 'Desmarcar' : 'Marcar todos'}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {categoryFields.map(field => (
                      <div key={field.key} className="flex items-center space-x-3 p-2 rounded hover:bg-muted/30">
                        <Checkbox
                          id={field.key}
                          checked={selectedFields.has(field.key)}
                          onCheckedChange={() => handleToggleField(field.key)}
                          disabled={field.required}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label
                          htmlFor={field.key}
                          className={`text-sm flex-1 cursor-pointer ${field.required ? 'font-medium' : ''
                            }`}
                        >
                          {field.label}
                          {field.required && (
                            <span className="ml-1 text-xs text-muted-foreground">(obrigatório)</span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <Separator />
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {selectedFields.size} campo{selectedFields.size !== 1 ? 's' : ''} selecionado{selectedFields.size !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(true)}
              disabled={selectedFields.size === 0}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Salvar Template
            </Button>
            <Button
              onClick={generateTemplate}
              disabled={selectedFields.size === 0}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar Template
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Dialog para salvar template */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvar Template Personalizado</AlertDialogTitle>
            <AlertDialogDescription>
              Dê um nome ao seu template para reutilizá-lo no futuro
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nome do Template *</Label>
              <Input
                id="template-name"
                placeholder="Ex: Importação Básica, Importação Completa..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">Descrição (opcional)</Label>
              <Textarea
                id="template-description"
                placeholder="Descreva quando usar este template..."
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveTemplate}
              disabled={!templateName.trim() || createTemplate.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createTemplate.isPending ? 'Salvando...' : 'Salvar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para confirmar exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este template? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              disabled={deleteTemplate.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteTemplate.isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
