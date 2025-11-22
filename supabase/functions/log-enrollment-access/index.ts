import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user email and profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', user.id)
      .single();

    const { cohortId, enrollmentIds } = await req.json();

    if (!cohortId || !enrollmentIds || !Array.isArray(enrollmentIds)) {
      return new Response(
        JSON.stringify({ error: 'cohortId and enrollmentIds array are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Logging access for user ${user.email} to ${enrollmentIds.length} enrollments in cohort ${cohortId}`);

    // Create audit log entry for accessing sensitive enrollment data
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        entity_type: 'enrollment_access',
        entity_id: cohortId,
        action: 'viewed',
        after_data: {
          cohort_id: cohortId,
          enrollment_count: enrollmentIds.length,
          enrollment_ids: enrollmentIds,
          accessed_at: new Date().toISOString(),
          user_name: profile?.full_name || 'Unknown',
        },
        user_id: user.id,
        user_email: profile?.email || user.email,
      });

    if (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail the request if audit logging fails, just log the error
    }

    return new Response(
      JSON.stringify({ success: true, logged: enrollmentIds.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in log-enrollment-access:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
