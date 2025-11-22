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
    console.log('ClickSign webhook received:', JSON.stringify(payload, null, 2));

    // Registrar log de integração
    await supabaseClient.from('integration_logs').insert({
      source_system: 'clicksign',
      event_type: 'webhook_received',
      status: 'pending',
      payload: payload,
      external_id: payload.document?.key || payload.key,
    });

    // Extrair dados do documento assinado
    const document = payload.document || payload;
    const documentKey = document.key;
    const signerEmail = document.signers?.[0]?.email || payload.signer?.email;
    const event = payload.event?.name || payload.event;

    // Verificar se o evento é de assinatura concluída
    if (event !== 'sign' && event !== 'close') {
      console.log('Event is not a signature completion:', event);
      return new Response(
        JSON.stringify({ success: true, message: 'Event ignored' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!signerEmail) {
      console.error('Missing signer email');
      await supabaseClient.from('integration_logs').insert({
        source_system: 'clicksign',
        event_type: 'webhook_error',
        status: 'error',
        payload: payload,
        error_message: 'Missing signer email',
      });
      
      return new Response(
        JSON.stringify({ error: 'Missing signer email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar enrollment pelo email do signatário
    const { data: enrollments, error: searchError } = await supabaseClient
      .from('enrollments')
      .select('*')
      .eq('email', signerEmail);

    if (searchError) throw searchError;

    if (!enrollments || enrollments.length === 0) {
      console.log('No enrollment found for email:', signerEmail);
      
      await supabaseClient.from('integration_logs').insert({
        source_system: 'clicksign',
        event_type: 'orphan_signature',
        status: 'success',
        external_id: documentKey,
        payload: payload,
        error_message: `No enrollment found for signer email: ${signerEmail}`,
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Orphan signature - no enrollment found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar todos os enrollments com esse email para "signed"
    const enrollmentIds = enrollments.map(e => e.id);
    
    const { error: updateError } = await supabaseClient
      .from('enrollments')
      .update({
        contract_status: 'signed',
        clicksign_document_id: documentKey,
        external_metadata: {
          ...enrollments[0].external_metadata,
          clicksign_signed_at: new Date().toISOString(),
          clicksign_data: document,
        },
      })
      .in('id', enrollmentIds);

    if (updateError) throw updateError;

    // Registrar log de sucesso para cada enrollment atualizado
    for (const enrollmentId of enrollmentIds) {
      await supabaseClient.from('integration_logs').insert({
        source_system: 'clicksign',
        event_type: 'contract_signed',
        status: 'success',
        enrollment_id: enrollmentId,
        external_id: documentKey,
        payload: payload,
      });
    }

    console.log('Enrollments updated to signed:', enrollmentIds);

    return new Response(
      JSON.stringify({ success: true, message: 'Contract signed', enrollments: enrollmentIds.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error processing ClickSign webhook:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
