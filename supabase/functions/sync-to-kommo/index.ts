import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { enrollmentId } = await req.json();

    if (!enrollmentId) {
      return new Response(
        JSON.stringify({ error: 'Missing enrollmentId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados do enrollment e da turma
    const { data: enrollment, error: enrollmentError } = await supabaseClient
      .from('enrollments')
      .select(`
        *,
        cohorts (
          name,
          year,
          location,
          start_date
        )
      `)
      .eq('id', enrollmentId)
      .single();

    if (enrollmentError || !enrollment) {
      throw new Error('Enrollment not found');
    }

    // Verificar se tem kommo_lead_id
    if (!enrollment.kommo_lead_id) {
      return new Response(
        JSON.stringify({ error: 'Enrollment does not have kommo_lead_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar configurações do Kommo
    const { data: settings } = await supabaseClient
      .from('integration_settings')
      .select('api_key, config')
      .eq('system_name', 'kommo')
      .eq('enabled', true)
      .single();

    if (!settings?.api_key) {
      return new Response(
        JSON.stringify({ error: 'Kommo integration not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const kommoApiUrl = settings.config?.api_url || 'https://yourdomain.kommo.com';
    const kommoAccessToken = settings.api_key;

    // Preparar dados para enviar ao Kommo
    const updateData = {
      name: enrollment.student_name,
      custom_fields_values: [
        {
          field_code: 'EMAIL',
          values: [{ value: enrollment.email }],
        },
        {
          field_code: 'PHONE',
          values: [{ value: enrollment.phone || '' }],
        },
        {
          field_name: 'Status Financeiro',
          values: [{ value: enrollment.financial_status === 'paid' ? 'Pago' : 'Pendente' }],
        },
        {
          field_name: 'Contrato',
          values: [{ value: enrollment.contract_status === 'signed' ? 'Assinado' : 'Pendente' }],
        },
        {
          field_name: 'Turma',
          values: [{ value: `${enrollment.cohorts?.name} ${enrollment.cohorts?.year}` }],
        },
      ],
    };

    // Enviar atualização para Kommo
    const kommoResponse = await fetch(`${kommoApiUrl}/api/v4/leads/${enrollment.kommo_lead_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${kommoAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!kommoResponse.ok) {
      const errorText = await kommoResponse.text();
      throw new Error(`Kommo API error: ${kommoResponse.status} - ${errorText}`);
    }

    // Registrar log de sucesso
    await supabaseClient.from('integration_logs').insert({
      source_system: 'kommo',
      event_type: 'sync_sent',
      status: 'success',
      enrollment_id: enrollmentId,
      external_id: enrollment.kommo_lead_id,
      payload: updateData,
    });

    console.log('Successfully synced to Kommo:', enrollment.kommo_lead_id);

    return new Response(
      JSON.stringify({ success: true, message: 'Synced to Kommo' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error syncing to Kommo:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
