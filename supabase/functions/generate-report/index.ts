import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  type: 'dashboard' | 'cohorts' | 'cohort-detail' | 'sales-reps' | 'sources' | 'conversion';
  cohortId?: string;
  format?: 'csv' | 'json';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const requestData: ReportRequest = await req.json();
    const { type, cohortId, format = 'csv' } = requestData;

    console.log(`Generating ${format} report of type: ${type} for user: ${user.email}`);

    let data: any[] = [];
    let filename = '';
    let headers: string[] = [];

    switch (type) {
      case 'dashboard': {
        // Buscar dados do dashboard
        const { data: cohorts, error: cohortsError } = await supabase
          .from('cohorts')
          .select(`
            id,
            name,
            location,
            start_date,
            end_date,
            capacity,
            status,
            courses (name)
          `)
          .order('start_date', { ascending: false });

        if (cohortsError) throw cohortsError;

        // Buscar enrollments para cada cohort
        const enrichedData = await Promise.all(
          cohorts.map(async (cohort) => {
            const { data: enrollments } = await supabase
              .from('enrollments')
              .select('financial_status, contract_status, payment_amount')
              .eq('cohort_id', cohort.id);

            const enrolled = enrollments?.length || 0;
            const paid = enrollments?.filter(e => e.financial_status === 'paid').length || 0;
            const signed = enrollments?.filter(e => e.contract_status === 'signed').length || 0;
            const revenue = enrollments?.reduce((sum, e) => sum + (Number(e.payment_amount) || 0), 0) || 0;

            return {
              'Turma': cohort.name,
              'Curso': Array.isArray(cohort.courses) ? cohort.courses[0]?.name || '' : '',
              'Local': cohort.location,
              'Data Início': cohort.start_date,
              'Data Fim': cohort.end_date || '',
              'Capacidade': cohort.capacity,
              'Inscritos': enrolled,
              'Taxa Ocupação': `${((enrolled / cohort.capacity) * 100).toFixed(1)}%`,
              'Pagos': paid,
              'Contratos': signed,
              'Receita': `R$ ${revenue.toFixed(2)}`,
              'Status': cohort.status,
            };
          })
        );

        data = enrichedData;
        filename = `relatorio-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'cohorts': {
        const { data: cohorts, error } = await supabase
          .from('cohorts')
          .select(`
            *,
            courses (name)
          `)
          .order('start_date', { ascending: false });

        if (error) throw error;

        data = cohorts.map(c => ({
          'ID': c.id,
          'Nome': c.name,
          'Curso': Array.isArray(c.courses) ? c.courses[0]?.name || '' : '',
          'Ano': c.year,
          'Local': c.location,
          'Data Início': c.start_date,
          'Data Fim': c.end_date || '',
          'Capacidade': c.capacity,
          'Status': c.status,
        }));
        filename = `relatorio-turmas-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'cohort-detail': {
        if (!cohortId) throw new Error('cohortId is required');

        const { data: cohort, error: cohortError } = await supabase
          .from('cohorts')
          .select('name')
          .eq('id', cohortId)
          .single();

        if (cohortError) throw cohortError;

        const { data: enrollments, error } = await supabase
          .from('enrollments')
          .select('*')
          .eq('cohort_id', cohortId)
          .order('position_in_cohort', { ascending: true });

        if (error) throw error;

        data = enrollments.map(e => ({
          'Posição': e.position_in_cohort || '',
          'Nome': e.student_name,
          'Email': e.email,
          'CPF': e.cpf,
          'Telefone': e.phone || '',
          'Status Financeiro': e.financial_status,
          'Status Contrato': e.contract_status,
          'Valor': e.payment_amount ? `R$ ${e.payment_amount}` : '',
          'Condições': e.payment_details,
          'Vendedor': e.sales_rep,
          'Origem': e.source,
          'Data Lead': e.lead_date || '',
          'Data Compra': e.purchase_date || '',
          'Produto': e.product_name || '',
          'Cidade': e.city || '',
          'Estado': e.state || '',
        }));
        filename = `relatorio-${cohort.name.replace(/\s/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'sales-reps': {
        const { data: enrollments, error } = await supabase
          .from('enrollments')
          .select('sales_rep, financial_status, payment_amount');

        if (error) throw error;

        const repMap = new Map();
        enrollments.forEach(e => {
          const rep = e.sales_rep || 'Não atribuído';
          if (!repMap.has(rep)) {
            repMap.set(rep, { total: 0, paid: 0, revenue: 0 });
          }
          const stats = repMap.get(rep);
          stats.total++;
          if (e.financial_status === 'paid') {
            stats.paid++;
            stats.revenue += Number(e.payment_amount) || 0;
          }
        });

        data = Array.from(repMap.entries()).map(([name, stats]) => ({
          'Vendedor': name,
          'Total Vendas': stats.total,
          'Vendas Pagas': stats.paid,
          'Taxa Conversão': `${((stats.paid / stats.total) * 100).toFixed(1)}%`,
          'Receita Total': `R$ ${stats.revenue.toFixed(2)}`,
        })).sort((a, b) => parseInt(b['Total Vendas']) - parseInt(a['Total Vendas']));

        filename = `relatorio-vendedores-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'sources': {
        const { data: enrollments, error } = await supabase
          .from('enrollments')
          .select('source, financial_status, payment_amount');

        if (error) throw error;

        const sourceMap = new Map();
        enrollments.forEach(e => {
          const source = e.source || 'Outro';
          if (!sourceMap.has(source)) {
            sourceMap.set(source, { total: 0, paid: 0, revenue: 0 });
          }
          const stats = sourceMap.get(source);
          stats.total++;
          if (e.financial_status === 'paid') {
            stats.paid++;
            stats.revenue += Number(e.payment_amount) || 0;
          }
        });

        data = Array.from(sourceMap.entries()).map(([name, stats]) => ({
          'Origem': name,
          'Total Matrículas': stats.total,
          'Matrículas Pagas': stats.paid,
          'Taxa Conversão': `${((stats.paid / stats.total) * 100).toFixed(1)}%`,
          'Receita Total': `R$ ${stats.revenue.toFixed(2)}`,
        })).sort((a, b) => parseInt(b['Total Matrículas']) - parseInt(a['Total Matrículas']));

        filename = `relatorio-origens-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'conversion': {
        const { data: enrollments, error } = await supabase
          .from('enrollments')
          .select(`
            lead_date,
            purchase_date,
            cohort_id,
            cohorts (name)
          `)
          .not('lead_date', 'is', null)
          .not('purchase_date', 'is', null);

        if (error) throw error;

        data = enrollments.map(e => {
          const leadDate = new Date(e.lead_date!);
          const purchaseDate = new Date(e.purchase_date!);
          const days = Math.floor((purchaseDate.getTime() - leadDate.getTime()) / (1000 * 60 * 60 * 24));
          const cohortName = Array.isArray(e.cohorts) ? e.cohorts[0]?.name || '' : '';

          return {
            'Turma': cohortName,
            'Data Lead': e.lead_date,
            'Data Compra': e.purchase_date,
            'Dias para Conversão': days >= 0 ? days : 0,
          };
        });

        filename = `relatorio-conversao-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      default:
        throw new Error('Invalid report type');
    }

    // Generate CSV
    if (format === 'csv' && data.length > 0) {
      headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header]?.toString() || '';
            // Escape commas and quotes
            return value.includes(',') || value.includes('"') 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Add UTF-8 BOM for Excel compatibility
      const bom = '\uFEFF';
      
      return new Response(bom + csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Return JSON format
    return new Response(JSON.stringify({ data, filename }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error generating report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
