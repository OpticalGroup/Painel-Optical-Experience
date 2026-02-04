
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

// Helper: Find or create with case-insensitive name match
async function findOrCreateByName(
    supabase: any,
    table: string,
    name: string,
    additionalConditions: Record<string, any> = {},
    additionalCreateData: Record<string, any> = {}
): Promise<{ id: string; created: boolean }> {
    // Try to find existing (case insensitive)
    let query = supabase.from(table).select('id, name');
    for (const [key, value] of Object.entries(additionalConditions)) {
        query = query.eq(key, value);
    }
    const { data: all } = await query;

    const existing = all?.find((item: any) =>
        item.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    if (existing) {
        return { id: existing.id, created: false };
    }

    // Create new
    const createData = {
        name,
        ...additionalConditions,
        ...additionalCreateData,
        active: true,
    };

    const { data: created, error } = await supabase
        .from(table)
        .insert(createData)
        .select('id')
        .single();

    if (error) throw error;
    return { id: created.id, created: true };
}

console.log("Function initialized (V5 - Full Logic - Native Deno)");

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    const createdEntities: string[] = [];

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

        // Verify Webhook Secret (optional)
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

        // ========== VALIDATE REQUIRED FIELDS ==========
        const { email, student_name } = payload;

        if (!email || !student_name) {
            throw new Error('Missing required fields: email, student_name');
        }

        // ========== RESOLVE OR CREATE COHORT ==========
        let cohort_id = payload.cohort_id;

        if (!cohort_id) {
            // Determine cohort search parameters
            const cohort_month = payload.cohort_month;
            const cohort_year = payload.cohort_year ? parseInt(payload.cohort_year.toString(), 10) : new Date().getFullYear();
            const cohort_name = payload.cohort_name;

            if (!cohort_name && !cohort_month) {
                throw new Error('Missing required: cohort_id, cohort_name, or cohort_month');
            }

            // Fetch all cohorts for smart matching
            const { data: cohorts } = await supabaseClient
                .from('cohorts')
                .select('id, name, year');

            let existingCohort;

            if (cohort_month) {
                // Helper to normalize strings (remove accents, lowercase, trim)
                const normalize = (str: string) =>
                    str.normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .toLowerCase()
                        .trim();

                const normalizedMonth = normalize(cohort_month);

                // SMART MATCHING: Find cohort by month (partial match) + year
                const matchingCohorts = cohorts?.filter((c: any) => {
                    const normalizedName = normalize(c.name);
                    const monthMatch = normalizedName.includes(normalizedMonth);
                    const yearMatch = c.year === cohort_year;
                    return monthMatch && yearMatch;
                }) || [];

                // Prioritize longer names (more specific cohorts)
                if (matchingCohorts.length > 0) {
                    matchingCohorts.sort((a: any, b: any) => b.name.length - a.name.length);
                    existingCohort = matchingCohorts[0];
                }

                // If not found, create with standardized name
                if (!existingCohort) {
                    const standardizedName = `Optical Experience ${cohort_month} ${cohort_year}`;

                    // Get product_id for cohort creation
                    let { data: products } = await supabaseClient
                        .from('products')
                        .select('id')
                        .limit(1);

                    let product_id: string;

                    if (!products || products.length === 0) {
                        const { data: newProduct } = await supabaseClient
                            .from('products')
                            .insert({
                                name: 'Optical Experience',
                                description: 'Produto padrão criado automaticamente',
                            })
                            .select('id')
                            .single();
                        product_id = newProduct.id;
                        createdEntities.push('Produto: Optical Experience (padrão)');
                    } else {
                        product_id = products[0].id;
                    }

                    const { data: newCohort, error: cohortError } = await supabaseClient
                        .from('cohorts')
                        .insert({
                            name: standardizedName,
                            course_id: product_id,
                            location: payload.cohort_location || 'A definir',
                            start_date: payload.cohort_start_date || new Date().toISOString().split('T')[0],
                            year: cohort_year,
                            capacity: payload.cohort_capacity || 50,
                            status: 'open',
                        })
                        .select('id')
                        .single();

                    if (cohortError) throw new Error(`Failed to create cohort: ${cohortError.message}`);
                    cohort_id = newCohort.id;
                    createdEntities.push(`Turma: ${standardizedName}`);
                } else {
                    cohort_id = existingCohort.id;
                }

            } else if (cohort_name) {
                // EXACT MATCHING
                existingCohort = cohorts?.find((c: any) =>
                    c.name.toLowerCase().trim() === cohort_name.toLowerCase().trim()
                );

                if (existingCohort) {
                    cohort_id = existingCohort.id;
                } else {
                    // Create cohort logic (simplified duplicate of above)
                    // (Assuming typical flow uses month/year logic, keeping this brief for reliability)
                    let { data: products } = await supabaseClient.from('products').select('id').limit(1);
                    let product_id = products?.[0]?.id;

                    const { data: newCohort, error: cohortError } = await supabaseClient
                        .from('cohorts')
                        .insert({
                            name: cohort_name,
                            course_id: product_id, // simplified
                            year: cohort_year,
                            status: 'open',
                        })
                        .select('id')
                        .single();
                    if (cohortError) throw cohortError;
                    cohort_id = newCohort.id;
                    createdEntities.push(`Turma: ${cohort_name}`);
                }
            }
        }

        if (!cohort_id) throw new Error('Missing required: cohort_id');

        // ========== RESOLVE OR CREATE SELLER ==========
        const sales_rep = payload.sales_rep || 'Não identificado';
        if (sales_rep && sales_rep !== 'Não identificado') {
            const { data: sellers } = await supabaseClient.from('sellers').select('id, name');
            const existingSeller = sellers?.find((s: any) => s.name.toLowerCase().trim() === sales_rep.toLowerCase().trim());

            if (!existingSeller) {
                const { data: newSeller } = await supabaseClient
                    .from('sellers')
                    .insert({ name: sales_rep, active: true })
                    .select('id')
                    .single();
                if (newSeller) createdEntities.push(`Vendedor: ${sales_rep}`);
            }
        }

        // ========== RESOLVE HIERARCHY ==========
        let funnel_id, macro_origin_id, micro_origin_id, micro_variation_id;

        if (payload.funnel_name) {
            const res = await findOrCreateByName(supabaseClient, 'funnels', payload.funnel_name);
            funnel_id = res.id;
            if (res.created) createdEntities.push(`Funil: ${payload.funnel_name}`);
        }

        if (payload.macro_origin && funnel_id) {
            const res = await findOrCreateByName(supabaseClient, 'macro_origins', payload.macro_origin, { funnel_id });
            macro_origin_id = res.id;
            if (res.created) createdEntities.push(`Macro: ${payload.macro_origin}`);
        }

        if (payload.micro_origin && macro_origin_id) {
            const res = await findOrCreateByName(supabaseClient, 'micro_origins', payload.micro_origin, { macro_origin_id });
            micro_origin_id = res.id;
            if (res.created) createdEntities.push(`Micro: ${payload.micro_origin}`);
        }

        if (payload.micro_variation && micro_origin_id) {
            const res = await findOrCreateByName(supabaseClient, 'micro_variations', payload.micro_variation, { micro_origin_id });
            micro_variation_id = res.id;
            if (res.created) createdEntities.push(`Var Micro: ${payload.micro_variation}`);
        }

        // ========== RESOLVE NUCLEO ==========
        let nucleo_id;
        if (sales_rep && sales_rep !== 'Não identificado') {
            const { data: sellers } = await supabaseClient
                .from('sellers')
                .select('nucleo_id')
                .ilike('name', sales_rep)
                .single();
            if (sellers?.nucleo_id) nucleo_id = sellers.nucleo_id;
        }

        // ========== EXECUTE RPC (The Critical Fix) ==========
        const rpcParams = {
            p_cohort_id: cohort_id,
            p_student_name: student_name,
            p_email: email.toLowerCase().trim(),
            p_cpf: payload.cpf || null,
            p_phone: payload.phone || null,
            p_sales_rep: payload.sales_rep || 'Não identificado',
            p_financial_status: payload.financial_status || 'pending',
            p_contract_status: payload.contract_status || 'pending',
            p_payment_details: payload.payment_details || 'Via N8N',
            p_payment_amount: payload.payment_amount || null,
            p_product_name: payload.product_name || null,
            p_purchase_date: payload.purchase_date || null,
            p_lead_date: payload.lead_date || null,
            p_address: payload.address || null,
            p_city: payload.city || null,
            p_state: payload.state || null,
            p_zipcode: payload.zipcode || null,
            p_observations: payload.observations || null,
            p_utm_source: payload.utm_source || null,
            p_utm_medium: payload.utm_medium || null,
            p_utm_campaign: payload.utm_campaign || null,
            p_utm_term: payload.utm_term || null,
            p_utm_content: payload.utm_content || null,
            p_utm_page: payload.utm_page || null,
            p_submitted_at: payload.submitted_at || null,
            p_payment_proof_url: payload.payment_proof_url || null,
            p_funnel_id: funnel_id || null,
            p_macro_origin_id: macro_origin_id || null,
            p_micro_origin_id: micro_origin_id || null,
            p_micro_variation_id: micro_variation_id || null,
            p_nucleo_id: nucleo_id || null,
            p_kommo_contact_id: payload.kommo_contact_id ? parseInt(payload.kommo_contact_id) : null,
            p_kommo_lead_id: payload.kommo_lead_id ? parseInt(payload.kommo_lead_id) : null
        };

        const { data: rpcData, error: rpcError } = await supabaseClient
            .rpc('create_webhook_enrollment', rpcParams);

        if (rpcError) {
            console.error('RPC Error:', rpcError);
            throw new Error(`Failed to create enrollment via RPC: ${rpcError.message}`);
        }

        const result = {
            action: rpcData?.action || 'processed',
            enrollment: { id: rpcData?.id, ...rpcParams }
        };

        // ========== UPSERT LEAD (NO SOURCE COLUMN) ==========
        try {
            await supabaseClient.from('leads').upsert({
                name: student_name,
                email: email.toLowerCase().trim(),
                phone: payload.phone || null,
            }, { onConflict: 'email' });
        } catch (e) {
            console.warn('Lead upsert failed', e);
        }

        // ========== LOG SUCCESS ==========
        await supabaseClient.from('integration_logs').insert({
            source_system: 'n8n',
            event_type: result.action === 'created' ? 'enrollment_created' : 'enrollment_updated',
            status: 'success',
            enrollment_id: result.enrollment?.id,
            payload: { ...payload, created_entities: createdEntities },
        });

        return new Response(
            JSON.stringify({ success: true, ...result, created_entities: createdEntities }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return new Response(
            JSON.stringify({ error: error.message, created_entities: createdEntities }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
