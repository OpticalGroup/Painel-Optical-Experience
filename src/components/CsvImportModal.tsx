import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, AlertCircle, CheckCircle2, FileText, Trash2, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CsvColumnMappingModal } from "./CsvColumnMappingModal";
import { CohortCreationModal } from "./CohortCreationModal";
import { CsvTemplateConfigModal } from "./CsvTemplateConfigModal";
import { useCreateImportRecord } from "@/integrations/supabase/hooks/useImportHistory";
import { useQueryClient } from '@tanstack/react-query';
import { normalizeCPF } from "@/lib/cpf";
import { validateRow, RowValidation } from "@/lib/validators";
import {
  normalizeEnrollmentSource,
  normalizeCohortName,
  normalizePhone,
  normalizeZipcode,
  parsePaymentStatus,
  parseContractStatus,
  normalizeDate,
  parseMoneyValue,
  normalizeAddress
} from "@/lib/normalize";

interface CsvImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohortId?: string; // Opcional - para importação de turma única
  cohortName?: string; // Opcional - para importação de turma única
  multiCohort?: boolean; // Se true, permite importação multi-turma
}

type ImportStep = "upload" | "mapping" | "cohort-check" | "preview" | "importing" | "results";

interface ParsedRow {
  cohort_identifier?: string; // Nome da turma para vincular
  student_name: string;
  email: string;
  cpf: string;
  phone?: string;
  sales_rep: string;
  source: string;
  financial_status: "paid" | "pending";
  contract_status: "signed" | "pending";
  payment_details: string;
  payment_amount?: number;
  isDuplicate?: boolean; // Email já existe na turma
  existingEnrollmentId?: string; // ID do enrollment existente
  validationResult?: RowValidation; // Resultado da validação em tempo real
  // New fields from FASE 1
  purchase_date?: string; // Data da compra (ISO format)
  lead_date?: string; // Data de chegada do lead
  nationality?: string;
  address?: string; // Endereço completo
  city?: string; // Cidade
  state?: string; // Estado/UF
  zipcode?: string; // CEP (normalizado)
  product_name?: string; // Nome do produto
  payment_proof_url?: string; // URL do comprovante
  observations?: string; // Observações gerais
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  utm_page?: string;
  submitted_at?: string; // Timestamp de submissão
}

