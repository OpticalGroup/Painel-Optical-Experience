import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateEnrollment, useUpdateEnrollment } from "@/integrations/supabase/hooks/useEnrollments";
import { Constants, Tables } from "@/integrations/supabase/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSalesRepsQuery } from "@/integrations/supabase/hooks/useSalesReps";
import { useCohortsQuery } from "@/integrations/supabase/hooks/useCohorts";
import { useCustomSourcesQuery } from "@/integrations/supabase/hooks/useCustomSources";
import { normalizeCPF } from "@/lib/cpf";
import { 
  normalizeZipcode, 
  normalizeAddress, 
  normalizeDate 
} from "@/lib/normalize";
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

type Enrollment = Tables<'enrollments'>;

const formSchema = z.object({
  cohortId: z.string().min(1, "Turma é obrigatória"),
  studentName: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  cpf: z.string().min(11, "CPF inválido"),
  phone: z.string().optional().or(z.literal("")),
  salesRep: z.string().min(1, "Vendedor é obrigatório"),
  source: z.string().min(1, "Origem é obrigatória"),
  paymentAmount: z.string().optional().or(z.literal("")),
  paymentDetails: z.string().min(1, "Condições de pagamento são obrigatórias"),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zipcode: z.string().optional().or(z.literal("")),
  purchaseDate: z.string().optional().or(z.literal("")),
  observations: z.string().optional().or(z.literal("")),
  paymentProofUrl: z.string().optional().or(z.literal("")),
  kommoLeadId: z.string().optional().or(z.literal("")),
  typeformResponseId: z.string().optional().or(z.literal("")),
});

export interface EnrollmentData {
  cohortId: string;
  studentName: string;
  email: string;
  cpf: string;
  phone?: string;
  salesRep: string;
  source: string;
  paymentAmount?: string;
  paymentDetails: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  purchaseDate?: string;
  observations?: string;
  paymentProofUrl?: string;
  kommoLeadId?: string;
  typeformResponseId?: string;
}

interface EnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohortName?: string;
  cohortId?: string;
  onSubmit: (data: EnrollmentData) => void;
  editingEnrollment?: Enrollment;
}

