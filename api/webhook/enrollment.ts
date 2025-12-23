import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper functions for data normalization
const normalizeCPF = (cpf: string): { valid: boolean; normalized: string; error?: string } => {
  const cleaned = cpf.replace(/\D/g, '');
  if (!cleaned) return { valid: false, normalized: '', error: 'CPF vazio' };
  if (cleaned.length !== 11) return { valid: false, normalized: cleaned, error: `CPF deve ter 11 dígitos` };
  return { valid: true, normalized: cleaned };
};

const normalizeDate = (value: string): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) return trimmed;
  const brFormatMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brFormatMatch) {
    const [, day, month, year] = brFormatMatch;
    return `${year}-${month}-${day}`;
  }
  try {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {}
  return null;
};

const parseMoneyValue = (value: string | number): number | null => {
  if (typeof value === 'number') return value;
  if (!value) return null;
  let cleaned = value.toString()
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
    .trim();
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

const normalizePhone = (value: string): string => {
  if (!value) return '';
  let cleaned = value.replace(/\D/g, '');
  if (cleaned.startsWith('55') && cleaned.length > 11) {
    cleaned = cleaned.substring(2);
  }
  return cleaned.length >= 10 && cleaned.length <= 11 ? cleaned : value;
};

const normalizeZipcode = (value: string): string => {
  if (!value) return '';
  const lowerValue = value.toLowerCase().trim();
  if (lowerValue === 'não informou' || lowerValue === 'nao informou' || lowerValue === '000' || lowerValue === '0') {
    return '';
  }
  const cleaned = value.replace(/\D/g, '');
  return cleaned.length === 8 ? cleaned : '';
};

const normalizeCohortName = (value: string): string => {
  if (!value) return value;
  const trimmed = value.trim();
  if (trimmed.match(/^Turma\s+[A-Za-zç]+\s+\d{4}$/i)) return trimmed;
  const monthMap: Record<string, number> = {
    'janeiro': 1, 'fevereiro': 2, 'março': 3, 'marco': 3,
    'abril': 4, 'maio': 5, 'junho': 6, 'julho': 7,
    'agosto': 8, 'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12,
  };
  const lowerValue = trimmed.toLowerCase();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  for (const [monthName, monthNumber] of Object.entries(monthMap)) {
    if (lowerValue === monthName || lowerValue.includes(monthName)) {
      const targetYear = monthNumber < currentMonth ? currentYear + 1 : currentYear;
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      return `Turma ${capitalizedMonth} ${targetYear}`;
    }
  }
  return trimmed.startsWith('Turma ') ? trimmed : `Turma ${trimmed}`;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://tboxsndhlnomvwnqveat.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (!supabaseKey) {
      return res.status(500).json({ error: 'Supabase configuration missing' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const payload = req.body;
    console.log('Webhook received:', JSON.stringify(payload, null, 2));

    // Validate webhook secret
    const webhookSecret = payload.webhook_secret;
    if (!webhookSecret) {
      return res.status(401).json({ error: 'webhook_secret is required' });
    }

    // Verify webhook secret from integration_settings
    const { data: settings } = await supabase
      .from('integration_settings')
      .select('webhook_secret')
      .eq('system_name', 'n8n')
      .single();

    if (settings?.webhook_secret && webhookSecret !== settings.webhook_secret) {
      return res.status(401).json({ error: 'Invalid webhook_secret' });
    }

    // Validate payload structure
    if (!payload.records || !Array.isArray(payload.records) || payload.records.length === 0) {
      return res.status(400).json({ error: 'records array is required and must not be empty' });
    }

    const results: Array<{
      success: boolean;
      action?: string;
      enrollment_id?: string;
      student_name?: string;
      error?: string;
      record?: string;
    }> = [];

    // Process each record
    for (const record of payload.records) {
      try {
        // Find cohort by identifier (name)
        const cohortIdentifier = normalizeCohortName(record.cohort_identifier || '');
        if (!cohortIdentifier) {
          results.push({
            success: false,
            error: 'cohort_identifier is required',
            record: record.student_name || 'Unknown',
          });
          continue;
        }

        // Search for cohort by name (exact match first, then partial)
        let cohortId: string | null = null;
        
        // Try exact match first
        const { data: exactMatch } = await supabase
          .from('cohorts')
          .select('id, name')
          .ilike('name', cohortIdentifier)
          .limit(1)
          .maybeSingle();

        if (exactMatch) {
          cohortId = exactMatch.id;
        } else {
          // Try partial match
          const { data: cohorts } = await supabase
            .from('cohorts')
            .select('id, name')
            .ilike('name', `%${cohortIdentifier.replace('Turma ', '')}%`)
            .limit(1);

          if (cohorts && cohorts.length > 0) {
            cohortId = cohorts[0].id;
          }
        }

        // If cohort not found, create it automatically
        if (!cohortId) {
          console.log(`Cohort not found, creating automatically: ${cohortIdentifier}`);
          
          // Get default course (Optical Experience) or first available course
          const { data: courses } = await supabase
            .from('courses')
            .select('id, name')
            .or('name.ilike.%Optical Experience%,name.ilike.%Optical%')
            .limit(1);
          
          let courseId: string | null = null;
          
          if (courses && courses.length > 0) {
            courseId = courses[0].id;
          } else {
            // Get any course as fallback
            const { data: anyCourse } = await supabase
              .from('courses')
              .select('id')
              .limit(1)
              .single();
            
            if (anyCourse) {
              courseId = anyCourse.id;
            }
          }
          
          if (!courseId) {
            results.push({
              success: false,
              error: `No course found. Please create a course first.`,
              record: record.student_name || 'Unknown',
            });
            continue;
          }
          
          // Extract year from cohort name (e.g., "Turma Janeiro 2025" -> 2025)
          const yearMatch = cohortIdentifier.match(/\b(\d{4})\b/);
          const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
          
          // Extract month name to calculate start date
          const monthMap: Record<string, number> = {
            'janeiro': 0, 'fevereiro': 1, 'março': 2, 'marco': 2,
            'abril': 3, 'maio': 4, 'junho': 5, 'julho': 6,
            'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11,
          };
          
          const lowerName = cohortIdentifier.toLowerCase();
          let month = new Date().getMonth(); // Default to current month
          
          for (const [monthName, monthNum] of Object.entries(monthMap)) {
            if (lowerName.includes(monthName)) {
              month = monthNum;
              break;
            }
          }
          
          // Calculate start date (first day of the month)
          const startDate = new Date(year, month, 1);
          // Calculate end date (3 days after start date for a 4-day course)
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 3);
          
          // Create cohort with default values
          const newCohort = {
            name: cohortIdentifier,
            course_id: courseId,
            year: year,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            location: record.city && record.state 
              ? `${record.city}, ${record.state}` 
              : 'São Paulo, BR',
            capacity: 30,
            status: 'open' as const,
          };
          
          const { data: createdCohort, error: createCohortError } = await supabase
            .from('cohorts')
            .insert(newCohort)
            .select('id')
            .single();
          
          if (createCohortError || !createdCohort) {
            console.error('Error creating cohort:', createCohortError);
            results.push({
              success: false,
              error: `Failed to create cohort: ${createCohortError?.message || 'Unknown error'}`,
              record: record.student_name || 'Unknown',
            });
            continue;
          }
          
          cohortId = createdCohort.id;
          console.log(`Cohort created successfully: ${cohortIdentifier} (${cohortId})`);
        }

        // Normalize data
        const normalizedCPF = normalizeCPF(record.cpf || '');
        const normalizedEmail = (record.email || '').toLowerCase().trim();
        const normalizedPhone = normalizePhone(record.phone || '');
        const normalizedZipcode = normalizeZipcode(record.zipcode || '');
        const normalizedLeadDate = normalizeDate(record.lead_date || '');
        const normalizedPurchaseDate = normalizeDate(record.purchase_date || '');
        const paymentAmount = parseMoneyValue(record.payment_amount || '');
        
        // Map financial_status and contract_status
        const financialStatus = record.financial_status === 'paid' ? 'paid' : 'pending';
        const contractStatus = record.contract_status === 'signed' ? 'signed' : 'pending';

        // Handle Sales Rep - Create if doesn't exist (required field)
        let salesRepName = record.sales_rep?.trim() || 'Não Informado';
        
        // Check if sales rep exists (case insensitive)
        const { data: existingSalesRep } = await supabase
          .from('sales_representatives')
          .select('name')
          .ilike('name', salesRepName)
          .maybeSingle();

        if (!existingSalesRep) {
          console.log(`Sales rep not found, creating automatically: ${salesRepName}`);
          const { error: createSalesRepError } = await supabase
            .from('sales_representatives')
            .insert({
              name: salesRepName,
              email: null,
              phone: null,
              active: true,
            });

          if (createSalesRepError) {
            console.error('Error creating sales rep:', createSalesRepError);
            // Continue anyway, will use the name as-is (database will accept it)
          } else {
            console.log(`Sales rep created successfully: ${salesRepName}`);
          }
        }

        // Handle Source - Normalize and create custom source if needed
        const sourceValue = record.source?.trim() || 'Outro';
        let normalizedSource = sourceValue;

        // Normalize source (similar to frontend logic)
        const normalizeEnrollmentSource = (value: string): string => {
          if (!value) return 'Outro';
          const normalized = value.trim().toLowerCase();
          
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

          if (exactMatches[normalized]) {
            return exactMatches[normalized];
          }

          // Check if it matches enum values (approximate)
          const enumSources = [
            'Instagram', 'Facebook', 'Indicação', 'Tráfego Pago', 'Direto', 'Outro',
            'Instagram Bio', 'Instagram Manychat', 'WEB - Downsell',
            'Área de Membros FOTS', 'Tráfego Pago (Público Frio)',
            'Tráfego Pago (Público Quente)', 'API Remarketing',
            'Aluno Mentoria', 'Programa de Indicação', 'Não Rastreada'
          ];

          // Try to find matching enum (case insensitive)
          const enumMatch = enumSources.find(s => s.toLowerCase() === normalized);
          if (enumMatch) {
            return enumMatch;
          }

          return value; // Return original for custom source
        };

        normalizedSource = normalizeEnrollmentSource(sourceValue);

        // Always check/create in custom_enrollment_sources for tracking/management
        // This works even if it's a valid enum value
        const { data: existingCustomSource } = await supabase
          .from('custom_enrollment_sources')
          .select('name')
          .ilike('name', normalizedSource)
          .maybeSingle();

        if (!existingCustomSource) {
          console.log(`Source not found in custom_enrollment_sources, creating automatically: ${normalizedSource}`);
          const { error: createSourceError } = await supabase
            .from('custom_enrollment_sources')
            .insert({
              name: normalizedSource,
              description: `Criado automaticamente via webhook`,
              active: true,
            });

          if (createSourceError) {
            console.error('Error creating custom source:', createSourceError);
            // Continue anyway, will use the normalized source value
          } else {
            console.log(`Custom source created successfully: ${normalizedSource}`);
          }
        }

        // Check for existing enrollment
        const { data: existingEnrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('email', normalizedEmail)
          .eq('cohort_id', cohortId)
          .maybeSingle();

        const enrollmentData: any = {
          cohort_id: cohortId,
          student_name: record.student_name,
          email: normalizedEmail,
          cpf: normalizedCPF.normalized || 'PENDENTE',
          phone: normalizedPhone || null,
          sales_rep: salesRepName,
          source: normalizedSource as any,
          payment_amount: paymentAmount,
          payment_details: record.payment_details || '',
          financial_status: financialStatus,
          contract_status: contractStatus,
          address: record.address || null,
          city: record.city || null,
          state: record.state || null,
          zipcode: normalizedZipcode || null,
          purchase_date: normalizedPurchaseDate,
          lead_date: normalizedLeadDate,
          payment_proof_url: record.payment_proof_url || null,
          observations: record.observations || null,
          external_metadata: {
            product_name: record.product_name || null,
            utm_source: record.utm_source || null,
            utm_medium: record.utm_medium || null,
            utm_campaign: record.utm_campaign || null,
            utm_term: record.utm_term || null,
            utm_content: record.utm_content || null,
            webhook_event: payload.event,
            webhook_sent_at: payload.sent_at,
          },
          updated_at: new Date().toISOString(),
        };

        let enrollment;
        let action;

        if (existingEnrollment) {
          // Update existing
          const { data: updated, error: updateError } = await supabase
            .from('enrollments')
            .update(enrollmentData)
            .eq('id', existingEnrollment.id)
            .select()
            .single();

          if (updateError) throw updateError;
          enrollment = updated;
          action = 'updated';
        } else {
          // Create new
          enrollmentData.created_at = new Date().toISOString();
          const { data: created, error: createError } = await supabase
            .from('enrollments')
            .insert(enrollmentData)
            .select()
            .single();

          if (createError) throw createError;
          enrollment = created;
          action = 'created';
        }

        // Log success
        await supabase.from('integration_logs').insert({
          source_system: 'n8n',
          event_type: action === 'created' ? 'enrollment_created' : 'enrollment_updated',
          status: 'success',
          enrollment_id: enrollment.id,
          payload: record,
        });

        results.push({
          success: true,
          action,
          enrollment_id: enrollment.id,
          student_name: record.student_name,
        });

      } catch (error: any) {
        console.error('Error processing record:', error);
        results.push({
          success: false,
          error: error.message,
          record: record.student_name || 'Unknown',
        });
      }
    }

    // Log webhook reception
    await supabase.from('integration_logs').insert({
      source_system: 'n8n',
      event_type: 'webhook_received',
      status: results.every(r => r.success) ? 'success' : 'partial',
      payload: payload,
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: true,
      processed: results.length,
      results,
    });

  } catch (error: any) {
    console.error('Webhook error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}

