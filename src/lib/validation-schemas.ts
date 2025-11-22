import { z } from "zod";

/**
 * FASE 4: VALIDAÇÃO DE INPUT - Schemas Zod para todas as entidades
 * Previne injection attacks e garante integridade dos dados
 */

// Regex patterns
const CPF_REGEX = /^\d{11}$/;
const PHONE_REGEX = /^\+?[\d\s\-\(\)]{10,20}$/;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;

// Enrollment validation
export const enrollmentSchema = z.object({
  student_name: z.string()
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo"),
  
  email: z.string()
    .trim()
    .toLowerCase()
    .regex(EMAIL_REGEX, "Email inválido")
    .max(255, "Email muito longo"),
  
  cpf: z.string()
    .trim()
    .regex(CPF_REGEX, "CPF deve conter exatamente 11 dígitos"),
  
  phone: z.string()
    .trim()
    .regex(PHONE_REGEX, "Telefone inválido")
    .optional()
    .nullable(),
  
  address: z.string()
    .trim()
    .max(500, "Endereço muito longo")
    .optional()
    .nullable(),
  
  city: z.string()
    .trim()
    .max(100, "Cidade muito longa")
    .optional()
    .nullable(),
  
  state: z.string()
    .trim()
    .length(2, "Estado deve ter 2 caracteres")
    .toUpperCase()
    .optional()
    .nullable(),
  
  zipcode: z.string()
    .trim()
    .regex(/^\d{8}$/, "CEP deve ter 8 dígitos")
    .optional()
    .nullable(),
  
  payment_amount: z.number()
    .min(0, "Valor não pode ser negativo")
    .max(1000000, "Valor muito alto")
    .optional()
    .nullable(),
  
  payment_details: z.string()
    .trim()
    .min(1, "Detalhes de pagamento obrigatórios")
    .max(2000, "Detalhes muito longos"),
  
  sales_rep: z.string()
    .trim()
    .min(1, "Vendedor obrigatório")
    .max(100, "Nome do vendedor muito longo"),
  
  cohort_id: z.string().uuid("ID de turma inválido"),
  
  observations: z.string()
    .trim()
    .max(1000, "Observações muito longas")
    .optional()
    .nullable(),
  
  payment_proof_url: z.string()
    .url("URL inválida")
    .max(500, "URL muito longa")
    .optional()
    .nullable(),
  
  purchase_date: z.string()
    .optional()
    .nullable(),
  
  lead_date: z.string()
    .optional()
    .nullable(),
});

// Cohort validation
export const cohortSchema = z.object({
  name: z.string()
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo"),
  
  course_id: z.string().uuid("ID de curso inválido"),
  
  year: z.number()
    .int("Ano deve ser inteiro")
    .min(2020, "Ano inválido")
    .max(2100, "Ano inválido"),
  
  start_date: z.string()
    .refine((date) => !isNaN(Date.parse(date)), "Data de início inválida"),
  
  end_date: z.string()
    .refine((date) => !isNaN(Date.parse(date)), "Data de fim inválida")
    .optional()
    .nullable(),
  
  location: z.string()
    .trim()
    .min(2, "Localização muito curta")
    .max(200, "Localização muito longa"),
  
  capacity: z.number()
    .int("Capacidade deve ser inteira")
    .min(1, "Capacidade mínima é 1")
    .max(1000, "Capacidade máxima é 1000"),
});

// Sales Representative validation
export const salesRepSchema = z.object({
  name: z.string()
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo"),
  
  email: z.string()
    .trim()
    .toLowerCase()
    .regex(EMAIL_REGEX, "Email inválido")
    .max(255, "Email muito longo")
    .optional()
    .nullable(),
  
  phone: z.string()
    .trim()
    .regex(PHONE_REGEX, "Telefone inválido")
    .optional()
    .nullable(),
});

// Organization Settings validation (Whitelabel)
export const organizationSettingsSchema = z.object({
  organization_name: z.string()
    .trim()
    .min(2, "Nome muito curto")
    .max(100, "Nome muito longo"),
  
  primary_color: z.string()
    .regex(HEX_COLOR_REGEX, "Cor primária deve estar no formato #RRGGBB"),
  
  secondary_color: z.string()
    .regex(HEX_COLOR_REGEX, "Cor secundária deve estar no formato #RRGGBB"),
  
  accent_color: z.string()
    .regex(HEX_COLOR_REGEX, "Cor de destaque deve estar no formato #RRGGBB"),
  
  background_color: z.string()
    .regex(HEX_COLOR_REGEX, "Cor de fundo deve estar no formato #RRGGBB"),
  
  foreground_color: z.string()
    .regex(HEX_COLOR_REGEX, "Cor do texto deve estar no formato #RRGGBB"),
  
  custom_domain: z.string()
    .trim()
    .regex(DOMAIN_REGEX, "Domínio inválido")
    .max(253, "Domínio muito longo")
    .optional()
    .nullable()
    .or(z.literal("")),
});

// User Profile validation
export const profileSchema = z.object({
  full_name: z.string()
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo")
    .optional()
    .nullable(),
  
  phone: z.string()
    .trim()
    .regex(PHONE_REGEX, "Telefone inválido")
    .optional()
    .nullable(),
});

// CSV Import validation
export const csvImportSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, "Arquivo deve ter no máximo 10MB")
    .refine((file) => file.type === "text/csv" || file.name.endsWith(".csv"), "Arquivo deve ser CSV"),
  
  cohort_id: z.string().uuid("ID de turma inválido").optional(),
});

// Export types for TypeScript
export type EnrollmentInput = z.infer<typeof enrollmentSchema>;
export type CohortInput = z.infer<typeof cohortSchema>;
export type SalesRepInput = z.infer<typeof salesRepSchema>;
export type OrganizationSettingsInput = z.infer<typeof organizationSettingsSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type CsvImportInput = z.infer<typeof csvImportSchema>;
