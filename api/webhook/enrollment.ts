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
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://nheacgdfprqhuovubeed.supabase.co';
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

    const results = [];

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
          .single();

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

        if (!cohortId) {
          results.push({
            success: false,
            error: `Cohort not found: ${cohortIdentifier}`,
            record: record.student_name || 'Unknown',
          });
          continue;
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
          sales_rep: record.sales_rep || null,
          source: record.source || 'Outro',
          payment_amount: paymentAmount,
          payment_details: record.payment_details || null,
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

