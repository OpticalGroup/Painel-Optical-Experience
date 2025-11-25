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
    console.log('Typeform webhook received:', JSON.stringify(payload, null, 2));

    // Registrar log de integração
    await supabaseClient.from('integration_logs').insert({
      source_system: 'typeform',
      event_type: 'webhook_received',
      status: 'pending',
      payload: payload,
      external_id: payload.form_response?.token,
    });

    // Extrair dados da resposta do formulário
    const formResponse = payload.form_response;
    const responseId = formResponse?.token;
    const answers = formResponse?.answers || [];
    
    // Mapear respostas por referência ou título
    const getAnswer = (ref: string) => {
      return answers.find((a: any) => 
        a.field?.ref === ref || 
        a.field?.title?.toLowerCase().includes(ref.toLowerCase())
      );
    };

    const name = getAnswer('name')?.text || getAnswer('nome')?.text || '';
    const email = getAnswer('email')?.email || '';
    const phone = getAnswer('phone')?.phone_number || getAnswer('telefone')?.text || '';
    const cpf = getAnswer('cpf')?.text || '';
    
    if (!responseId || !email || !name) {
      console.error('Missing required fields');
      await supabaseClient.from('integration_logs').insert({
        source_system: 'typeform',
        event_type: 'webhook_error',
        status: 'error',
        payload: payload,
        error_message: 'Missing required fields (name, email, or responseId)',
      });
      
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar configurações do Typeform para obter turma padrão
    const { data: settings } = await supabaseClient
      .from('integration_settings')
      .select('config')
      .eq('system_name', 'typeform')
      .single();

    const defaultCohortId = settings?.config?.default_cohort_id;

    if (!defaultCohortId) {
      console.log('No default cohort configured for Typeform');
      
      await supabaseClient.from('integration_logs').insert({
        source_system: 'typeform',
        event_type: 'no_default_cohort',
        status: 'error',
        external_id: responseId,
        payload: payload,
        error_message: 'No default cohort configured. Configure in Integration Settings.',
      });

      return new Response(
        JSON.stringify({ error: 'No default cohort configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já existe enrollment com esse email na turma
    const { data: existingEnrollment } = await supabaseClient
      .from('enrollments')
      .select('*')
      .eq('email', email)
      .eq('cohort_id', defaultCohortId)
      .single();

    if (existingEnrollment) {
      // Atualizar enrollment existente com typeform_response_id
      const { error: updateError } = await supabaseClient
        .from('enrollments')
        .update({
          typeform_response_id: responseId,
          external_metadata: {
            ...existingEnrollment.external_metadata,
            typeform_submitted_at: new Date().toISOString(),
            typeform_data: formResponse,
          },
        })
        .eq('id', existingEnrollment.id);

      if (updateError) throw updateError;

      await supabaseClient.from('integration_logs').insert({
        source_system: 'typeform',
        event_type: 'enrollment_updated',
        status: 'success',
        enrollment_id: existingEnrollment.id,
        external_id: responseId,
        payload: payload,
      });

      console.log('Enrollment updated with Typeform data:', existingEnrollment.id);
    } else {
      // Criar novo enrollment pré-qualificado
      const { data: newEnrollment, error: insertError } = await supabaseClient
        .from('enrollments')
        .insert({
          cohort_id: defaultCohortId,
          student_name: name,
          email: email,
          phone: phone || null,
          cpf: cpf || 'PENDENTE',
          sales_rep: 'Typeform (Auto)',
          source: 'Typeform',
          payment_details: 'Aguardando definição',
          financial_status: 'pending',
          contract_status: 'pending',
          typeform_response_id: responseId,
          external_metadata: {
            typeform_submitted_at: new Date().toISOString(),
            typeform_data: formResponse,
          },
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await supabaseClient.from('integration_logs').insert({
        source_system: 'typeform',
        event_type: 'enrollment_created',
        status: 'success',
        enrollment_id: newEnrollment.id,
        external_id: responseId,
        payload: payload,
      });

      console.log('New enrollment created from Typeform:', newEnrollment.id);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Typeform response processed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error processing Typeform webhook:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
