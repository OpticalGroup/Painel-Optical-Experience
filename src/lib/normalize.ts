/**
 * Normalization utilities for data import
 * Cleans and standardizes data from various sources (CSV, forms, etc.)
 */

import { formatCPF } from './cpf';

/**
 * Normalize enrollment source to match database enum values
 * Maps variations and common misspellings to official source names
 */
export const normalizeEnrollmentSource = (value: string): string => {
  if (!value) return 'Outro';
  
  const normalized = value.trim();
  
  // Exact matches from official spreadsheet (case-insensitive)
  const exactMatches: Record<string, string> = {
    'instagram bio': 'Instagram Bio',
    'instagram manychat': 'Instagram Manychat',
    'web - downsell': 'WEB - Downsell',
    'área de membros fots': 'Área de Membros FOTS',
    'area de membros fots': 'Área de Membros FOTS',
    'tráfego pago (público frio)': 'Tráfego Pago (Público Frio)',
    'trafego pago (publico frio)': 'Tráfego Pago (Público Frio)',
    'tráfego pago (público quente)': 'Tráfego Pago (Público Quente)',
    'trafego pago (publico quente)': 'Tráfego Pago (Público Quente)',
    'api remarketing': 'API Remarketing',
    'aluno mentoria': 'Aluno Mentoria',
    'programa de indicação': 'Programa de Indicação',
    'programa de indicacao': 'Programa de Indicação',
    'não rastreada': 'Não Rastreada',
    'nao rastreada': 'Não Rastreada',
  };
  
  const lowerValue = normalized.toLowerCase();
  
  // Check exact matches first
  if (exactMatches[lowerValue]) {
    return exactMatches[lowerValue];
  }
  
  // Fallback to generic categories for partial matches
  if (lowerValue.includes('instagram') || lowerValue.includes('insta') || lowerValue.includes('ig')) {
    if (lowerValue.includes('bio')) return 'Instagram Bio';
    if (lowerValue.includes('manychat') || lowerValue.includes('bot')) return 'Instagram Manychat';
    return 'Instagram';
  }
  
  if (lowerValue.includes('facebook') || lowerValue.includes('fb') || lowerValue.includes('face')) {
    return 'Facebook';
  }
  
  if (lowerValue.includes('indicacao') || lowerValue.includes('indicação') || lowerValue.includes('indica')) {
    if (lowerValue.includes('programa')) return 'Programa de Indicação';
    return 'Indicação';
  }
  
  if (lowerValue.includes('trafego') || lowerValue.includes('tráfego') || lowerValue.includes('ads') || lowerValue.includes('pago')) {
    if (lowerValue.includes('frio')) return 'Tráfego Pago (Público Frio)';
    if (lowerValue.includes('quente')) return 'Tráfego Pago (Público Quente)';
    return 'Tráfego Pago';
  }
  
  if (lowerValue.includes('direto') || lowerValue.includes('direct') || lowerValue.includes('organico') || lowerValue.includes('orgânico')) {
    return 'Direto';
  }
  
  if (lowerValue.includes('mentoria')) {
    return 'Aluno Mentoria';
  }
  
  if (lowerValue.includes('fots')) {
    return 'Área de Membros FOTS';
  }
  
  if (lowerValue.includes('remarketing') || lowerValue.includes('api')) {
    return 'API Remarketing';
  }
  
  if (lowerValue.includes('downsell') || lowerValue.includes('web')) {
    return 'WEB - Downsell';
  }
  
  if (lowerValue.includes('rastreada') || lowerValue.includes('nao rastreada') || lowerValue.includes('não rastreada')) {
    return 'Não Rastreada';
  }
  
  // Default fallback
  return 'Outro';
};

/**
 * Normalize cohort name to standard format
 * Examples:
 * - "Setembro", "2025" -> "Turma de Setembro de 2025"
 * - "Setembro" -> "Turma de Setembro de 2025" (using current year + 1 if month passed)
 * - "Janeiro" -> "Turma de Janeiro de 2026"
 */
export const normalizeCohortName = (value: string, year?: string, referenceDate?: Date): string => {
  if (!value) return value;
  
  const trimmed = value.trim();
  
  // If already in correct format "Turma de [Mês] de [Ano]", return as-is
  if (trimmed.match(/^Turma\s+de\s+[A-Za-zç]+\s+de\s+\d{4}$/i)) {
    return trimmed;
  }
  
  // Month mapping (Portuguese)
  const monthMap: Record<string, number> = {
    'janeiro': 1,
    'fevereiro': 2,
    'março': 3,
    'marco': 3,
    'abril': 4,
    'maio': 5,
    'junho': 6,
    'julho': 7,
    'agosto': 8,
    'setembro': 9,
    'outubro': 10,
    'novembro': 11,
    'dezembro': 12,
  };
  
  const lowerValue = trimmed.toLowerCase();
  const today = referenceDate || new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  
  // Check if value is a month name
  for (const [monthName, monthNumber] of Object.entries(monthMap)) {
    if (lowerValue === monthName || lowerValue.includes(monthName)) {
      // Determine year: if provided use it, otherwise calculate
      let targetYear = year ? parseInt(year.replace(/\D/g, '')) : null;
      
      if (!targetYear || isNaN(targetYear)) {
        targetYear = monthNumber < currentMonth ? currentYear + 1 : currentYear;
      }
      
      // Capitalize month name
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      
      return `Turma de ${capitalizedMonth} de ${targetYear}`;
    }
  }
  
  // If not a recognized pattern, but year is provided, combine them
  if (year && !trimmed.includes(year)) {
    const cleanYear = year.replace(/\D/g, '');
    if (cleanYear) {
      return trimmed.startsWith('Turma ') 
        ? `${trimmed} de ${cleanYear}` 
        : `Turma de ${trimmed} de ${cleanYear}`;
    }
  }
  
  // If not a recognized pattern, return original with "Turma" prefix
  return trimmed.startsWith('Turma ') ? trimmed : `Turma de ${trimmed}`;
};

