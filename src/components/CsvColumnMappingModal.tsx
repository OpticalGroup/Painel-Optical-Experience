import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, HelpCircle, X, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface CsvColumnMappingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  csvHeaders: string[];
  csvPreviewData: string[][];
  onConfirmMapping: (mapping: Record<string, string | undefined>) => void;
  onBack: () => void;
  multiCohort?: boolean; // Novo prop para indicar se é multi-turma
}

interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
  description: string;
}

const SYSTEM_FIELDS: FieldDefinition[] = [
  // Campos obrigatórios - Dados básicos do lead
    { key: 'cohort_identifier', label: 'Nome da Turma', required: true, description: 'Nome da turma para vincular o aluno (ex: "Turma Janeiro 2025" ou apenas "Janeiro")' },
    { key: 'cohort_year', label: 'Ano da Turma', required: false, description: 'Ano da turma (opcional, será combinado com o nome se fornecido)' },
    { key: 'student_name', label: 'Nome Completo', required: true, description: 'Nome completo do aluno' },
  { key: 'email', label: 'Email', required: true, description: 'Email válido (único por turma)' },
  { key: 'cpf', label: 'CPF', required: true, description: 'CPF no formato XXX.XXX.XXX-XX ou 11 dígitos (será normalizado)' },
  { key: 'sales_rep', label: 'Vendedor', required: true, description: 'Nome do vendedor responsável' },

  // Hierarquia de Origem (campos opcionais que substituem 'source')
  { key: 'funnel_name', label: 'Funil de Venda', required: false, description: 'Nome do funil de vendas (nível 1 da hierarquia)' },
  { key: 'macro_origin', label: 'Origem Macro', required: false, description: 'Origem macro - agrupamento principal (nível 2)' },
  { key: 'micro_origin', label: 'Origem Micro', required: false, description: 'Origem micro - detalhamento (nível 3)' },
  { key: 'micro_variation', label: 'Variação de Origem', required: false, description: 'Variação micro - variantes de teste (nível 4)' },
  { key: 'origin_action_date', label: 'Data da Ação da Origem', required: false, description: 'Data em que a ação de origem ocorreu (captura do lead)' },
  { key: 'source', label: 'Origem (Legado)', required: false, description: 'Campo legado para origens simples (use os campos de hierarquia acima)' },

  // Campos opcionais - Dados de contato e vendas
  { key: 'phone', label: 'Telefone', required: false, description: 'Telefone com DDD (será normalizado automaticamente)' },
  { key: 'co_sales_rep', label: 'Co-Responsável', required: false, description: 'Segundo vendedor responsável pela venda' },

  // Campos opcionais - Dados financeiros e contratuais
  { key: 'financial_status', label: 'Status Pagamento', required: false, description: 'paid, pending, "Sim" ou "Não" (padrão: pending)' },
  { key: 'contract_status', label: 'Status Contrato', required: false, description: 'signed, pending ou texto contendo "assinado" (padrão: pending)' },
  { key: 'payment_details', label: 'Forma de Pagamento', required: false, description: 'Condições de pagamento (texto livre, pode ser verbose)' },
  { key: 'payment_amount', label: 'Valor Total (Ticket)', required: false, description: 'Valor monetário (ex: 7500, "R$ 7.500,00")' },
  { key: 'purchase_date', label: 'Data da Compra', required: false, description: 'Data da compra/venda (DD/MM/AAAA ou AAAA-MM-DD)' },
  { key: 'lead_date', label: 'Data do Lead', required: false, description: 'Data de chegada do lead no funil (DD/MM/AAAA)' },
  { key: 'payment_proof_url', label: 'URL do Comprovante', required: false, description: 'Link/URL do comprovante de pagamento' },

  // Campos opcionais - Endereço
  { key: 'address', label: 'Endereço', required: false, description: 'Endereço completo (rua, número, complemento, bairro)' },
  { key: 'city', label: 'Cidade', required: false, description: 'Nome da cidade (ex: Salvador, Aracaju)' },
  { key: 'state', label: 'Estado', required: false, description: 'Sigla do estado/UF (ex: BA, SE, SP)' },
  { key: 'zipcode', label: 'CEP', required: false, description: 'CEP no formato XXXXX-XXX ou 8 dígitos (será normalizado)' },
  { key: 'country', label: 'País', required: false, description: 'País de origem do lead (padrão: Brasil)' },

  // Campos opcionais - Produto e observações
  { key: 'product_name', label: 'Nome do Produto', required: false, description: 'Nome do produto adquirido (padrão: "Optical Experience")' },
  { key: 'observations', label: 'Observações', required: false, description: 'Observações gerais, notas, comentários sobre a matrícula' },

  // Campos opcionais - Parâmetros UTM
  { key: 'utm_source', label: 'UTM Source', required: false, description: 'Origem do tráfego (ex: instagram, google, facebook)' },
  { key: 'utm_medium', label: 'UTM Medium', required: false, description: 'Meio de marketing (ex: social, cpc, email)' },
  { key: 'utm_campaign', label: 'UTM Campaign', required: false, description: 'Nome da campanha (ex: black_friday, lancamento)' },
  { key: 'utm_term', label: 'UTM Term', required: false, description: 'Termo de pesquisa usado em anúncios' },
  { key: 'utm_content', label: 'UTM Content', required: false, description: 'Variação/versão do anúncio ou conteúdo' },
  { key: 'utm_page', label: 'UTM Página', required: false, description: 'URL da página de captura do lead' },

  // Campos opcionais - Integração e datas
  { key: 'external_lead_id', label: 'ID Externo (CRM)', required: false, description: 'ID do lead em sistema externo (Kommo, HubSpot, etc)' },
  { key: 'submitted_at', label: 'Data de Inscrição no Forms', required: false, description: 'Data de submissão do formulário de inscrição' },
];

