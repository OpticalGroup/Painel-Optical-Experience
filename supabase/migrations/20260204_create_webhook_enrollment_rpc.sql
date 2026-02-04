-- Create a specific RPC function for the N8N webhook
-- This bypasses any issues with the JS client schema inference
CREATE OR REPLACE FUNCTION create_webhook_enrollment(
    p_cohort_id UUID,
    p_student_name TEXT,
    p_email TEXT,
    p_cpf TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_sales_rep TEXT DEFAULT NULL,
    p_financial_status TEXT DEFAULT 'pending',
    p_contract_status TEXT DEFAULT 'pending',
    p_payment_details TEXT DEFAULT NULL,
    p_payment_amount NUMERIC DEFAULT NULL,
    p_product_name TEXT DEFAULT NULL,
    p_purchase_date DATE DEFAULT NULL,
    p_lead_date DATE DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_zipcode TEXT DEFAULT NULL,
    p_observations TEXT DEFAULT NULL,
    p_utm_source TEXT DEFAULT NULL,
    p_utm_medium TEXT DEFAULT NULL,
    p_utm_campaign TEXT DEFAULT NULL,
    p_utm_term TEXT DEFAULT NULL,
    p_utm_content TEXT DEFAULT NULL,
    p_utm_page TEXT DEFAULT NULL,
    p_submitted_at TIMESTAMPTZ DEFAULT NULL,
    p_payment_proof_url TEXT DEFAULT NULL,
    p_funnel_id UUID DEFAULT NULL,
    p_macro_origin_id UUID DEFAULT NULL,
    p_micro_origin_id UUID DEFAULT NULL,
    p_micro_variation_id UUID DEFAULT NULL,
    p_nucleo_id UUID DEFAULT NULL,
    p_kommo_contact_id INTEGER DEFAULT NULL,
    p_kommo_lead_id INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with admin privileges
AS $$
DECLARE
    v_enrollment_id UUID;
    v_result JSONB;
BEGIN
    -- Check if enrollment exists
    SELECT id INTO v_enrollment_id
    FROM enrollments
    WHERE email = lower(trim(p_email)) AND cohort_id = p_cohort_id
    LIMIT 1;

    IF v_enrollment_id IS NOT NULL THEN
        -- Update existing
        UPDATE enrollments
        SET
            student_name = p_student_name,
            cpf = COALESCE(p_cpf, cpf),
            phone = COALESCE(p_phone, phone),
            sales_rep = COALESCE(p_sales_rep, sales_rep),
            financial_status = COALESCE(p_financial_status, financial_status),
            contract_status = COALESCE(p_contract_status, contract_status),
            payment_details = COALESCE(p_payment_details, payment_details),
            payment_amount = COALESCE(p_payment_amount, payment_amount),
            product_name = COALESCE(p_product_name, product_name),
            purchase_date = COALESCE(p_purchase_date, purchase_date),
            lead_date = COALESCE(p_lead_date, lead_date),
            address = COALESCE(p_address, address),
            city = COALESCE(p_city, city),
            state = COALESCE(p_state, state),
            zipcode = COALESCE(p_zipcode, zipcode),
            observations = COALESCE(p_observations, observations),
            utm_source = COALESCE(p_utm_source, utm_source),
            utm_medium = COALESCE(p_utm_medium, utm_medium),
            utm_campaign = COALESCE(p_utm_campaign, utm_campaign),
            utm_term = COALESCE(p_utm_term, utm_term),
            utm_content = COALESCE(p_utm_content, utm_content),
            utm_page = COALESCE(p_utm_page, utm_page),
            submitted_at = COALESCE(p_submitted_at, submitted_at),
            payment_proof_url = COALESCE(p_payment_proof_url, payment_proof_url),
            funnel_id = COALESCE(p_funnel_id, funnel_id),
            macro_origin_id = COALESCE(p_macro_origin_id, macro_origin_id),
            micro_origin_id = COALESCE(p_micro_origin_id, micro_origin_id),
            micro_variation_id = COALESCE(p_micro_variation_id, micro_variation_id),
            nucleo_id = COALESCE(p_nucleo_id, nucleo_id),
            kommo_contact_id = COALESCE(p_kommo_contact_id, kommo_contact_id),
            kommo_lead_id = COALESCE(p_kommo_lead_id, kommo_lead_id),
            updated_at = NOW()
        WHERE id = v_enrollment_id;
        
        v_result := jsonb_build_object('action', 'updated', 'id', v_enrollment_id);
    ELSE
        -- Insert new
        INSERT INTO enrollments (
            cohort_id, student_name, email, cpf, phone, sales_rep,
            financial_status, contract_status, payment_details, payment_amount,
            product_name, purchase_date, lead_date, address, city, state, zipcode,
            observations, utm_source, utm_medium, utm_campaign, utm_term,
            utm_content, utm_page, submitted_at, payment_proof_url,
            funnel_id, macro_origin_id, micro_origin_id, micro_variation_id,
            nucleo_id, kommo_contact_id, kommo_lead_id
        ) VALUES (
            p_cohort_id, p_student_name, lower(trim(p_email)), p_cpf, p_phone, p_sales_rep,
            p_financial_status, p_contract_status, p_payment_details, p_payment_amount,
            p_product_name, p_purchase_date, p_lead_date, p_address, p_city, p_state, p_zipcode,
            p_observations, p_utm_source, p_utm_medium, p_utm_campaign, p_utm_term,
            p_utm_content, p_utm_page, p_submitted_at, p_payment_proof_url,
            p_funnel_id, p_macro_origin_id, p_micro_origin_id, p_micro_variation_id,
            p_nucleo_id, p_kommo_contact_id, p_kommo_lead_id
        )
        RETURNING id INTO v_enrollment_id;
        
        v_result := jsonb_build_object('action', 'created', 'id', v_enrollment_id);
    END IF;

    RETURN v_result;
END;
$$;
