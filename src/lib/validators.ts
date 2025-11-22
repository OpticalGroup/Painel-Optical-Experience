import { normalizeCPF } from './cpf';
import { normalizePhone, normalizeZipcode } from './normalize';

export type ValidationLevel = 'error' | 'warning' | 'info';

export interface ValidationResult {
  valid: boolean;
  level: ValidationLevel;
  message: string;
  field: string;
}

export interface RowValidation {
  rowIndex: number;
  validations: ValidationResult[];
  hasErrors: boolean;
  hasWarnings: boolean;
}

// Validação de email
export const validateEmail = (email: string): ValidationResult => {
  if (!email || !email.trim()) {
    return {
      valid: false,
      level: 'error',
      message: 'Email é obrigatório',
      field: 'email',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      level: 'error',
      message: 'Formato de email inválido',
      field: 'email',
    };
  }

  return {
    valid: true,
    level: 'info',
    message: 'Email válido',
    field: 'email',
  };
};

// Validação de CPF
export const validateCPF = (cpf: string): ValidationResult => {
  if (!cpf || !cpf.trim()) {
    return {
      valid: false,
      level: 'error',
      message: 'CPF é obrigatório',
      field: 'cpf',
    };
  }

  const cpfResult = normalizeCPF(cpf);
  
  if (!cpfResult.valid) {
    return {
      valid: false,
      level: 'warning',
      message: cpfResult.error || 'CPF inválido',
      field: 'cpf',
    };
  }

  // Verifica se o CPF foi normalizado (tinha formatação)
  const originalCleaned = cpf.replace(/\D/g, '');
  if (originalCleaned !== cpf) {
    return {
      valid: true,
      level: 'warning',
      message: 'CPF foi normalizado automaticamente',
      field: 'cpf',
    };
  }

  return {
    valid: true,
    level: 'info',
    message: 'CPF válido',
    field: 'cpf',
  };
};

// Validação de telefone
export const validatePhone = (phone?: string): ValidationResult | null => {
  if (!phone || !phone.trim()) {
    return null; // Não reportar warning para telefones vazios
  }

  const normalized = normalizePhone(phone);
  
  if (!normalized) {
    return {
      valid: false,
      level: 'warning',
      message: 'Formato de telefone inválido (use DDD + número)',
      field: 'phone',
    };
  }

  if (normalized.length < 10 || normalized.length > 11) {
    return {
      valid: false,
      level: 'warning',
      message: 'Telefone deve ter 10 ou 11 dígitos',
      field: 'phone',
    };
  }

  return null; // Telefone válido, não precisa reportar
};

// Validação de nome
export const validateName = (name: string): ValidationResult => {
  if (!name || !name.trim()) {
    return {
      valid: false,
      level: 'error',
      message: 'Nome é obrigatório',
      field: 'student_name',
    };
  }

  if (name.trim().length < 3) {
    return {
      valid: false,
      level: 'error',
      message: 'Nome muito curto (mínimo 3 caracteres)',
      field: 'student_name',
    };
  }

  const nameParts = name.trim().split(/\s+/);
  if (nameParts.length < 2) {
    return {
      valid: true,
      level: 'warning',
      message: 'Nome completo recomendado (nome e sobrenome)',
      field: 'student_name',
    };
  }

  return {
    valid: true,
    level: 'info',
    message: 'Nome válido',
    field: 'student_name',
  };
};

// Validação de vendedor
export const validateSalesRep = (salesRep: string): ValidationResult => {
  if (!salesRep || !salesRep.trim()) {
    return {
      valid: false,
      level: 'error',
      message: 'Vendedor é obrigatório',
      field: 'sales_rep',
    };
  }

  return {
    valid: true,
    level: 'info',
    message: 'Vendedor válido',
    field: 'sales_rep',
  };
};

// Validação de origem/source
export const validateSource = (source: string): ValidationResult => {
  if (!source || !source.trim()) {
    return {
      valid: false,
      level: 'error',
      message: 'Origem é obrigatória',
      field: 'source',
    };
  }

  return {
    valid: true,
    level: 'info',
    message: 'Origem válida',
    field: 'source',
  };
};