export const CsvColumnMappingModal = ({
  open,
  onOpenChange,
  csvHeaders,
  csvPreviewData,
  onConfirmMapping,
  onBack,
  multiCohort = false,
}: CsvColumnMappingModalProps) => {
  // Filtrar campos baseado no modo de importação
  const systemFields = multiCohort
    ? SYSTEM_FIELDS
    : SYSTEM_FIELDS.filter(field => field.key !== 'cohort_identifier');

  // Estado para mapeamento de colunas
  const [columnMapping, setColumnMapping] = useState<Record<string, string | undefined>>({});

  // Mapa de sinônimos para melhor detecção
  const FIELD_SYNONYMS: Record<string, string[]> = {
    // Identificadores
    'cohort_identifier': ['turma', 'cohort', 'classe', 'grupo', 'turma inscrita', 'inscrita'],
    'cohort_year': ['ano', 'year', 'ano da turma', 'safra'],

    // Dados pessoais
    'student_name': ['nome', 'aluno', 'estudante', 'student', 'name', 'nomecompleto', 'nome completo'],
    'email': ['email', 'e-mail', 'mail', 'correio', 'email lead', 'email comprador'],
    'cpf': ['cpf', 'documento', 'doc'],
    'phone': ['telefone', 'fone', 'celular', 'tel', 'phone', 'contato', 'telefone formatado'],

    // Vendas
    'sales_rep': ['vendedor', 'representante', 'comercial', 'sales', 'rep'],
    'co_sales_rep': ['co-responsável', 'co responsavel', 'coresponsavel', 'segundo vendedor'],

    // Hierarquia de Origens
    'source': ['origem', 'fonte', 'source', 'canal'],
    'funnel_name': ['funil', 'funnel', 'vendas', 'funil de venda'],
    'macro_origin': ['macro', 'origem macro', 'origemmacro'],
    'micro_origin': ['micro', 'origem micro', 'origemmicro'],
    'micro_variation': ['variacao', 'variacoes', 'variation', 'variações', 'variaçõesdeorigemmicro', 'variações de origem micro'],
    'origin_action_date': ['data da ação', 'acao da origem', 'data da acao da origem'],

    // Financeiro
    'financial_status': ['pagamento', 'financeiro', 'pago', 'payment', 'financial', 'status do pagamento', 'status pagamento'],
    'contract_status': ['contrato', 'contract', 'assinado', 'signed'],
    'payment_details': ['detalhes', 'condicao', 'forma de pagamento', 'details', 'payment'],
    'payment_amount': ['valor', 'preco', 'amount', 'price', 'ticket', 'valor total', 'valor total da venda'],
    'payment_proof_url': ['comprovante', 'proof', 'url', 'link', 'anexe', 'anexo', 'anexe o comprovante'],

    // Datas
    'purchase_date': ['compra', 'venda', 'purchase', 'data compra', 'datacompra', 'data da compra'],
    'lead_date': ['lead', 'chegada', 'entrada', 'data de chegada', 'chegada do lead', 'data de chegada do lead no funil'],
    'submitted_at': ['forms', 'inscrição', 'inscricao', 'formulário', 'data de inscrição', 'data de inscrição no forms'],

    // Endereço
    'address': ['endereco', 'rua', 'address', 'logradouro'],
    'city': ['cidade', 'city', 'municipio'],
    'state': ['estado', 'uf', 'state'],
    'zipcode': ['cep', 'zip', 'codigo', 'postal'],
    'country': ['pais', 'country', 'nacionalidade'],

    // Produto
    'product_name': ['produto', 'product', 'item'],
    'observations': ['observacoes', 'obs', 'notas', 'observations', 'notes', 'observações'],

    // UTMs
    'utm_source': ['utm_source', 'utmsource', 'source'],
    'utm_medium': ['utm_medium', 'utmmedium', 'medium', 'meio'],
    'utm_campaign': ['utm_campaign', 'utmcampaign', 'campaign', 'campanha'],
    'utm_content': ['utm_content', 'utmcontent', 'content'],
    'utm_term': ['utm_term', 'utmterm', 'term'],
    'utm_page': ['utm_página', 'utmpagina', 'página', 'pagina', 'page', 'utmpágina'],

    // Integração
    'external_lead_id': ['id lead', 'id kommo', 'id lead kommo', 'lead id', 'crm id'],
  };

  // Função de similaridade melhorada
  const calculateSimilarity = (header: string, fieldKey: string): number => {
    const normalizedHeader = header.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9]/g, '');

    const synonyms = FIELD_SYNONYMS[fieldKey] || [];

    // Pontuação base
    let score = 0;

    // Match exato com a chave do campo
    const normalizedFieldKey = fieldKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedHeader === normalizedFieldKey) return 100;
    if (normalizedHeader.includes(normalizedFieldKey)) score += 50;
    if (normalizedFieldKey.includes(normalizedHeader)) score += 40;

    // Match com sinônimos
    for (const synonym of synonyms) {
      const normalizedSynonym = synonym.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalizedHeader === normalizedSynonym) return 90;
      if (normalizedHeader.includes(normalizedSynonym)) score += 30;
      if (normalizedSynonym.includes(normalizedHeader) && normalizedHeader.length > 3) score += 20;
    }

    return score;
  };

  // Auto-detectar mapeamentos com algoritmo melhorado
  const autoDetectMappings = () => {
    const newMapping: Record<string, string | undefined> = {};

    systemFields.forEach(field => {
      let bestMatch: { header: string; score: number } | null = null;

      csvHeaders.forEach(header => {
        const score = calculateSimilarity(header, field.key);
        if (score > 0 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { header, score };
        }
      });

      // Só mapear se tiver uma pontuação razoável (>= 20)
      if (bestMatch && bestMatch.score >= 20) {
        newMapping[field.key] = bestMatch.header;
      }
    });

    setColumnMapping(newMapping);
  };

  // Auto-detectar ao abrir o modal
  useEffect(() => {
    if (open && csvHeaders.length > 0) {
      autoDetectMappings();
    }
  }, [open, csvHeaders]);

  // Validar se todos os campos obrigatórios estão mapeados
  const validateMapping = (): { valid: boolean; missingFields: string[] } => {
    const missingFields: string[] = [];

    systemFields.forEach(field => {
      if (field.required && !columnMapping[field.key]) {
        missingFields.push(field.label);
      }
    });

    return {
      valid: missingFields.length === 0,
      missingFields,
    };
  };

  const handleConfirm = () => {
    const validation = validateMapping();

    if (!validation.valid) {
      return; // Botão estará desabilitado, mas validação extra
    }

    onConfirmMapping(columnMapping);
  };

  const handleMappingChange = (fieldKey: string, csvColumn: string | undefined) => {
    setColumnMapping(prev => ({
      ...prev,
      [fieldKey]: csvColumn,
    }));
  };

  const clearMapping = (fieldKey: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [fieldKey]: undefined,
    }));
  };

  const validation = validateMapping();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-primary text-2xl">
            Mapear Colunas do CSV
          </DialogTitle>
          <DialogDescription>
            Configure como as colunas do seu CSV devem ser importadas para o sistema
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Alert de ajuda */}
          <Alert className="border-primary/50 bg-primary/5">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <div className="flex items-center justify-between">
                <span>
                  <strong>Detecção Automática Ativada!</strong> Os campos foram pré-mapeados automaticamente.
                  Revise e ajuste conforme necessário.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={autoDetectMappings}
                  className="ml-2 h-7 text-xs"
                >
                  Re-detectar
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Campos marcados com <span className="text-destructive font-semibold">*</span> são obrigatórios.
              </p>
            </AlertDescription>
          </Alert>

          {/* Alert de validação */}
          {!validation.valid && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">
                <strong>Campos obrigatórios não mapeados:</strong> {validation.missingFields.join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Grid de mapeamento */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
            {/* Coluna 1: Preview dos dados CSV */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Exemplo de Dados CSV
              </h3>
              <div className="border border-border rounded-lg p-3 bg-muted/30 space-y-2 max-h-[500px] overflow-y-auto">
                {csvHeaders.map((header, index) => (
                  <div key={index} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {header}
                    </p>
                    <p className="text-sm text-foreground font-mono bg-background px-2 py-1 rounded border border-border">
                      {csvPreviewData[0]?.[index] || '-'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Seta separadora */}
            <div className="flex items-center justify-center pt-12">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* Coluna 2: Campos do Sistema */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Campos do Sistema
              </h3>
              <TooltipProvider>
                <div className="space-y-3">
                  {systemFields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-foreground">
                            {field.label}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                            {!field.required && (
                              <Badge variant="outline" className="ml-2 text-xs font-normal">
                                Opcional
                              </Badge>
                            )}
                          </label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">{field.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {columnMapping[field.key] && !field.required && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => clearMapping(field.key)}
                            className="h-6 w-6 p-0 hover:bg-destructive/10"
                          >
                            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="relative">
                        <Select
                          value={columnMapping[field.key] || "_none_"}
                          onValueChange={(value) => handleMappingChange(field.key, value === "_none_" ? undefined : value)}
                        >
                          <SelectTrigger
                            className={`w-full transition-colors ${field.required && !columnMapping[field.key]
                              ? 'border-destructive focus:ring-destructive'
                              : columnMapping[field.key]
                                ? 'border-primary/50 bg-primary/5'
                                : 'focus:ring-primary'
                              }`}
                          >
                            <SelectValue placeholder="Não mapeado" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-[100]">
                            <SelectItem value="_none_" className="text-muted-foreground italic">
                              Não mapeado
                            </SelectItem>
                            {csvHeaders.map((header) => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {columnMapping[field.key] && (
                          <Badge
                            variant="secondary"
                            className="absolute -top-2 -right-2 text-xs bg-primary text-primary-foreground"
                          >
                            ✓
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-4 border-t border-border flex-shrink-0">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            Voltar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!validation.valid}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            Próximo: Revisar Dados
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
