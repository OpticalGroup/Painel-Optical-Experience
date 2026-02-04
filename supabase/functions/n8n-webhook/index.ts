import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

serve(async (req) => {
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
        console.log('========== PAYLOAD RECEBIDO ==========');
        console.log(JSON.stringify(payload, null, 2));
        console.log('======================================');

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
                // Filter all cohorts that contain the month and match the year
                const matchingCohorts = cohorts?.filter((c: any) => {
                    const normalizedName = normalize(c.name);
                    const monthMatch = normalizedName.includes(normalizedMonth);
                    const yearMatch = c.year === cohort_year;

                    console.log(`Checking cohort: "${c.name}" (year: ${c.year})`);
                    console.log(`  - Normalized: "${normalizedName}"`);
                    console.log(`  - Looking for: "${normalizedMonth}"`);
                    console.log(`  - Month match: ${monthMatch}, Year match: ${yearMatch}`);

                    return monthMatch && yearMatch;
                }) || [];

                console.log(`Found ${matchingCohorts.length} matching cohorts for month "${cohort_month}" and year ${cohort_year}`);

                // Prioritize longer names (more specific cohorts)
                // Sort by name length descending, so "Turma de Março de 2026" comes before "Março"
                if (matchingCohorts.length > 0) {
                    matchingCohorts.sort((a: any, b: any) => b.name.length - a.name.length);
                    existingCohort = matchingCohorts[0];
                    console.log(`Selected cohort: "${existingCohort.name}" (chose from ${matchingCohorts.length} matches)`);
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
                        const { data: newProduct, error: productError } = await supabaseClient
                            .from('products')
                            .insert({
                                name: 'Optical Experience',
                                description: 'Produto padrão criado automaticamente',
                            })
                            .select('id')
                            .single();

                        if (productError) {
                            console.error('Product creation error:', productError);
                            throw new Error(`Failed to create default product: ${productError.message}`);
                        }
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

                    if (cohortError) {
                        console.error('Cohort creation error:', cohortError);
                        throw new Error(`Failed to create cohort: ${cohortError.message}`);
                    }
                    cohort_id = newCohort.id;
                    createdEntities.push(`Turma: ${standardizedName}`);
                } else {
                    cohort_id = existingCohort.id;
                }

            } else if (cohort_name) {
                // EXACT MATCHING: Find cohort by exact name match
                existingCohort = cohorts?.find((c: any) =>
                    c.name.toLowerCase().trim() === cohort_name.toLowerCase().trim()
                );

                if (existingCohort) {
                    cohort_id = existingCohort.id;
                } else {
                    // Create cohort with provided name
                    let { data: products } = await supabaseClient
                        .from('products')
                        .select('id')
                        .limit(1);

                    let product_id: string;

                    if (!products || products.length === 0) {
                        const { data: newProduct, error: productError } = await supabaseClient
                            .from('products')
                            .insert({
                                name: 'Optical Experience',
                                description: 'Produto padrão criado automaticamente',
                            })
                            .select('id')
                            .single();

                        if (productError) {
                            console.error('Product creation error:', productError);
                            throw new Error(`Failed to create default product: ${productError.message}`);
                        }
                        product_id = newProduct.id;
                        createdEntities.push('Produto: Optical Experience (padrão)');
                    } else {
                        product_id = products[0].id;
                    }

                    const { data: newCohort, error: cohortError } = await supabaseClient
                        .from('cohorts')
                        .insert({
                            name: cohort_name,
                            course_id: product_id,
                            location: payload.cohort_location || 'A definir',
                            start_date: payload.cohort_start_date || new Date().toISOString().split('T')[0],
                            year: cohort_year,
                            capacity: payload.cohort_capacity || 50,
                            status: 'open',
                        })
                        .select('id')
                        .single();

                    if (cohortError) {
                        console.error('Cohort creation error:', cohortError);
                        throw new Error(`Failed to create cohort: ${cohortError.message}`);
                    }
                    cohort_id = newCohort.id;
                    createdEntities.push(`Turma: ${cohort_name}`);
                }
            }
        }

        if (!cohort_id) {
            throw new Error('Missing required: cohort_id or cohort_name');
        }

        // ========== RESOLVE OR CREATE SELLER ==========
        const sales_rep = payload.sales_rep || 'Não identificado';

        if (sales_rep && sales_rep !== 'Não identificado') {
            // Check if seller exists
            const { data: sellers } = await supabaseClient
                .from('sellers')
                .select('id, name');

            const existingSeller = sellers?.find((s: any) =>
                s.name.toLowerCase().trim() === sales_rep.toLowerCase().trim()
            );

            if (!existingSeller) {
                // Create new seller
                const { data: newSeller, error: sellerError } = await supabaseClient
                    .from('sellers')
                    .insert({
                        name: sales_rep,
                        active: true,
                        email: null,
                        phone: null,
                    })
                    .select('id')
                    .single();

                if (!sellerError && newSeller) {
                    createdEntities.push(`Vendedor: ${sales_rep}`);
                }
            }
        }

        // ========== RESOLVE OR CREATE ORIGIN HIERARCHY ==========
        let funnel_id: string | undefined;
        let macro_origin_id: string | undefined;
        let micro_origin_id: string | undefined;
        let micro_variation_id: string | undefined;

        // 1. Funnel
        console.log(`[HIERARCHY] funnel_name: "${payload.funnel_name}"`);
        if (payload.funnel_name) {
            const result = await findOrCreateByName(
                supabaseClient,
                'funnels',
                payload.funnel_name,
                {},
                { description: 'Criado via N8N webhook' }
            );
            funnel_id = result.id;
            console.log(`[HIERARCHY] funnel_id resolved: ${funnel_id}`);
            if (result.created) createdEntities.push(`Funil: ${payload.funnel_name}`);
        }

        // 2. Macro Origin
        console.log(`[HIERARCHY] macro_origin: "${payload.macro_origin}", funnel_id: ${funnel_id}`);
        if (payload.macro_origin && funnel_id) {
            const result = await findOrCreateByName(
                supabaseClient,
                'macro_origins',
                payload.macro_origin,
                { funnel_id },
                { description: 'Criado via N8N webhook' }
            );
            macro_origin_id = result.id;
            console.log(`[HIERARCHY] macro_origin_id resolved: ${macro_origin_id}`);
            if (result.created) createdEntities.push(`Macro Origem: ${payload.macro_origin}`);
        }

        // 3. Micro Origin
        console.log(`[HIERARCHY] micro_origin: "${payload.micro_origin}", macro_origin_id: ${macro_origin_id}`);
        if (payload.micro_origin && macro_origin_id) {
            const result = await findOrCreateByName(
                supabaseClient,
                'micro_origins',
                payload.micro_origin,
                { macro_origin_id },
                { description: 'Criado via N8N webhook' }
            );
            micro_origin_id = result.id;
            console.log(`[HIERARCHY] micro_origin_id resolved: ${micro_origin_id}`);
            if (result.created) createdEntities.push(`Micro Origem: ${payload.micro_origin}`);
        }

        // 4. Micro Variation
        console.log(`[HIERARCHY] micro_variation: "${payload.micro_variation}", micro_origin_id: ${micro_origin_id}`);
        if (payload.micro_variation && micro_origin_id) {
            const result = await findOrCreateByName(
                supabaseClient,
                'micro_variations',
                payload.micro_variation,
                { micro_origin_id },
                { description: 'Criado via N8N webhook' }
            );
            micro_variation_id = result.id;
            console.log(`[HIERARCHY] micro_variation_id resolved: ${micro_variation_id}`);
            if (result.created) createdEntities.push(`Variação Micro: ${payload.micro_variation}`);
        }

        // ========== RESOLVE NUCLEO_ID FROM SELLER ==========
        let nucleo_id: string | undefined;

        if (sales_rep && sales_rep !== 'Não identificado') {
            const { data: sellers } = await supabaseClient
                .from('sellers')
                .select('id, name, nucleo_id')
                .ilike('name', sales_rep);

            const seller = sellers?.find((s: any) =>
                s.name.toLowerCase().trim() === sales_rep.toLowerCase().trim()
            );

            if (seller && seller.nucleo_id) {
                nucleo_id = seller.nucleo_id;
                console.log(`[NUCLEO] Found nucleo_id: ${nucleo_id} for seller: ${sales_rep}`);
            } else {
                console.log(`[NUCLEO] Seller "${sales_rep}" has no nucleo_id assigned`);
            }
        }

        // ========== CHECK FOR EXISTING ENROLLMENT ==========
        const { data: existingEnrollment } = await supabaseClient
            .from('enrollments')
            .select('id')
            .eq('email', email.toLowerCase().trim())
            .eq('cohort_id', cohort_id)
            .single();

        // ========== BUILD ENROLLMENT DATA FOR RPC (Updated) ==========
        const enrollmentData: Record<string, any> = {
            cohort_id,
            student_name,
            email: email.toLowerCase().trim(),
            cpf: payload.cpf || null,
            phone: payload.phone || null,
            sales_rep: payload.sales_rep || 'Não identificado',
            financial_status: payload.financial_status || 'pending',
            contract_status: payload.contract_status || 'pending',
            payment_details: payload.payment_details || 'Via N8N',
            payment_amount: payload.payment_amount || null,
            product_name: payload.product_name || null,
            purchase_date: payload.purchase_date || null,
            lead_date: payload.lead_date || null,
            address: payload.address || null,
            city: payload.city || null,
            state: payload.state || null,
            zipcode: payload.zipcode || null,
            observations: payload.observations || null,
            utm_source: payload.utm_source || null,
            utm_medium: payload.utm_medium || null,
            utm_campaign: payload.utm_campaign || null,
            utm_term: payload.utm_term || null,
            utm_content: payload.utm_content || null,
            utm_page: payload.utm_page || null,
            submitted_at: payload.submitted_at || null,
            payment_proof_url: payload.payment_proof_url || null,
            created_by: null, // N8N webhooks não têm usuário autenticado
        };

        // Add hierarchy IDs if resolved
        if (funnel_id) enrollmentData.funnel_id = funnel_id;
        if (macro_origin_id) enrollmentData.macro_origin_id = macro_origin_id;
        if (micro_origin_id) enrollmentData.micro_origin_id = micro_origin_id;
        if (micro_variation_id) enrollmentData.micro_variation_id = micro_variation_id;
        if (nucleo_id) enrollmentData.nucleo_id = nucleo_id;

        // Convert kommo IDs to integers
        if (payload.kommo_contact_id) {
            enrollmentData.kommo_contact_id = parseInt(payload.kommo_contact_id);
        }
        if (payload.kommo_lead_id) {
            enrollmentData.kommo_lead_id = parseInt(payload.kommo_lead_id);
        }

        let result;


        console.log('========== VERSION: NO_SOURCE_FIELD_V3 (Timestamp: ' + new Date().toISOString() + ') ==========');

        // Ensure source is absolutely gone
        if ('source' in enrollmentData) {
            console.warn('WARNING: source field found in enrollmentData, deleting it!');
            delete enrollmentData['source'];
        }

        console.log('EnrollmentData Keys:', Object.keys(enrollmentData));

        if (existingEnrollment) {
            // Update existing enrollment using direct update
            const { data: updated, error: updateError } = await supabaseClient
                .from('enrollments')
                .update({
                    ...enrollmentData,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingEnrollment.id)
                .select()
                .single();

            if (updateError) {
                console.error('Update error:', updateError);
                throw new Error(`Failed to update enrollment: ${updateError.message}`);
            }
            result = { action: 'updated', enrollment: updated };
        } else {
            // Create new enrollment using RPC (same as CSV import)
            const { data: created, error: createError } = await supabaseClient
                .rpc('rpc_insert_enrollment', { p_data: enrollmentData });

            if (createError) {
                console.error('RPC error:', createError);
                throw new Error(`Failed to create enrollment: ${createError.message}`);
            }
            result = { action: 'created', enrollment: created };
        }

        // ========== CREATE/UPDATE LEAD ==========
        try {
            await supabaseClient
                .from('leads')
                .upsert({
                    name: student_name,
                    email: email.toLowerCase().trim(),
                    phone: payload.phone || null,
                    source: enrollmentData.source,
                }, { onConflict: 'email' });
        } catch (leadError) {
            console.warn('Lead upsert failed (non-critical):', leadError);
        }

        // ========== LOG SUCCESS ==========
        await supabaseClient.from('integration_logs').insert({
            source_system: 'n8n',
            event_type: result.action === 'created' ? 'enrollment_created' : 'enrollment_updated',
            status: 'success',
            enrollment_id: result.enrollment?.id,
            payload: {
                ...payload,
                created_entities: createdEntities,
            },
        });

        return new Response(
            JSON.stringify({
                success: true,
                ...result,
                created_entities: createdEntities,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error processing N8N webhook:', error);

        return new Response(
            JSON.stringify({
                error: error.message,
                created_entities: createdEntities,
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
