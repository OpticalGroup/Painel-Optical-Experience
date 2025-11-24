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

        const { enrollmentId, event } = await req.json();

        if (!enrollmentId) {
            throw new Error('Missing enrollmentId');
        }

        console.log(`Processing integrations for enrollment ${enrollmentId} (Event: ${event})`);

        // Helper for retries with exponential backoff
        const invokeWithRetry = async (functionName: string, body: any, retries = 3) => {
            for (let i = 0; i < retries; i++) {
                try {
                    const { error } = await supabaseClient.functions.invoke(functionName, { body });
                    if (error) throw error;
                    return; // Success
                } catch (err: any) {
                    console.warn(`Attempt ${i + 1}/${retries} failed for ${functionName}:`, err?.message);
                    if (i === retries - 1) throw err; // Throw on last attempt
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i))); // Exponential backoff
                }
            }
        };

        // Fetch enabled integrations
        const { data: settings } = await supabaseClient
            .from('integration_settings')
            .select('system_name, enabled')
            .eq('enabled', true);

        const enabledSystems = settings?.map((s: any) => s.system_name) || [];
        const results = [];

        // 1. N8N Integration
        if (enabledSystems.includes('n8n')) {
            try {
                console.log('Triggering N8N...');
                await invokeWithRetry('notify-n8n', { enrollmentId, event });
                results.push({ system: 'n8n', status: 'triggered' });
            } catch (err: any) {
                console.error('Error triggering N8N:', err);
                results.push({ system: 'n8n', status: 'error', error: err.message });
            }
        }

        // 2. Kommo CRM Integration
        if (enabledSystems.includes('kommo')) {
            try {
                console.log('Triggering Kommo...');
                await invokeWithRetry('sync-to-kommo', { enrollmentId });
                results.push({ system: 'kommo', status: 'triggered' });
            } catch (err: any) {
                console.error('Error triggering Kommo:', err);
                results.push({ system: 'kommo', status: 'error', error: err.message });
            }
        }

        // 3. ClickSign Integration  
        if (enabledSystems.includes('clicksign')) {
            try {
                // Check if document already exists to avoid duplicates
                const { data: enrollment } = await supabaseClient
                    .from('enrollments')
                    .select('clicksign_document_id')
                    .eq('id', enrollmentId)
                    .single();

                if (!enrollment?.clicksign_document_id) {
                    console.log('Triggering ClickSign (New Document)...');
                    await invokeWithRetry('send-to-clicksign', { enrollmentId });
                    results.push({ system: 'clicksign', status: 'triggered' });
                } else {
                    console.log('Skipping ClickSign (Document already exists)');
                    results.push({ system: 'clicksign', status: 'skipped', reason: 'document_exists' });
                }
            } catch (err: any) {
                console.error('Error triggering ClickSign:', err);
                results.push({ system: 'clicksign', status: 'error', error: err.message });
            }
        }

        return new Response(
            JSON.stringify({ success: true, results }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error in notify-integrations:', error);

        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
