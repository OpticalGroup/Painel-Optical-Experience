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

    const payload = await req.json();
    console.log('Kommo webhook received:', JSON.stringify(payload, null, 2));

    // Registrar log de integração
    await supabaseClient.from('integration_logs').insert({
      source_system: 'kommo',
      event_type: 'webhook_received',
      status: 'pending',
      payload: payload,
      external_id: payload.leads?.id || payload.id,
    });

    // Extrair dados do lead
    const lead = payload.leads?.[0] || payload;
    const kommoLeadId = lead.id?.toString();
    const name = lead.name || '';
    const email = lead.custom_fields?.find((f: any) => f.field_code === 'EMAIL')?.values?.[0]?.value || '';
    const phone = lead.custom_fields?.find((f: any) => f.field_code === 'PHONE')?.values?.[0]?.value || '';
    const cpf = lead.custom_fields?.find((f: any) => f.field_name === 'CPF')?.values?.[0]?.value || '';
    
    if (!kommoLeadId || !email) {
      console.error('Missing required fields: kommoLeadId or email');
      await supabaseClient.from('integration_logs').insert({
        source_system: 'kommo',
        event_type: 'webhook_error',
        status: 'error',
        payload: payload,
        error_message: 'Missing kommoLeadId or email',
      });
      
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar enrollment existente pelo kommo_lead_id ou email
    const { data: existingEnrollment } = await supabaseClient
      .from('enrollments')
      .select('*')
      .or(`kommo_lead_id.eq.${kommoLeadId},email.eq.${email}`)
      .single();

    if (existingEnrollment) {
      // Atualizar enrollment existente
      const { error: updateError } = await supabaseClient
        .from('enrollments')
        .update({
          kommo_lead_id: kommoLeadId,
          student_name: name || existingEnrollment.student_name,
          phone: phone || existingEnrollment.phone,
          external_metadata: {
            ...existingEnrollment.external_metadata,
            kommo_last_sync: new Date().toISOString(),
            kommo_data: lead,
          },
        })
        .eq('id', existingEnrollment.id);

      if (updateError) throw updateError;

      await supabaseClient.from('integration_logs').insert({
        source_system: 'kommo',
        event_type: 'enrollment_updated',
        status: 'success',
        enrollment_id: existingEnrollment.id,
        external_id: kommoLeadId,
        payload: payload,
      });

      console.log('Enrollment updated:', existingEnrollment.id);
    } else {
      console.log('No existing enrollment found. Manual enrollment creation required.');
      
      await supabaseClient.from('integration_logs').insert({
        source_system: 'kommo',
        event_type: 'no_enrollment_match',
        status: 'success',
        external_id: kommoLeadId,
        payload: payload,
        error_message: 'No matching enrollment found. Create enrollment manually with this kommo_lead_id.',
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error processing Kommo webhook:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
