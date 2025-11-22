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

    // Buscar dados do enrollment
    const { data: enrollment, error: enrollmentError } = await supabaseClient
      .from('enrollments')
      .select(`
        *,
        cohorts (
          name,
          year,
          location,
          start_date,
          end_date
        )
      `)
      .eq('id', enrollmentId)
      .single();

    if (enrollmentError || !enrollment) {
      throw new Error('Enrollment not found');
    }

    // Buscar configurações do ClickSign
    const { data: settings } = await supabaseClient
      .from('integration_settings')
      .select('api_key, config')
      .eq('system_name', 'clicksign')
      .eq('enabled', true)
      .single();

    if (!settings?.api_key) {
      return new Response(
        JSON.stringify({ error: 'ClickSign integration not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clicksignApiKey = settings.api_key;
    const templateKey = settings.config?.template_key;

    if (!templateKey) {
      return new Response(
        JSON.stringify({ error: 'ClickSign template not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar documento a partir do template
    const documentData = {
      document: {
        path: `/${enrollment.student_name}_${enrollment.cohorts?.name}_${Date.now()}.pdf`,
        template: {
          key: templateKey,
          data: {
            student_name: enrollment.student_name,
            cpf: enrollment.cpf,
            email: enrollment.email,
            phone: enrollment.phone || '',
            cohort_name: `${enrollment.cohorts?.name} ${enrollment.cohorts?.year}`,
            start_date: enrollment.cohorts?.start_date || '',
            end_date: enrollment.cohorts?.end_date || '',
            payment_amount: enrollment.payment_amount || 0,
            payment_details: enrollment.payment_details || '',
          },
        },
      },
    };

    // Criar documento no ClickSign
    const createDocResponse = await fetch('https://app.clicksign.com/api/v1/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clicksignApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(documentData),
    });

    if (!createDocResponse.ok) {
      const errorText = await createDocResponse.text();
      throw new Error(`ClickSign API error: ${createDocResponse.status} - ${errorText}`);
    }

    const document = await createDocResponse.json();
    const documentKey = document.document?.key;

    if (!documentKey) {
      throw new Error('Failed to create document in ClickSign');
    }

    // Adicionar signatário
    const signerData = {
      signer: {
        email: enrollment.email,
        name: enrollment.student_name,
        phone_number: enrollment.phone || null,
        documentation: enrollment.cpf,
        birthday: null,
        has_documentation: true,
        selfie_enabled: false,
        handwritten_enabled: false,
        official_document_enabled: false,
        liveness_enabled: false,
        facial_biometrics_enabled: false,
        document_key: documentKey,
      },
    };

    const addSignerResponse = await fetch('https://app.clicksign.com/api/v1/signers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clicksignApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signerData),
    });

    if (!addSignerResponse.ok) {
      const errorText = await addSignerResponse.text();
      throw new Error(`ClickSign add signer error: ${addSignerResponse.status} - ${errorText}`);
    }

    // Atualizar enrollment com document_id
    const { error: updateError } = await supabaseClient
      .from('enrollments')
      .update({
        clicksign_document_id: documentKey,
        external_metadata: {
          ...enrollment.external_metadata,
          clicksign_sent_at: new Date().toISOString(),
        },
      })
      .eq('id', enrollmentId);

    if (updateError) throw updateError;

    // Registrar log de sucesso
    await supabaseClient.from('integration_logs').insert({
      source_system: 'clicksign',
      event_type: 'document_sent',
      status: 'success',
      enrollment_id: enrollmentId,
      external_id: documentKey,
      payload: { document: documentData, signer: signerData },
    });

    console.log('Successfully sent to ClickSign:', documentKey);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document sent to ClickSign',
        documentKey: documentKey,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error sending to ClickSign:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