// Validação de valor monetário
export const validatePaymentAmount = (amount?: number): ValidationResult | null => {
  if (!amount || amount === 0) {
    return null; // Não reportar warning para valores vazios
  }

  if (amount < 0) {
    return {
      valid: false,
      level: 'warning',
      message: 'Valor não pode ser negativo',
      field: 'payment_amount',
    };
  }

  if (amount > 100000) {
    return {
      valid: true,
      level: 'warning',
      message: 'Valor muito alto - verifique se está correto',
      field: 'payment_amount',
    };
  }

  return null; // Valor válido, não precisa reportar
};

// Validação de CEP
export const validateZipcode = (zipcode?: string): ValidationResult | null => {
  if (!zipcode || !zipcode.trim()) {
    return null; // Não reportar warning para CEPs vazios
  }

  const normalized = normalizeZipcode(zipcode);
  
  if (!normalized || normalized.length !== 8) {
    return {
      valid: false,
      level: 'warning',
      message: 'CEP inválido (deve ter 8 dígitos)',
      field: 'zipcode',
    };
  }

  return null; // CEP válido, não precisa reportar
};

// Validação de data
export const validateDate = (dateStr?: string, fieldName: string = 'data'): ValidationResult | null => {
  if (!dateStr || !dateStr.trim()) {
    return null; // Não reportar warning para campos de data vazios
  }

  // Tentar parse da data
  const date = new Date(dateStr);
  
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      level: 'warning',
      message: `Formato de ${fieldName} inválido`,
      field: fieldName,
    };
  }

  // Verificar se a data não é muito no futuro
  const maxFutureDate = new Date();
  maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 2);
  
  if (date > maxFutureDate) {
    return {
      valid: true,
      level: 'warning',
      message: `${fieldName} muito no futuro - verifique se está correto`,
      field: fieldName,
    };
  }

  // Verificar se a data não é muito no passado
  const minPastDate = new Date('2020-01-01');
  
  if (date < minPastDate) {
    return {
      valid: true,
      level: 'warning',
      message: `${fieldName} muito no passado - verifique se está correto`,
      field: fieldName,
    };
  }

  return null; // Data válida, não precisa reportar
};

// Validação de estado (UF)
export const validateState = (state?: string): ValidationResult | null => {
  if (!state || !state.trim()) {
    return null; // Não reportar warning para estados vazios
  }

  const validStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const normalizedState = state.trim().toUpperCase();

  if (!validStates.includes(normalizedState)) {
    return {
      valid: false,
      level: 'warning',
      message: 'Sigla de estado inválida (ex: SP, RJ, BA)',
      field: 'state',
    };
  }

  return null; // Estado válido, não precisa reportar
};

// Validação completa de uma linha
export const validateRow = (row: any, rowIndex: number): RowValidation => {
  const validations: ValidationResult[] = [];

  // Validações obrigatórias
  validations.push(validateName(row.student_name));
  validations.push(validateEmail(row.email));
  validations.push(validateCPF(row.cpf));
  validations.push(validateSalesRep(row.sales_rep));
  validations.push(validateSource(row.source));

  // Validações opcionais (se os campos existirem)
  const phoneValidation = validatePhone(row.phone);
  if (phoneValidation) validations.push(phoneValidation);

  const amountValidation = validatePaymentAmount(row.payment_amount);
  if (amountValidation) validations.push(amountValidation);

  const zipcodeValidation = validateZipcode(row.zipcode);
  if (zipcodeValidation) validations.push(zipcodeValidation);

  const stateValidation = validateState(row.state);
  if (stateValidation) validations.push(stateValidation);

  const purchaseDateValidation = validateDate(row.purchase_date, 'Data de compra');
  if (purchaseDateValidation) validations.push(purchaseDateValidation);

  const leadDateValidation = validateDate(row.lead_date, 'Data do lead');
  if (leadDateValidation) validations.push(leadDateValidation);

  // Verificar se há erros ou avisos
  const hasErrors = validations.some(v => v.level === 'error' && !v.valid);
  const hasWarnings = validations.some(v => v.level === 'warning');

  return {
    rowIndex,
    validations: validations.filter(v => !v.valid || v.level === 'warning' || v.level === 'error'),
    hasErrors,
    hasWarnings,
  };
};