/**
 * Normalize phone number to clean format (digits only)
 * Removes: +55, country code, spaces, parentheses, hyphens
 * Examples:
 * - "+557191226770" -> "7191226770"
 * - "(71) 99122-6770" -> "71991226770"
 * - "5571988222225" -> "71988222225"
 */
export const normalizePhone = (value: string): string => {
  if (!value) return '';
  
  // Remove all non-digit characters
  let cleaned = value.replace(/\D/g, '');
  
  // Remove country code (55) if present at start
  if (cleaned.startsWith('55') && cleaned.length > 11) {
    cleaned = cleaned.substring(2);
  }
  
  // Validate: should have 10 or 11 digits (with area code)
  if (cleaned.length < 10 || cleaned.length > 11) {
    return value; // Return original if doesn't match expected format
  }
  
  return cleaned;
};

/**
 * Format phone for display (XX) XXXXX-XXXX
 */
export const formatPhone = (value: string): string => {
  const cleaned = normalizePhone(value);
  
  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  }
  
  return value;
};

/**
 * Normalize zipcode (CEP) to clean format (digits only)
 * Removes: dots, hyphens, spaces
 * Examples:
 * - "41.820-700" -> "41820700"
 * - "41820-700" -> "41820700"
 * - "000" -> "" (invalid)
 * - "não informou" -> ""
 */
export const normalizeZipcode = (value: string): string => {
  if (!value) return '';
  
  // Handle special invalid cases
  const lowerValue = value.toLowerCase().trim();
  if (lowerValue === 'não informou' || lowerValue === 'nao informou' || lowerValue === '000' || lowerValue === '0') {
    return '';
  }
  
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '');
  
  // Validate: should have exactly 8 digits for Brazilian CEP
  if (cleaned.length !== 8) {
    return ''; // Return empty if invalid
  }
  
  return cleaned;
};

/**
 * Format zipcode for display (XXXXX-XXX)
 */
export const formatZipcode = (value: string): string => {
  const cleaned = normalizeZipcode(value);
  
  if (cleaned.length === 8) {
    return `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
  }
  
  return value;
};

/**
 * Parse payment status from text indicators
 * Looks for keywords: "Sim", "Não", "pago", "pendente"
 * Examples:
 * - "Sim" -> "paid"
 * - "Não" -> "pending"
 * - "" -> "pending"
 */
export const parsePaymentStatus = (value: string): 'paid' | 'pending' => {
  if (!value) return 'pending';
  
  const lowerValue = value.toLowerCase().trim();
  
  // Direct matches
  if (lowerValue === 'sim' || lowerValue === 'yes' || lowerValue === 'pago' || lowerValue === 'paid') {
    return 'paid';
  }
  
  if (lowerValue === 'não' || lowerValue === 'nao' || lowerValue === 'no' || lowerValue === 'pendente' || lowerValue === 'pending') {
    return 'pending';
  }
  
  // Keyword search in longer text
  if (lowerValue.includes('pago') || lowerValue.includes('paid') || lowerValue.includes('confirmado')) {
    return 'paid';
  }
  
  // Default to pending if unclear
  return 'pending';
};

/**
 * Parse contract status from text
 * Looks for keywords: "assinado", "signed"
 */
export const parseContractStatus = (value: string): 'signed' | 'pending' => {
  if (!value) return 'pending';
  
  const lowerValue = value.toLowerCase().trim();
  
  if (lowerValue.includes('assinado') || lowerValue.includes('signed') || lowerValue.includes('sim')) {
    return 'signed';
  }
  
  return 'pending';
};

/**
 * Normalize date from Brazilian format (DD/MM/YYYY) to ISO (YYYY-MM-DD)
 * Examples:
 * - "06/08/2025" -> "2025-08-06"
 * - "2025-08-06" -> "2025-08-06" (already ISO)
 */
export const normalizeDate = (value: string): string | null => {
  if (!value) return null;
  
  const trimmed = value.trim();
  
  // Check if already in ISO format (YYYY-MM-DD)
  if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return trimmed;
  }
  
  // Parse Brazilian format (DD/MM/YYYY)
  const brFormatMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brFormatMatch) {
    const [, day, month, year] = brFormatMatch;
    return `${year}-${month}-${day}`;
  }
  
  // Try parsing with Date (handles various formats)
  try {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Invalid date
  }
  
  return null;
};

/**
 * Extract numeric value from currency string
 * Examples:
 * - "R$7.500" -> 7500
 * - "7500" -> 7500
 * - "R$ 8.500,00" -> 8500
 */
export const parseMoneyValue = (value: string | number): number | null => {
  if (typeof value === 'number') return value;
  if (!value) return null;
  
  // Remove currency symbols and normalize
  let cleaned = value.toString()
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
    .trim();
  
  // Handle Brazilian format (1.500,00 -> 1500.00)
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }
  
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? null : parsed;
};

/**
 * Normalize address - remove extra spaces and trim
 */
export const normalizeAddress = (value: string): string => {
  if (!value) return '';
  
  return value
    .trim()
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/,\s*,/g, ',') // Remove double commas
    .trim();
};
