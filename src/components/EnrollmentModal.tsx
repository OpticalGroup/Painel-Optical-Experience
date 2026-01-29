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
import { MoneyInput } from "@/components/ui/money-input";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { COUNTRIES } from "./enrollments/constants";
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
import {
  useFunnels,
  useMacroOrigins,
  useMicroOrigins,
  useMicroVariations,
  useNanoVariations
} from "@/integrations/supabase/hooks/useOriginHierarchy";

import { useUtmSettings } from "@/integrations/supabase/hooks/useUtmSettings";
import { useNucleosQuery } from "@/integrations/supabase/hooks/useNucleos";
import { normalizeCPF } from "@/lib/cpf";
import {
  normalizeZipcode,
  normalizeAddress,
  normalizeDate
} from "@/lib/normalize";

type Enrollment = Tables<'enrollments'>;

const formSchema = z.object({
  cohortId: z.string().min(1, "Turma é obrigatória"),
  studentName: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  cpf: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  salesRep: z.string().min(1, "Vendedor é obrigatório"),
  coSalesRep: z.string().optional().or(z.literal("")),
  funnelId: z.string().optional().or(z.literal("")),
  macroOriginId: z.string().optional().or(z.literal("")),
  microOriginId: z.string().optional().or(z.literal("")),
  microVariationId: z.string().optional().or(z.literal("")),
  nanoVariationId: z.string().optional().or(z.literal("")),
  source: z.string().min(1, "Origem é obrigatória"),
  productName: z.string().optional().default("Optical Experience"),
  paymentAmount: z.string().optional().or(z.literal("")),
  paymentDetails: z.string().min(1, "Condições de pagamento são obrigatórias"),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zipcode: z.string().optional().or(z.literal("")),
  country: z.string().optional().default("Brasil"),
  purchaseDate: z.string().optional().or(z.literal("")),
  observations: z.string().optional().or(z.literal("")),
  paymentProofUrl: z.string().optional().or(z.literal("")),
  kommoContactId: z.string().optional().or(z.literal("")),
  kommoLeadId: z.string().optional().or(z.literal("")),
  externalLeadId: z.string().optional().or(z.literal("")),
  typeformResponseId: z.string().optional().or(z.literal("")),
  leadDate: z.string().optional().or(z.literal("")),
  originActionDate: z.string().optional().or(z.literal("")),
  submittedAt: z.string().optional().or(z.literal("")),
  nationality: z.string().optional().default("Brasil"),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
  utmPage: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
  utmPage: z.string().optional(),
  nucleoId: z.string().optional().or(z.literal("")),
});