export const EnrollmentModal = ({
  open,
  onOpenChange,
  cohortName,
  cohortId,
  onSubmit,
  editingEnrollment,
}: EnrollmentModalProps) => {
  const createEnrollment = useCreateEnrollment();
  const updateEnrollment = useUpdateEnrollment();
  const { data: salesReps } = useSalesRepsQuery();
  const { data: cohorts } = useCohortsQuery();
  const { data: customSources } = useCustomSourcesQuery();
  const [showMissingFieldsAlert, setShowMissingFieldsAlert] = useState(false);
  const [pendingData, setPendingData] = useState<EnrollmentData | null>(null);
  const isEditing = !!editingEnrollment;

  // Combine enum sources with custom sources
  const allSources = [
    ...Constants.public.Enums.enrollment_source,
    ...(customSources?.filter(s => s.active).map(s => s.name) || [])
  ];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cohortId: cohortId || "",
      studentName: "",
      email: "",
      cpf: "",
      phone: "",
      salesRep: "",
      source: "Outro",
      paymentAmount: "",
      paymentDetails: "",
      address: "",
      city: "",
      state: "",
      zipcode: "",
      purchaseDate: "",
      observations: "",
      paymentProofUrl: "",
      kommoLeadId: "",
      typeformResponseId: "",
    },
  });

  // Load editing data when modal opens
  useEffect(() => {
    if (open && editingEnrollment) {
      form.reset({
        cohortId: editingEnrollment.cohort_id,
        studentName: editingEnrollment.student_name,
        email: editingEnrollment.email,
        cpf: editingEnrollment.cpf,
        phone: editingEnrollment.phone || "",
        salesRep: editingEnrollment.sales_rep,
        source: editingEnrollment.source,
        paymentAmount: editingEnrollment.payment_amount?.toString() || "",
        paymentDetails: editingEnrollment.payment_details,
        address: editingEnrollment.address || "",
        city: editingEnrollment.city || "",
        state: editingEnrollment.state || "",
        zipcode: editingEnrollment.zipcode || "",
        purchaseDate: editingEnrollment.purchase_date || "",
        observations: editingEnrollment.observations || "",
        paymentProofUrl: editingEnrollment.payment_proof_url || "",
        kommoLeadId: editingEnrollment.kommo_lead_id || "",
        typeformResponseId: editingEnrollment.typeform_response_id || "",
      });
    } else if (open && !editingEnrollment) {
      form.reset({
        cohortId: cohortId || "",
        studentName: "",
        email: "",
        cpf: "",
        phone: "",
        salesRep: "",
        source: "Outro",
        paymentAmount: "",
        paymentDetails: "",
        address: "",
        city: "",
        state: "",
        zipcode: "",
        purchaseDate: "",
        observations: "",
        paymentProofUrl: "",
        kommoLeadId: "",
        typeformResponseId: "",
      });
    }
  }, [open, editingEnrollment, cohortId, form]);

  const checkMissingOptionalFields = (data: EnrollmentData) => {
    const missing: string[] = [];
    if (!data.address?.trim()) missing.push("Endereço");
    if (!data.city?.trim()) missing.push("Cidade");
    if (!data.state?.trim()) missing.push("Estado");
    if (!data.zipcode?.trim()) missing.push("CEP");
    if (!data.purchaseDate?.trim()) missing.push("Data de Compra");
    if (!data.observations?.trim()) missing.push("Observações");
    if (!data.paymentProofUrl?.trim()) missing.push("URL do Comprovante");
    return missing;
  };

  const handleFormSubmit = async (data: EnrollmentData) => {
    const missingFields = checkMissingOptionalFields(data);
    
    if (missingFields.length > 0 && !pendingData) {
      setPendingData(data);
      setShowMissingFieldsAlert(true);
      return;
    }

    // Apply normalization
    const normalizedCPFResult = normalizeCPF(data.cpf);
    const normalizedCPF = normalizedCPFResult.normalized;
    const normalizedZipcode = data.zipcode ? normalizeZipcode(data.zipcode) : undefined;
    const normalizedAddress = data.address ? normalizeAddress(data.address) : undefined;
    const normalizedPurchaseDate = data.purchaseDate ? normalizeDate(data.purchaseDate) : undefined;

    const enrollmentData = {
      cohort_id: data.cohortId,
      student_name: data.studentName,
      email: data.email.toLowerCase(),
      cpf: normalizedCPF,
      phone: data.phone || null,
      sales_rep: data.salesRep,
      source: data.source as any,
      payment_amount: data.paymentAmount ? parseFloat(data.paymentAmount) : null,
      payment_details: data.paymentDetails,
      financial_status: "pending" as const,
      contract_status: "pending" as const,
      address: normalizedAddress || null,
      city: data.city || null,
      state: data.state || null,
      zipcode: normalizedZipcode || null,
      purchase_date: normalizedPurchaseDate || null,
      observations: data.observations || null,
      payment_proof_url: data.paymentProofUrl || null,
      kommo_lead_id: data.kommoLeadId || null,
      typeform_response_id: data.typeformResponseId || null,
    };

    if (isEditing && editingEnrollment) {
      updateEnrollment.mutate(
        {
          id: editingEnrollment.id,
          cohort_id: data.cohortId,
          ...enrollmentData,
        },
        {
          onSuccess: () => {
            form.reset();
            setPendingData(null);
            onOpenChange(false);
            onSubmit(data);
          },
        }
      );
    } else {
      createEnrollment.mutate(enrollmentData, {
        onSuccess: () => {
          form.reset();
          setPendingData(null);
          onOpenChange(false);
          onSubmit(data);
        },
      });
    }
  };

  const handleConfirmSubmit = () => {
    if (pendingData) {
      handleFormSubmit(pendingData);
      setShowMissingFieldsAlert(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-primary text-xl">
              {isEditing ? 'Editar Matrícula' : 'Nova Matrícula'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? `Atualizando informações de ${editingEnrollment?.student_name}` 
                : "Selecione a turma e adicione os dados do aluno"
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto pr-2 space-y-6">
              {/* Seleção de Turma */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Turma</h3>
                <FormField
                  control={form.control}
                  name="cohortId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selecione a Turma *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma turma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cohorts?.map((cohort) => (
                            <SelectItem key={cohort.id} value={cohort.id}>
                              {cohort.name} - {cohort.location} ({cohort.stats?.available_spots || 0} vagas disponíveis)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dados do Aluno */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Dados do Aluno</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="studentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Dados Comerciais */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Dados Comerciais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="salesRep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendedor *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {salesReps?.filter(r => r.active).map((rep) => (
                              <SelectItem key={rep.id} value={rep.name}>
                                {rep.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origem *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card z-50">
                            {allSources.map((source) => (
                              <SelectItem key={source} value={source}>
                                {source}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (R$)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="purchaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Compra</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="paymentDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condições de Pagamento *</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Endereço</h3>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input {...field} maxLength={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zipcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="paymentProofUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do Comprovante</FormLabel>
                      <FormControl>
                        <Input {...field} type="url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* FASE 6: Campos de ID de Integração */}
                <FormField
                  control={form.control}
                  name="kommoLeadId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">ID do Lead (Kommo)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Opcional" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="typeformResponseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">ID Typeform</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Opcional" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90"
                  disabled={createEnrollment.isPending || updateEnrollment.isPending}
                >
                  {createEnrollment.isPending || updateEnrollment.isPending
                    ? "Salvando..." 
                    : isEditing 
                    ? "Atualizar Matrícula" 
                    : "Criar Matrícula"
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showMissingFieldsAlert} onOpenChange={setShowMissingFieldsAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Campos opcionais não preenchidos</AlertDialogTitle>
            <AlertDialogDescription>
              Os seguintes campos opcionais não foram preenchidos:
              <ul className="list-disc list-inside mt-2">
                {pendingData && checkMissingOptionalFields(pendingData).map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
              <p className="mt-2">Deseja continuar mesmo assim?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingData(null)}>
              Voltar e preencher
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>
              Continuar sem preencher
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
