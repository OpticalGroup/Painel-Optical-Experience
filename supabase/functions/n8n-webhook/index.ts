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
        console.log('N8N webhook received:', JSON.stringify(payload, null, 2));

        // Log the incoming request
        await supabaseClient.from('integration_logs').insert({
            source_system: 'n8n',
            event_type: 'webhook_received',
            status: 'pending',
            payload: payload,
        });

        // Verify Webhook Secret
        const secretHeader = req.headers.get('x-webhook-secret');

        const { data: settings } = await supabaseClient
            .from('integration_settings')
            .select('webhook_secret')
            .eq('system_name', 'n8n')
            .single();

        if (settings?.webhook_secret && secretHeader !== settings.webhook_secret) {
            console.warn('Invalid webhook secret provided');
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Invalid webhook secret' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Validate required fields
        const { email, student_name, cohort_id } = payload;

        if (!email || !student_name || !cohort_id) {
            throw new Error('Missing required fields: email, student_name, cohort_id');
        }

        // Check for existing enrollment
        const { data: existingEnrollment } = await supabaseClient
            .from('enrollments')
            .select('*')
            .eq('email', email)
            .eq('cohort_id', cohort_id)
            .single();

        let result;

        if (existingEnrollment) {
            // Update existing
            const { data: updated, error: updateError } = await supabaseClient
                .from('enrollments')
                .update({
                    ...payload, // Allow updating any field passed in payload
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingEnrollment.id)
                .select()
                .single();

            if (updateError) throw updateError;
            result = { action: 'updated', enrollment: updated };
        } else {
            // Create new
            const { data: created, error: createError } = await supabaseClient
                .from('enrollments')
                .insert({
                    ...payload,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (createError) throw createError;
            result = { action: 'created', enrollment: created };
        }

        // Log success
        await supabaseClient.from('integration_logs').insert({
            source_system: 'n8n',
            event_type: result.action === 'created' ? 'enrollment_created' : 'enrollment_updated',
            status: 'success',
            enrollment_id: result.enrollment.id,
            payload: payload,
        });

        return new Response(
            JSON.stringify({ success: true, ...result }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error processing N8N webhook:', error);

        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
