/**
 * Remove all non-numeric characters from CPF
 */
export const cleanCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};

/**
 * Validate CPF using the official algorithm
 */
export const isValidCPF = (cpf: string): boolean => {
  const cleaned = cleanCPF(cpf);
  
  // Must have exactly 11 digits
  if (cleaned.length !== 11) {
    return false;
  }
  
  // Check for known invalid CPFs (all digits the same)
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(cleaned.charAt(9))) {
    return false;
  }
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(cleaned.charAt(10))) {
    return false;
  }
  
  return true;
};

/**
 * Normalize and validate CPF
 * Returns cleaned CPF if valid, or null if invalid
 */
export const normalizeCPF = (cpf: string): { valid: boolean; normalized: string; error?: string } => {
  const cleaned = cleanCPF(cpf);
  
  if (!cleaned) {
    return { valid: false, normalized: '', error: 'CPF vazio' };
  }
  
  if (cleaned.length !== 11) {
    return { valid: false, normalized: cleaned, error: `CPF deve ter 11 dígitos (tem ${cleaned.length})` };
  }
  
  if (!isValidCPF(cleaned)) {
    return { valid: false, normalized: cleaned, error: 'CPF inválido' };
  }
  
  return { valid: true, normalized: cleaned };
};

/**
 * Format CPF as XXX.XXX.XXX-XX
 */
export const formatCPF = (cpf: string): string => {
  const cleaned = cleanCPF(cpf);
  if (cleaned.length !== 11) return cpf;
  
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};
