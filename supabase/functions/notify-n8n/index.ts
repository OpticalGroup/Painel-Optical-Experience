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

        const { enrollmentId, event, testPayload } = await req.json();

        // Handle Test Connection
        if (event === 'test_connection') {
            const { data: settings } = await supabaseClient
                .from('integration_settings')
                .select('config')
                .eq('system_name', 'n8n')
                .eq('enabled', true)
                .single();

            if (!settings?.config?.webhook_url) {
                throw new Error('N8N integration not configured or disabled');
            }

            const response = await fetch(settings.config.webhook_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testPayload),
            });

            if (!response.ok) {
                throw new Error(`N8N responded with ${response.status}`);
            }

            return new Response(
                JSON.stringify({ success: true, message: 'Test sent to N8N' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Handle Enrollment Notification
        if (!enrollmentId) {
            throw new Error('Missing enrollmentId');
        }

        // Fetch Enrollment Data
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

        // Fetch N8N Settings
        const { data: settings } = await supabaseClient
            .from('integration_settings')
            .select('config')
            .eq('system_name', 'n8n')
            .eq('enabled', true)
            .single();

        if (!settings?.config?.webhook_url) {
            console.log('N8N integration disabled or not configured');
            return new Response(
                JSON.stringify({ skipped: true, reason: 'N8N disabled' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Prepare Payload
        const payload = {
            event: event || 'enrollment_updated',
            timestamp: new Date().toISOString(),
            data: enrollment
        };

        // Send to N8N
        const response = await fetch(settings.config.webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`N8N API error: ${response.status}`);
        }

        // Log Success
        await supabaseClient.from('integration_logs').insert({
            source_system: 'n8n',
            event_type: 'sync_sent',
            status: 'success',
            enrollment_id: enrollmentId,
            payload: payload,
        });

        return new Response(
            JSON.stringify({ success: true, message: 'Synced to N8N' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error syncing to N8N:', error);

        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