export interface EnrollmentData {
  cohortId: string;
  studentName: string;
  email: string;
  cpf: string;
  phone?: string;
  salesRep: string;
  coSalesRep?: string;
  funnelId?: string;
  macroOriginId?: string;
  microOriginId?: string;
  microVariationId?: string;
  nanoVariationId?: string;
  source: string;
  productName?: string;
  paymentAmount?: string;
  paymentDetails: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
  purchaseDate?: string;
  observations?: string;
  paymentProofUrl?: string;
  kommoContactId?: string;
  kommoLeadId?: string;
  externalLeadId?: string;
  typeformResponseId?: string;
  leadDate?: string;
  originActionDate?: string;
  submittedAt?: string;
  nationality?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  utmPage?: string;
  utmPage?: string;
  nucleoId?: string;
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
  const { data: nucleos } = useNucleosQuery();
  const { config: utmConfig } = useUtmSettings();
  const isEditing = !!editingEnrollment;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cohortId: cohortId || "",
      studentName: "",
      email: "",
      cpf: "",
      phone: "",
      salesRep: "",
      coSalesRep: "",
      funnelId: "",
      macroOriginId: "",
      microOriginId: "",
      microVariationId: "",
      nanoVariationId: "",
      source: "Outro",
      productName: "Optical Experience",
      paymentAmount: "",
      paymentDetails: "",
      address: "",
      city: "",
      state: "",
      zipcode: "",
      country: "Brasil",
      purchaseDate: "",
      observations: "",
      paymentProofUrl: "",
      kommoContactId: "",
      kommoLeadId: "",
      externalLeadId: "",
      typeformResponseId: "",
      leadDate: "",
      originActionDate: "",
      submittedAt: "",
      nationality: "Brasil",
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      utmContent: "",
      utmTerm: "",
      utmTerm: "",
      utmPage: "",
      nucleoId: "",
    },
  });

  // Hierarchy hooks
  const watchedFunnelId = form.watch("funnelId");
  const watchedMacroOriginId = form.watch("macroOriginId");
  const watchedMicroOriginId = form.watch("microOriginId");
  const watchedMicroVariationId = form.watch("microVariationId");

  const { data: funnels } = useFunnels();
  const { data: macroOrigins } = useMacroOrigins(watchedFunnelId || undefined);
  const { data: microOrigins } = useMicroOrigins(watchedMacroOriginId || undefined);
  const { data: microVariations } = useMicroVariations(watchedMicroOriginId || undefined);
  const { data: nanoVariations } = useNanoVariations(watchedMicroVariationId || undefined);

  // Combine enum sources with custom sources
  const allSources = [
    ...(Constants?.public?.Enums?.enrollment_source || []),
    'Outro'
  ];

  // Load editing data when modal opens
  useEffect(() => {
    if (open && editingEnrollment) {
      form.reset({
        cohortId: editingEnrollment.cohort_id,
        studentName: editingEnrollment.student_name,
        email: editingEnrollment.email,
        cpf: editingEnrollment.cpf || "",
        phone: editingEnrollment.phone || "",
        salesRep: editingEnrollment.sales_rep,
        coSalesRep: editingEnrollment.co_sales_rep || "",
        funnelId: editingEnrollment.funnel_id || "",
        macroOriginId: editingEnrollment.macro_origin_id || "",
        microOriginId: editingEnrollment.micro_origin_id || "",
        microVariationId: editingEnrollment.micro_variation_id || "",
        nanoVariationId: editingEnrollment.nano_variation_id || "",
        source: editingEnrollment.source,
        productName: editingEnrollment.product_name || "Optical Experience",
        paymentAmount: editingEnrollment.payment_amount?.toString() || "",
        paymentDetails: editingEnrollment.payment_details,
        address: editingEnrollment.address || "",
        city: editingEnrollment.city || "",
        state: editingEnrollment.state || "",
        zipcode: editingEnrollment.zipcode || "",
        country: editingEnrollment.country || (editingEnrollment.external_metadata as any)?.nationality || "Brasil",
        purchaseDate: editingEnrollment.purchase_date || "",
        observations: editingEnrollment.observations || "",
        paymentProofUrl: editingEnrollment.payment_proof_url || "",
        kommoContactId: editingEnrollment.kommo_contact_id || "",
        kommoLeadId: editingEnrollment.kommo_lead_id || "",
        externalLeadId: editingEnrollment.external_lead_id || "",
        typeformResponseId: editingEnrollment.typeform_response_id || "",
        leadDate: editingEnrollment.lead_date || "",
        originActionDate: editingEnrollment.origin_action_date || "",
        submittedAt: editingEnrollment.submitted_at || "",
        nationality: (editingEnrollment.external_metadata as any)?.nationality || editingEnrollment.country || "Brasil",
        utmSource: (editingEnrollment.external_metadata as any)?.utm_source || "",
        utmMedium: (editingEnrollment.external_metadata as any)?.utm_medium || "",
        utmCampaign: (editingEnrollment.external_metadata as any)?.utm_campaign || "",
        utmContent: (editingEnrollment.external_metadata as any)?.utm_content || "",
        utmTerm: (editingEnrollment.external_metadata as any)?.utm_term || "",
        utmPage: (editingEnrollment.external_metadata as any)?.utm_page || "",
        nucleoId: editingEnrollment.nucleo_id || "",
      });
    } else if (open && !editingEnrollment) {
      form.reset({
        cohortId: cohortId || "",
        studentName: "",
        email: "",
        cpf: "",
        phone: "",
        salesRep: "",
        coSalesRep: "",
        funnelId: "",
        macroOriginId: "",
        microOriginId: "",
        microVariationId: "",
        nanoVariationId: "",
        source: "Outro",
        productName: "Optical Experience",
        paymentAmount: "",
        paymentDetails: "",
        address: "",
        city: "",
        state: "",
        zipcode: "",
        country: "Brasil",
        purchaseDate: "",
        observations: "",
        paymentProofUrl: "",
        kommoContactId: "",
        kommoLeadId: "",
        externalLeadId: "",
        typeformResponseId: "",
        leadDate: "",
        originActionDate: "",
        submittedAt: "",
        nationality: "Brasil",
        utmSource: "",
        utmMedium: "",
        utmCampaign: "",
        utmContent: "",
        utmTerm: "",
        utmPage: "",
        nucleoId: "",
      });
    }
  }, [open, editingEnrollment, cohortId, form]);

  const handleFormSubmit = async (data: EnrollmentData) => {
    // Apply normalization
    const normalizedCPFResult = normalizeCPF(data.cpf || "");
    const normalizedCPF = normalizedCPFResult.normalized;
    const normalizedZipcode = data.zipcode ? normalizeZipcode(data.zipcode) : undefined;
    const normalizedAddress = data.address ? normalizeAddress(data.address) : undefined;
    const normalizedPurchaseDate = data.purchaseDate ? normalizeDate(data.purchaseDate) : undefined;
    const normalizedLeadDate = data.leadDate ? normalizeDate(data.leadDate) : undefined;
    const normalizedOriginActionDate = data.originActionDate ? normalizeDate(data.originActionDate) : undefined;
    const normalizedSubmittedAt = data.submittedAt ? normalizeDate(data.submittedAt) : undefined;

    // Check for overbooking
    const selectedCohort = cohorts?.find(c => c.id === data.cohortId);
    const isFull = (selectedCohort?.stats?.available_spots || 0) <= 0;
    const status = isFull ? 'waiting_list' : 'active';

    const enrollmentData: any = {
      cohort_id: data.cohortId,
      student_name: data.studentName,
      email: data.email.toLowerCase(),
      cpf: normalizedCPF || null,
      phone: data.phone || null,
      sales_rep: data.salesRep,
      co_sales_rep: data.coSalesRep || null,
      funnel_id: data.funnelId || null,
      macro_origin_id: data.macroOriginId || null,
      micro_origin_id: data.microOriginId || null,
      micro_variation_id: data.microVariationId || null,
      nano_variation_id: data.nanoVariationId || null,
      source: data.source as any,
      product_name: data.productName || "Optical Experience",
      payment_amount: data.paymentAmount ? parseFloat(data.paymentAmount) : null,
      payment_details: data.paymentDetails,
      financial_status: "pending" as const,
      contract_status: "pending" as const,
      address: normalizedAddress || null,
      city: data.city || null,
      state: data.state || null,
      zipcode: normalizedZipcode || null,
      country: data.country || "Brasil",
      purchase_date: normalizedPurchaseDate || null,
      observations: data.observations || null,
      payment_proof_url: data.paymentProofUrl || null,
      kommo_contact_id: data.kommoContactId || null,
      kommo_lead_id: data.kommoLeadId || null,
      external_lead_id: data.externalLeadId || null,
      typeform_response_id: data.typeformResponseId || null,
      lead_date: normalizedLeadDate || null,
      origin_action_date: normalizedOriginActionDate || null,
      submitted_at: normalizedSubmittedAt || null,
      nucleo_id: data.nucleoId || null,
      external_metadata: {
        nationality: data.country || data.nationality || "Brasil",
        status: status, // Set status based on overbooking
        overbooked: isFull,
        utm_source: data.utmSource,
        utm_medium: data.utmMedium,
        utm_campaign: data.utmCampaign,
        utm_content: data.utmContent,
        utm_term: data.utmTerm,
        utm_page: data.utmPage,
      },
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
            onOpenChange(false);
            onSubmit(data);
          },
        }
      );
    } else {
      createEnrollment.mutate(enrollmentData, {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
          onSubmit(data);
        },
      });
    }
  };

  return (
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
                render={({ field }) => {
                  const selectedCohort = cohorts?.find(c => c.id === field.value);
                  const isFull = (selectedCohort?.stats?.available_spots || 0) <= 0;

                  return (
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
                      {isFull && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-yellow-600 text-sm mt-2">
                          <strong>Atenção:</strong> Esta turma está lotada. O aluno será adicionado à <strong>Lista de Espera</strong>.
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
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
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="000.000.000-00" />
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
                        <Input {...field} placeholder="(00) 00000-0000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>País</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? COUNTRIES.find(
                                  (country) => country.name === field.value
                                )?.name
                                : "Selecione o país"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0 z-[100]">
                          <Command>
                            <CommandInput placeholder="Buscar país..." />
                            <CommandList>
                              <CommandEmpty>Nenhum país encontrado.</CommandEmpty>
                              <CommandGroup>
                                {COUNTRIES.map((country) => (
                                  <CommandItem
                                    value={country.name}
                                    key={country.code}
                                    onSelect={() => {
                                      form.setValue("country", country.name);
                                      form.setValue("nationality", country.name);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        country.name === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {country.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Venda e Produto */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Venda e Produto</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produto</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                        <MoneyInput
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="R$ 0,00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salesRep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendedor *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o vendedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Array.isArray(salesReps) ? salesReps : []).filter(r => r.active).map((rep) => (
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
                  name="coSalesRep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Co-vendedor (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o co-vendedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Array.isArray(salesReps) ? salesReps : []).filter(r => r.active).map((rep) => (
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
                  name="nucleoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Núcleo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o núcleo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {nucleos?.map((nucleo) => (
                            <SelectItem key={nucleo.id} value={nucleo.id}>
                              {nucleo.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Hierarquia de Origem */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Hierarquia de Origem</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="funnelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funil de Venda</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue("macroOriginId", "");
                          form.setValue("microOriginId", "");
                          form.setValue("microVariationId", "");
                          form.setValue("nanoVariationId", "");
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o funil" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {funnels?.map((f) => (
                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="macroOriginId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Macro Origem</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue("microOriginId", "");
                          form.setValue("microVariationId", "");
                          form.setValue("nanoVariationId", "");
                          const macro = macroOrigins?.find(m => m.id === val);
                          if (macro) form.setValue("source", macro.name);
                        }}
                        value={field.value}
                        disabled={!watchedFunnelId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a macro origem" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {macroOrigins?.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="microOriginId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Micro Origem</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue("microVariationId", "");
                          form.setValue("nanoVariationId", "");
                        }}
                        value={field.value}
                        disabled={!watchedMacroOriginId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a micro origem" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {microOrigins?.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="microVariationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variação de Origem</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue("nanoVariationId", "");
                        }}
                        value={field.value}
                        disabled={!watchedMicroOriginId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a variação" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {microVariations?.map((v) => (
                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
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
                      <FormLabel>Origem (Legado/Fallback) *</FormLabel>
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
              </div>
            </div>

            {/* Datas e Identificadores */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Datas e Identificadores</h3>
              <div className="grid grid-cols-2 gap-4">
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
                <FormField
                  control={form.control}
                  name="leadDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Chegada do Lead</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="originActionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Ação de Origem</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="submittedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Submissão</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="externalLeadId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID do Lead Externo (CRM)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ID do CRM externo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Condições e Observações */}
            <div className="space-y-4">
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

            {/* Rastreamento (UTM) */}
            {(utmConfig.utm_source || utmConfig.utm_medium || utmConfig.utm_campaign || utmConfig.utm_content || utmConfig.utm_term || utmConfig.utm_page) && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Rastreamento (UTM)</h3>
                <div className="grid grid-cols-2 gap-4">
                  {utmConfig.utm_source && (
                    <FormField
                      control={form.control}
                      name="utmSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UTM Source</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ex: google, newsletter" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {utmConfig.utm_medium && (
                    <FormField
                      control={form.control}
                      name="utmMedium"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UTM Medium</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ex: cpc, banner" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {utmConfig.utm_campaign && (
                    <FormField
                      control={form.control}
                      name="utmCampaign"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UTM Campaign</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ex: lancamento_verao" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {utmConfig.utm_content && (
                    <FormField
                      control={form.control}
                      name="utmContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UTM Content</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ex: logolink" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {utmConfig.utm_term && (
                    <FormField
                      control={form.control}
                      name="utmTerm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UTM Term</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ex: palavras-chave" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {utmConfig.utm_page && (
                    <FormField
                      control={form.control}
                      name="utmPage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UTM Page</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ex: landing-page-v1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            )}

            {/* IDs de Integração */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Integração</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="kommoContactId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">ID do Contato (Kommo)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Opcional" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              </div>
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
  );
};