export const CsvImportModal = ({ open, onOpenChange, cohortId, cohortName, multiCohort = false }: CsvImportModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<ImportStep>("upload");
  const [previewData, setPreviewData] = useState<ParsedRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);
  const { toast } = useToast();
  const createImportRecord = useCreateImportRecord();
  const queryClient = useQueryClient();

  // Novo estado para mapeamento de colunas
  const [csvRawData, setCsvRawData] = useState<{ headers: string[]; rows: string[][] }>({ headers: [], rows: [] });
  const [columnMapping, setColumnMapping] = useState<Record<string, string | undefined>>({});
  const [showMappingModal, setShowMappingModal] = useState(false);

  // Novo estado para multi-turma
  const [detectedCohorts, setDetectedCohorts] = useState<string[]>([]);
  const [missingCohorts, setMissingCohorts] = useState<string[]>([]);
  const [cohortMapping, setCohortMapping] = useState<Record<string, string>>({}); // nome -> id
  const [showCohortCreationModal, setShowCohortCreationModal] = useState(false);

  // Estado para modal de configuração de template
  const [showTemplateConfigModal, setShowTemplateConfigModal] = useState(false);

  const firstErrorRowRef = useRef<HTMLTableRowElement>(null);

  const downloadTemplate = () => {
    // Abrir modal de configuração de template
    setShowTemplateConfigModal(true);
  };

  // Função de normalização de valores do enum enrollment_source
  // Verificar emails duplicados por turma
  const checkDuplicateEmails = async (data: ParsedRow[]) => {
    try {
      if (multiCohort) {
        // Multi-turma: buscar por turma
        for (const row of data) {
          const targetCohortId = row.cohort_identifier ? cohortMapping[row.cohort_identifier] : null;
          if (!targetCohortId || !row.email) continue;

          const { data: existing, error } = await supabase
            .from('enrollments')
            .select('id')
            .eq('cohort_id', targetCohortId)
            .eq('email', row.email.toLowerCase().trim())
            .maybeSingle();

          if (error) throw error;

          if (existing) {
            row.isDuplicate = true;
            row.existingEnrollmentId = existing.id;
          }
        }
      } else {
        // Turma única: buscar todos de uma vez
        if (!cohortId) return;

        const emails = data.map(row => row.email.toLowerCase().trim()).filter(Boolean);
        if (emails.length === 0) return;

        const { data: existingEnrollments, error } = await supabase
          .from('enrollments')
          .select('id, email')
          .eq('cohort_id', cohortId)
          .in('email', emails);

        if (error) throw error;

        // Criar mapa de emails existentes
        const existingEmailMap = new Map(
          existingEnrollments?.map(e => [e.email.toLowerCase(), e.id]) || []
        );

        // Marcar duplicatas
        data.forEach(row => {
          const normalizedEmail = row.email.toLowerCase().trim();
          if (existingEmailMap.has(normalizedEmail)) {
            row.isDuplicate = true;
            row.existingEnrollmentId = existingEmailMap.get(normalizedEmail);
          }
        });
      }

      // Atualizar previewData
      setPreviewData([...data]);
    } catch (error: any) {
      console.error("Erro ao verificar duplicatas:", error);
      toast({
        title: "Aviso",
        description: "Não foi possível verificar emails duplicados. Continue com cautela.",
        variant: "default",
      });
    }
  };

  const normalizeEnrollmentSource = (value: string): string => {
    if (!value) return 'Outro';

    const normalized = value.toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove acentos

    // Mapeamento de valores comuns para valores válidos do enum
    const mapping: Record<string, string> = {
      'instagram': 'Instagram',
      'insta': 'Instagram',
      'ig': 'Instagram',
      'facebook': 'Facebook',
      'fb': 'Facebook',
      'face': 'Facebook',
      'indicacao': 'Indicação',
      'indicaçao': 'Indicação',
      'indicacoes': 'Indicação',
      'indica': 'Indicação',
      'trafego': 'Tráfego Pago',
      'trafego pago': 'Tráfego Pago',
      'ads': 'Tráfego Pago',
      'google': 'Tráfego Pago',
      'google ads': 'Tráfego Pago',
      'meta ads': 'Tráfego Pago',
      'direto': 'Direto',
      'direct': 'Direto',
      'organico': 'Direto',
      'outro': 'Outro',
      'outros': 'Outro',
      'other': 'Outro',
    };

    return mapping[normalized] || 'Outro';
  };

  // Parse CSV bruto (sem mapeamento)
  const parseRawCSV = (text: string): { headers: string[]; rows: string[][] } => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const rows: string[][] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.length > 0) {
        rows.push(values);
      }
    }

    return { headers, rows };
  };

  // Função para revalidar todas as linhas
  const revalidateAllRows = (rows: ParsedRow[]): ParsedRow[] => {
    return rows.map((row, index) => ({
      ...row,
      validationResult: validateRow(row, index),
    }));
  };

  // Parse CSV com mapeamento aplicado
  const parseCSVWithMapping = (mapping: Record<string, string | undefined>): ParsedRow[] => {
    const rows: ParsedRow[] = [];

    csvRawData.rows.forEach((rowValues) => {
      const row: any = {};

      // Aplicar mapeamento - filtrar valores undefined
      Object.entries(mapping).forEach(([systemField, csvColumn]) => {
        if (csvColumn) {
          const columnIndex = csvRawData.headers.indexOf(csvColumn);
          if (columnIndex !== -1) {
            row[systemField] = rowValues[columnIndex] || '';
          }
        }
      });

      // Normalizar CPF
      const cpfResult = normalizeCPF(row.cpf || '');

      // Normalizar telefone
      const normalizedPhone = normalizePhone(row.phone || '');

      // Normalizar CEP
      const normalizedZipcode = normalizeZipcode(row.zipcode || '');

      // Normalizar endereço
      const normalizedAddress = normalizeAddress(row.address || '');

      // Normalizar nome da turma
      const normalizedCohort = multiCohort
        ? normalizeCohortName(row.cohort_identifier || '')
        : (cohortName || '');

      // Parse datas
      const purchaseDate = normalizeDate(row.purchase_date);
      const leadDate = normalizeDate(row.lead_date);
      const submittedAt = row.submitted_at; // Mantém formato original

      // Parse valor monetário
      const amount = parseMoneyValue(row.payment_amount);

      const nationality = row.nationality?.trim();

      const parsedRow: ParsedRow = {
        // Campos obrigatórios normalizados
        cohort_identifier: normalizedCohort,
        student_name: row.student_name || '',
        email: row.email?.toLowerCase().trim() || '',
        cpf: cpfResult.normalized,
        phone: normalizedPhone || undefined,
        sales_rep: row.sales_rep || '',
        source: normalizeEnrollmentSource(row.source || ''),
        financial_status: parsePaymentStatus(row.financial_status || 'pending'),
        contract_status: parseContractStatus(row.contract_status || 'pending'),
        payment_details: row.payment_details?.trim() || 'Aguardando detalhes',
        payment_amount: amount || undefined,

        // Novos campos opcionais normalizados
        purchase_date: purchaseDate || undefined,
        lead_date: leadDate || undefined,
        nationality: nationality || undefined,
        address: normalizedAddress || undefined,
        city: row.city?.trim() || undefined,
        state: row.state?.trim().toUpperCase() || undefined,
        zipcode: normalizedZipcode || undefined,
        product_name: row.product_name?.trim() || 'Optical Experience',
        payment_proof_url: row.payment_proof_url?.trim() || undefined,
        observations: row.observations?.trim() || undefined,
        utm_source: row.utm_source?.trim() || undefined,
        utm_medium: row.utm_medium?.trim() || undefined,
        utm_campaign: row.utm_campaign?.trim() || undefined,
        utm_term: row.utm_term?.trim() || undefined,
        utm_content: row.utm_content?.trim() || undefined,
        utm_page: row.utm_page?.trim() || undefined,
        submitted_at: submittedAt || undefined,
      };

      rows.push(parsedRow);
    });

    // Revalidar todas as linhas com índices corretos
    return revalidateAllRows(rows);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResults(null);

      // Parse CSV e ir para tela de mapeamento
      try {
        const text = await selectedFile.text();
        const rawData = parseRawCSV(text);

        if (rawData.rows.length === 0) {
          throw new Error("Nenhuma linha válida encontrada no arquivo CSV");
        }

        setCsvRawData(rawData);
        setShowMappingModal(true);

        toast({
          title: "Arquivo carregado!",
          description: `${rawData.rows.length} linha(s) encontrada(s). Configure o mapeamento das colunas.`,
        });
      } catch (error: any) {
        toast({
          title: "Erro ao ler arquivo",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo CSV válido.",
        variant: "destructive",
      });
    }
  };

  const handleMappingConfirm = async (mapping: Record<string, string | undefined>) => {
    setColumnMapping(mapping);
    setShowMappingModal(false);

    // Aplicar mapeamento e gerar preview
    const mappedData = parseCSVWithMapping(mapping);
    setPreviewData(mappedData);

    // Se multiCohort, verificar turmas
    if (multiCohort) {
      await checkCohorts(mappedData);
    } else {
      // Importação de turma única - verificar duplicatas e ir para preview
      await checkDuplicateEmails(mappedData);
      setStep("preview");

      const duplicateCount = mappedData.filter(row => row.isDuplicate).length;
      toast({
        title: "Mapeamento confirmado!",
        description: `${mappedData.length} linha(s) prontas para revisar${duplicateCount > 0 ? ` • ${duplicateCount} email(s) duplicado(s) detectado(s)` : ''}.`,
      });
    }
  };

  const checkCohorts = async (data: ParsedRow[]) => {
    try {
      // Extrair turmas únicas
      const uniqueCohorts = Array.from(new Set(
        data.map(row => row.cohort_identifier).filter(Boolean)
      )) as string[];

      setDetectedCohorts(uniqueCohorts);

      if (uniqueCohorts.length === 0) {
        toast({
          title: "Erro",
          description: "Nenhuma turma identificada no CSV. Verifique o mapeamento.",
          variant: "destructive",
        });
        return;
      }

      // Buscar turmas existentes no banco
      const { data: existingCohorts, error } = await supabase
        .from('cohorts')
        .select('id, name')
        .in('name', uniqueCohorts);

      if (error) throw error;

      // Criar mapeamento nome -> id para turmas existentes
      const mapping: Record<string, string> = {};
      existingCohorts?.forEach(cohort => {
        mapping[cohort.name] = cohort.id;
      });

      setCohortMapping(mapping);

      // Identificar turmas ausentes
      const missing = uniqueCohorts.filter(name => !mapping[name]);
      setMissingCohorts(missing);

      if (missing.length > 0) {
        // Mostrar modal de criação de turmas
        setShowCohortCreationModal(true);
        toast({
          title: "Turmas ausentes detectadas",
          description: `${missing.length} turma(s) não encontrada(s). Configure-as antes de continuar.`,
        });
      } else {
        // Todas as turmas existem - verificar duplicatas e ir para preview
        await checkDuplicateEmails(data);
        setStep("preview");

        const duplicateCount = data.filter(row => row.isDuplicate).length;
        toast({
          title: "Turmas identificadas!",
          description: `${uniqueCohorts.length} turma(s) encontrada(s). Revise os dados${duplicateCount > 0 ? ` • ${duplicateCount} email(s) duplicado(s)` : ''}.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao verificar turmas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCohortsCreated = async (cohortForms: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Criar turmas no banco
      const cohortsToInsert = Object.entries(cohortForms).map(([name, form]: [string, any]) => ({
        name,
        course_id: form.courseId,
        year: form.year,
        start_date: form.startDate,
        location: form.location,
        capacity: form.capacity,
        status: 'open' as const,
      }));

      const { data: createdCohorts, error } = await supabase
        .from('cohorts')
        .insert(cohortsToInsert)
        .select('id, name');

      if (error) throw error;

      // Atualizar mapeamento com as turmas recém-criadas
      const newMapping = { ...cohortMapping };
      createdCohorts?.forEach(cohort => {
        newMapping[cohort.name] = cohort.id;
      });
      setCohortMapping(newMapping);

      setShowCohortCreationModal(false);

      // Verificar duplicatas antes de ir para preview
      await checkDuplicateEmails(previewData);
      setStep("preview");

      const duplicateCount = previewData.filter(row => row.isDuplicate).length;
      toast({
        title: "Turmas criadas!",
        description: `${createdCohorts?.length} turma(s) criada(s)${duplicateCount > 0 ? ` • ${duplicateCount} email(s) duplicado(s) detectado(s)` : ''}.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar turmas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSkipMissingCohorts = () => {
    // Filtrar apenas alunos de turmas existentes
    const filteredData = previewData.filter(row =>
      row.cohort_identifier && cohortMapping[row.cohort_identifier]
    );

    // Revalidar todas as linhas com os novos índices
    setPreviewData(revalidateAllRows(filteredData));
    setShowCohortCreationModal(false);
    setStep("preview");

    toast({
      title: "Turmas ausentes ignoradas",
      description: `${filteredData.length} linha(s) de turmas existentes serão importadas.`,
    });
  };

  const handleMappingBack = () => {
    setShowMappingModal(false);
    setStep("upload");
  };

  const handleImport = async (forceImport: boolean = false) => {
    if (previewData.length === 0) return;

    // Verificar se há erros críticos
    const rowsWithErrors = previewData.filter(row => row.validationResult?.hasErrors);
    const validRows = previewData.filter(row => !row.validationResult?.hasErrors);

    if (rowsWithErrors.length > 0 && !forceImport) {
      // Coletar os primeiros erros para exibir
      const firstErrors = rowsWithErrors.slice(0, 3).map((row, idx) => {
        const rowIndex = previewData.indexOf(row) + 1;
        const errorMessages = row.validationResult?.validations
          .filter(v => v.level === 'error')
          .map(v => v.message)
          .join(', ');
        return `Linha ${rowIndex}: ${errorMessages}`;
      });

      toast({
        title: "Não é possível importar",
        description: (
          <div className="space-y-1">
            <p>Corrija os erros antes de continuar:</p>
            {firstErrors.map((err, i) => (
              <p key={i} className="text-xs">• {err}</p>
            ))}
          </div>
        ),
        variant: "destructive",
      });

      // Scroll para primeira linha com erro
      if (firstErrorRowRef.current) {
        firstErrorRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Se forçar importação, usar apenas linhas válidas
    const dataToImport = forceImport ? validRows : previewData;

    if (dataToImport.length === 0) {
      toast({
        title: "Nenhuma linha válida",
        description: "Não há linhas válidas para importar.",
        variant: "destructive",
      });
      return;
    }

    // Avisar sobre warnings mas permitir continuar
    const hasWarnings = dataToImport.some(row => row.validationResult?.hasWarnings);
    if (hasWarnings) {
      const warningCount = dataToImport.filter(row => row.validationResult?.hasWarnings).length;
      toast({
        title: `${warningCount} aviso(s) detectado(s)`,
        description: "Os dados serão importados, mas revise os avisos se necessário.",
      });
    }

    // Avisar sobre linhas ignoradas na importação forçada
    if (forceImport && rowsWithErrors.length > 0) {
      toast({
        title: "Importação forçada",
        description: `${rowsWithErrors.length} linha(s) com erro serão ignoradas. Apenas ${validRows.length} linha(s) válidas serão importadas.`,
      });
    }

    setStep("importing");
    setProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const errors: string[] = [];
      let successCount = 0;

      // Determinar quais dados importar (pode ser apenas válidos se forçado)
      const dataToImport = forceImport ? validRows : previewData;
      const ignoredRows = forceImport ? rowsWithErrors : [];

      for (let i = 0; i < dataToImport.length; i++) {
        const cohortInfo = multiCohort ? ` (Turma: ${dataToImport[i].cohort_identifier})` : '';

        try {
          // Determinar cohort_id
          let targetCohortId: string;

          if (multiCohort) {
            // Multi-turma: buscar ID baseado no identificador
            const cohortIdentifier = dataToImport[i].cohort_identifier;
            if (!cohortIdentifier || !cohortMapping[cohortIdentifier]) {
              throw new Error(`Turma não encontrada: ${cohortIdentifier}`);
            }
            targetCohortId = cohortMapping[cohortIdentifier];
          } else {
            // Turma única: usar cohortId fornecido
            if (!cohortId) {
              throw new Error("ID da turma não fornecido");
            }
            targetCohortId = cohortId;
          }

          const enrollmentData: any = {
            cohort_id: targetCohortId,
            student_name: dataToImport[i].student_name,
            email: dataToImport[i].email,
            cpf: dataToImport[i].cpf,
            sales_rep: dataToImport[i].sales_rep,
            source: dataToImport[i].source,
            financial_status: dataToImport[i].financial_status || 'pending',
            contract_status: dataToImport[i].contract_status || 'pending',
            payment_details: dataToImport[i].payment_details || 'Aguardando detalhes',
            created_by: user?.id,
          };

          // Campos opcionais (apenas se preenchidos)
          if (dataToImport[i].phone) {
            enrollmentData.phone = dataToImport[i].phone;
          }

          if (dataToImport[i].payment_amount) {
            enrollmentData.payment_amount = dataToImport[i].payment_amount;
          }

          if (dataToImport[i].purchase_date) {
            enrollmentData.purchase_date = dataToImport[i].purchase_date;
          }

          if (dataToImport[i].lead_date) {
            enrollmentData.lead_date = dataToImport[i].lead_date;
          }

          if (dataToImport[i].address) {
            enrollmentData.address = dataToImport[i].address;
          }

          if (dataToImport[i].city) {
            enrollmentData.city = dataToImport[i].city;
          }

          if (dataToImport[i].state) {
            enrollmentData.state = dataToImport[i].state;
          }

          if (dataToImport[i].zipcode) {
            enrollmentData.zipcode = dataToImport[i].zipcode;
          }

          if (dataToImport[i].product_name) {
            enrollmentData.product_name = dataToImport[i].product_name;
          }

          if (dataToImport[i].payment_proof_url) {
            enrollmentData.payment_proof_url = dataToImport[i].payment_proof_url;
          }

          if (dataToImport[i].observations) {
            enrollmentData.observations = dataToImport[i].observations;
          }

          if (dataToImport[i].utm_source) {
            enrollmentData.utm_source = dataToImport[i].utm_source;
          }

          if (dataToImport[i].utm_medium) {
            enrollmentData.utm_medium = dataToImport[i].utm_medium;
          }

          if (dataToImport[i].utm_campaign) {
            enrollmentData.utm_campaign = dataToImport[i].utm_campaign;
          }

          if (dataToImport[i].utm_term) {
            enrollmentData.utm_term = dataToImport[i].utm_term;
          }

          if (dataToImport[i].utm_content) {
            enrollmentData.utm_content = dataToImport[i].utm_content;
          }

          if (dataToImport[i].utm_page) {
            enrollmentData.utm_page = dataToImport[i].utm_page;
          }

          if (dataToImport[i].submitted_at) {
            enrollmentData.submitted_at = dataToImport[i].submitted_at;
          }

          // Pular duplicatas se já marcadas
          if (dataToImport[i].isDuplicate) {
            errors.push(`Linha ${i + 2}${cohortInfo}: Email duplicado (ignorado)`);
            setProgress(Math.round(((i + 1) / dataToImport.length) * 100));
            continue;
          }

          const { error } = await supabase
            .from('enrollments')
            .insert(enrollmentData);

          if (error) {
            // Ignorar erro de email duplicado
            if (error.code === '23505' && error.message.includes('email')) {
              errors.push(`Linha ${i + 2}${cohortInfo}: Email já existe na turma (ignorado)`);
            } else {
              throw error;
            }
          } else {
            successCount++;
          }
        } catch (error: any) {
          errors.push(`Linha ${i + 2}${cohortInfo}: ${error.message}`);
        }

        setProgress(Math.round(((i + 1) / dataToImport.length) * 100));
      }

      // Adicionar informação sobre linhas ignoradas se foi importação forçada
      if (forceImport && ignoredRows.length > 0) {
        ignoredRows.forEach((row, idx) => {
          const rowIndex = previewData.indexOf(row) + 1;
          const errorMessages = row.validationResult?.validations
            .filter(v => v.level === 'error')
            .map(v => v.message)
            .join(', ');
          errors.push(`Linha ${rowIndex} (IGNORADA): ${errorMessages}`);
        });
      }

      setResults({ success: successCount, errors });
      setStep("results");

      // Invalidar queries para atualizar dados na interface
      if (successCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['cohorts'] });
        if (multiCohort) {
          // Invalidar todas as turmas afetadas
          Object.values(cohortMapping).forEach(id => {
            queryClient.invalidateQueries({ queryKey: ['cohort', id] });
            queryClient.invalidateQueries({ queryKey: ['enrollments', id] });
          });
        } else if (cohortId) {
          // Invalidar turma específica
          queryClient.invalidateQueries({ queryKey: ['cohort', cohortId] });
          queryClient.invalidateQueries({ queryKey: ['enrollments', cohortId] });
        }
      }

      // Registrar no histórico de importações
      const uniqueCohorts = multiCohort
        ? Array.from(new Set(dataToImport.map(row => row.cohort_identifier).filter(Boolean)))
        : [cohortName || "Turma"];

      try {
        const historyNotes = [];
        if (errors.length > 0) {
          historyNotes.push(`${errors.length} erro(s) durante importação`);
        }
        if (forceImport && ignoredRows.length > 0) {
          historyNotes.push(`${ignoredRows.length} linha(s) ignorada(s) por erros de validação`);
        }

        await createImportRecord.mutateAsync({
          total_students: previewData.length,
          successful_imports: successCount,
          failed_imports: errors.length,
          cohorts_affected: uniqueCohorts as string[],
          file_name: file?.name || "import.csv",
          import_type: forceImport ? "forced-import" : (multiCohort ? "multi-cohort" : "single-cohort"),
          notes: historyNotes.length > 0 ? historyNotes.join(' • ') : undefined,
        });
      } catch (historyError) {
        // Não falhar a importação se o log falhar
        console.error("Failed to log import history:", historyError);
      }

      if (successCount > 0) {
        toast({
          title: "Importação concluída!",
          description: `${successCount} matrícula(s) importada(s) com sucesso.`,
        });
      }

      if (errors.length > 0) {
        toast({
          title: "Alguns erros ocorreram",
          description: `${errors.length} linha(s) não puderam ser importadas.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
      setStep("preview");
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setResults(null);
    setProgress(0);
    setStep("upload");
    setCsvRawData({ headers: [], rows: [] });
    setColumnMapping({});
    setShowMappingModal(false);
    onOpenChange(false);
  };

  const handleBack = () => {
    setStep("upload");
    setFile(null);
    setPreviewData([]);
  };

  const updatePreviewRow = (index: number, field: keyof ParsedRow, value: string | number) => {
    const updatedData = [...previewData];
    updatedData[index] = {
      ...updatedData[index],
      [field]: value,
    };
    // Revalidar a linha editada
    updatedData[index].validationResult = validateRow(updatedData[index], index);
    setPreviewData(updatedData);
  };

  const removePreviewRow = (index: number) => {
    const updatedData = previewData.filter((_, i) => i !== index);
    // Revalidar todas as linhas com os novos índices
    setPreviewData(revalidateAllRows(updatedData));
    toast({
      title: "Linha removida",
      description: "A linha foi removida da prévia de importação.",
    });
  };

  const removeDuplicateRows = () => {
    const filteredData = previewData.filter(row => !row.isDuplicate);
    const removedCount = previewData.length - filteredData.length;
    // Revalidar todas as linhas com os novos índices
    setPreviewData(revalidateAllRows(filteredData));
    toast({
      title: "Duplicatas removidas",
      description: `${removedCount} linha(s) com email duplicado foram removidas.`,
    });
  };

  // Auto-scroll para primeira linha com erro
  useEffect(() => {
    if (step === "preview" && firstErrorRowRef.current) {
      firstErrorRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [step, previewData]);

  return (
    <>
      {/* Modal de Mapeamento de Colunas */}
      <CsvColumnMappingModal
        open={showMappingModal}
        onOpenChange={setShowMappingModal}
        csvHeaders={csvRawData.headers}
        csvPreviewData={csvRawData.rows}
        onConfirmMapping={handleMappingConfirm}
        onBack={handleMappingBack}
        multiCohort={multiCohort}
      />

      {/* Modal de Criação de Turmas Ausentes */}
      <CohortCreationModal
        open={showCohortCreationModal}
        onOpenChange={setShowCohortCreationModal}
        missingCohorts={missingCohorts}
        onCohortsCreated={handleCohortsCreated}
        onSkip={handleSkipMissingCohorts}
      />

      {/* Modal Principal de Importação */}
      <Dialog open={open && !showMappingModal && !showCohortCreationModal} onOpenChange={handleClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary">
              {step === "upload" && "Importar Matrículas via CSV"}
              {step === "preview" && "Revisar Dados do CSV"}
              {step === "importing" && "Importando Matrículas..."}
              {step === "results" && "Resultado da Importação"}
            </DialogTitle>
            <DialogDescription>
              {multiCohort ? (
                <>
                  Importação Multi-turma
                  {detectedCohorts.length > 0 && (
                    <span className="ml-2 text-primary">
                      • {detectedCohorts.length} turma(s) detectada(s)
                    </span>
                  )}
                  {step === "preview" && (
                    <span className="ml-2 text-primary">• {previewData.length} linha(s) para importar</span>
                  )}
                </>
              ) : (
                <>
                  Turma: <span className="font-semibold text-foreground">{cohortName}</span>
                  {step === "preview" && (
                    <span className="ml-2 text-primary">• {previewData.length} linha(s) para importar</span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Upload Step */}
            {step === "upload" && (
              <>
                {/* Download Template */}
                <div className="border border-border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">Baixar Modelo CSV</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Baixe o arquivo modelo para garantir que seu CSV está no formato correto.
                      </p>
                      <Button variant="outline" size="sm" onClick={downloadTemplate}>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Modelo
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Instruções importantes:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>O arquivo deve estar no formato CSV (separado por vírgula)</li>
                      <li>A primeira linha deve conter os cabeçalhos</li>
                      <li>O email deve ser único por turma</li>
                      <li>financial_status: "paid" ou "pending"</li>
                      <li>contract_status: "signed" ou "pending"</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {/* File Upload */}
                <div className="border-2 border-dashed border-border rounded-lg p-8">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground mb-1">
                        {file ? file.name : "Selecione um arquivo CSV"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Arraste e solte ou clique para selecionar
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload">
                      <Button variant="outline" asChild>
                        <span>Selecionar Arquivo</span>
                      </Button>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Preview Step */}
            {step === "preview" && (
              <TooltipProvider>
                <Alert className="border-primary/50 bg-primary/5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    <strong>Revise e edite os dados antes de importar.</strong> Clique em qualquer campo para editá-lo.
                    Os campos obrigatórios vazios serão destacados em vermelho.
                  </AlertDescription>
                </Alert>

                {(() => {
                  const errorCount = previewData.filter(row =>
                    row.validationResult?.hasErrors
                  ).length;
                  const warningCount = previewData.filter(row =>
                    row.validationResult?.hasWarnings && !row.validationResult?.hasErrors
                  ).length;
                  const duplicateCount = previewData.filter(row => row.isDuplicate).length;
                  const validCount = previewData.length - errorCount;

                  return (
                    <>
                      <div className="flex gap-4 p-4 bg-muted/30 rounded-lg border border-border flex-wrap">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">{validCount} Linhas Válidas</p>
                            <p className="text-xs text-muted-foreground">Prontas para importar</p>
                          </div>
                        </div>
                        {errorCount > 0 && (
                          <>
                            <div className="border-l border-border" />
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-5 w-5 text-destructive" />
                              <div>
                                <p className="text-sm font-semibold text-destructive">{errorCount} Linhas com Erros</p>
                                <p className="text-xs text-muted-foreground">Corrija os campos inválidos</p>
                              </div>
                            </div>
                          </>
                        )}
                        {warningCount > 0 && (
                          <>
                            <div className="border-l border-border" />
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                              <div>
                                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">{warningCount} Avisos</p>
                                <p className="text-xs text-muted-foreground">Revise os dados</p>
                              </div>
                            </div>
                          </>
                        )}
                        {duplicateCount > 0 && (
                          <>
                            <div className="border-l border-border" />
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                              <div>
                                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">{duplicateCount} Email(s) Duplicado(s)</p>
                                <p className="text-xs text-muted-foreground">Já existe(m) na turma</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {duplicateCount > 0 && (
                        <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <AlertDescription className="text-sm flex items-center justify-between">
                            <span>
                              Alguns emails já existem nas turmas selecionadas. Você pode removê-los ou continuar (duplicatas serão ignoradas).
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={removeDuplicateRows}
                              className="ml-4 text-xs"
                            >
                              Remover Duplicatas
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  );
                })()}

                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0 z-10">
                        <tr>
                          <th className="px-2 py-2 text-left font-semibold text-xs w-10">#</th>
                          <th className="px-2 py-2 text-left font-semibold text-xs min-w-[180px]">
                            <div className="flex items-center gap-1">
                              Nome *
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Nome completo do aluno</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </th>
                          <th className="px-2 py-2 text-left font-semibold text-xs min-w-[180px]">
                            <div className="flex items-center gap-1">
                              Email *
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Deve ser único por turma</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </th>
                          <th className="px-2 py-2 text-left font-semibold text-xs min-w-[130px]">
                            <div className="flex items-center gap-1">
                              CPF *
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Formato: 000.000.000-00 ou 11 dígitos</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </th>
                          <th className="px-2 py-2 text-left font-semibold text-xs min-w-[130px]">Telefone</th>
                          <th className="px-2 py-2 text-left font-semibold text-xs min-w-[120px]">Vendedor *</th>
                          <th className="px-2 py-2 text-left font-semibold text-xs min-w-[120px]">Origem</th>
                          <th className="px-2 py-2 text-left font-semibold text-xs min-w-[100px]">Valor</th>
                          <th className="px-2 py-2 text-left font-semibold text-xs min-w-[110px]">Pagamento</th>
                          <th className="px-2 py-2 text-left font-semibold text-xs min-w-[110px]">Contrato</th>
                          <th className="px-2 py-2 text-center font-semibold text-xs w-16">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {previewData.map((row, index) => {
                          const hasError = row.validationResult?.hasErrors || false;
                          const hasWarning = row.validationResult?.hasWarnings || false;
                          const isDuplicate = row.isDuplicate;
                          const isFirstError = hasError && !previewData.slice(0, index).some(r =>
                            r.validationResult?.hasErrors
                          );

                          return (
                            <tr
                              key={index}
                              ref={isFirstError ? firstErrorRowRef : null}
                              className={
                                hasError
                                  ? "bg-destructive/5"
                                  : isDuplicate
                                    ? "bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/30"
                                    : hasWarning
                                      ? "bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                      : "hover:bg-muted/30"
                              }
                            >
                              <td className="px-2 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <span className="text-xs text-muted-foreground">{index + 1}</span>
                                  {hasError && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertCircle className="h-4 w-4 text-destructive" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <div className="space-y-1">
                                          {row.validationResult?.validations
                                            .filter(v => v.level === 'error')
                                            .map((v, i) => (
                                              <p key={i} className="text-xs">• {v.message}</p>
                                            ))}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {!hasError && hasWarning && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <div className="space-y-1">
                                          {row.validationResult?.validations
                                            .filter(v => v.level === 'warning')
                                            .map((v, i) => (
                                              <p key={i} className="text-xs">• {v.message}</p>
                                            ))}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </td>

                              {/* Nome */}
                              <td className="px-2 py-1">
                                <input
                                  type="text"
                                  value={row.student_name || ""}
                                  onChange={(e) => updatePreviewRow(index, "student_name", e.target.value)}
                                  placeholder="Nome completo"
                                  className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 ${!row.student_name
                                    ? "border-destructive bg-destructive/5 focus:ring-destructive"
                                    : "border-border bg-background focus:ring-primary"
                                    }`}
                                />
                              </td>

                              {/* Email */}
                              <td className="px-2 py-1">
                                <div className="relative">
                                  <input
                                    type="email"
                                    value={row.email || ""}
                                    onChange={(e) => updatePreviewRow(index, "email", e.target.value)}
                                    placeholder="email@exemplo.com"
                                    className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 ${!row.email
                                      ? "border-destructive bg-destructive/5 focus:ring-destructive"
                                      : isDuplicate
                                        ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 focus:ring-amber-500"
                                        : "border-border bg-background focus:ring-primary"
                                      }`}
                                  />
                                  {isDuplicate && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <AlertCircle className="absolute right-1 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs">Email já existe nesta turma</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </td>

                              {/* CPF */}
                              <td className="px-2 py-1">
                                <input
                                  type="text"
                                  value={row.cpf || ""}
                                  onChange={(e) => updatePreviewRow(index, "cpf", e.target.value)}
                                  placeholder="000.000.000-00"
                                  className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 ${!row.cpf
                                    ? "border-destructive bg-destructive/5 focus:ring-destructive"
                                    : "border-border bg-background focus:ring-primary"
                                    }`}
                                />
                              </td>

                              {/* Telefone */}
                              <td className="px-2 py-1">
                                <input
                                  type="text"
                                  value={row.phone || ""}
                                  onChange={(e) => updatePreviewRow(index, "phone", e.target.value)}
                                  placeholder="(00) 00000-0000"
                                  className="w-full px-2 py-1 text-xs border border-border bg-background rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </td>

                              {/* Vendedor */}
                              <td className="px-2 py-1">
                                <input
                                  type="text"
                                  value={row.sales_rep || ""}
                                  onChange={(e) => updatePreviewRow(index, "sales_rep", e.target.value)}
                                  placeholder="Nome do vendedor"
                                  className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 ${!row.sales_rep
                                    ? "border-destructive bg-destructive/5 focus:ring-destructive"
                                    : "border-border bg-background focus:ring-primary"
                                    }`}
                                />
                              </td>

                              {/* Origem */}
                              <td className="px-2 py-1">
                                <input
                                  type="text"
                                  value={row.source || ""}
                                  onChange={(e) => updatePreviewRow(index, "source", e.target.value)}
                                  placeholder="instagram, google..."
                                  className="w-full px-2 py-1 text-xs border border-border bg-background rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </td>

                              {/* Valor */}
                              <td className="px-2 py-1">
                                <input
                                  type="number"
                                  value={row.payment_amount || ""}
                                  onChange={(e) => updatePreviewRow(index, "payment_amount", parseFloat(e.target.value) || 0)}
                                  placeholder="0.00"
                                  className="w-full px-2 py-1 text-xs border border-border bg-background rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </td>

                              {/* Status Pagamento */}
                              <td className="px-2 py-1">
                                <select
                                  value={row.financial_status}
                                  onChange={(e) => updatePreviewRow(index, "financial_status", e.target.value as "paid" | "pending")}
                                  className="w-full px-2 py-1 text-xs border border-border bg-background rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                  <option value="pending">Pendente</option>
                                  <option value="paid">Pago</option>
                                </select>
                              </td>

                              {/* Status Contrato */}
                              <td className="px-2 py-1">
                                <select
                                  value={row.contract_status}
                                  onChange={(e) => updatePreviewRow(index, "contract_status", e.target.value as "signed" | "pending")}
                                  className="w-full px-2 py-1 text-xs border border-border bg-background rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                  <option value="pending">Pendente</option>
                                  <option value="signed">Assinado</option>
                                </select>
                              </td>

                              {/* Ações */}
                              <td className="px-2 py-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removePreviewRow(index)}
                                      className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Remover esta linha</p>
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    Voltar
                  </Button>

                  {(() => {
                    const hasErrors = previewData.some(row => row.validationResult?.hasErrors);
                    const validCount = previewData.filter(row => !row.validationResult?.hasErrors).length;

                    return (
                      <>
                        {hasErrors && validCount > 0 && (
                          <Button
                            onClick={() => handleImport(true)}
                            variant="outline"
                            className="flex-1 border-amber-500 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/20"
                          >
                            Forçar Importação ({validCount} válidas)
                          </Button>
                        )}

                        <Button
                          onClick={() => handleImport(false)}
                          disabled={previewData.length === 0 || hasErrors}
                          className="flex-1 bg-primary hover:bg-primary/90"
                        >
                          Confirmar e Importar {previewData.length} Matrícula(s)
                        </Button>
                      </>
                    );
                  })()}
                </div>
              </TooltipProvider>
            )}

            {/* Importing Step */}
            {step === "importing" && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Importando...</span>
                    <span className="font-medium text-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </>
            )}

            {/* Results Step */}
            {step === "results" && results && (
              <>
                <div className="space-y-3">
                  {results.success > 0 && (
                    <Alert className="border-primary/50 bg-primary/5">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <AlertDescription>
                        <strong>{results.success} matrícula(s)</strong> importada(s) com sucesso!
                      </AlertDescription>
                    </Alert>
                  )}

                  {results.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{results.errors.length} erro(s) encontrado(s):</strong>
                        <div className="mt-2 max-h-32 overflow-y-auto text-xs">
                          {results.errors.map((error, idx) => (
                            <div key={idx} className="mb-1">{error}</div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="w-full"
                >
                  Fechar
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de configuração de template personalizado */}
      <CsvTemplateConfigModal
        open={showTemplateConfigModal}
        onOpenChange={setShowTemplateConfigModal}
        multiCohort={multiCohort}
      />
    </>
  );
};