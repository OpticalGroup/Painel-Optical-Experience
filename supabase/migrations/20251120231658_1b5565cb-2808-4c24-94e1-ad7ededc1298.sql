-- Add missing fields to enrollments table to match official sales spreadsheet

-- Purchase and lead tracking dates
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS purchase_date date,
ADD COLUMN IF NOT EXISTS lead_date date;

COMMENT ON COLUMN public.enrollments.purchase_date IS 'Data da compra/venda efetivada';
COMMENT ON COLUMN public.enrollments.lead_date IS 'Data de chegada do lead no funil';

-- Address information
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS zipcode text;

COMMENT ON COLUMN public.enrollments.address IS 'Endereço completo (rua, número, complemento)';
COMMENT ON COLUMN public.enrollments.city IS 'Cidade';
COMMENT ON COLUMN public.enrollments.state IS 'Estado/UF';
COMMENT ON COLUMN public.enrollments.zipcode IS 'CEP (apenas números)';

-- Product and documentation
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS product_name text DEFAULT 'Optical Experience',
ADD COLUMN IF NOT EXISTS payment_proof_url text,
ADD COLUMN IF NOT EXISTS observations text;

COMMENT ON COLUMN public.enrollments.product_name IS 'Nome do produto adquirido';
COMMENT ON COLUMN public.enrollments.payment_proof_url IS 'URL do comprovante de pagamento';
COMMENT ON COLUMN public.enrollments.observations IS 'Observações gerais sobre a matrícula';

-- UTM tracking parameters
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS utm_medium text,
ADD COLUMN IF NOT EXISTS utm_campaign text,
ADD COLUMN IF NOT EXISTS utm_term text,
ADD COLUMN IF NOT EXISTS utm_content text;

COMMENT ON COLUMN public.enrollments.utm_source IS 'UTM Source - origem do tráfego';
COMMENT ON COLUMN public.enrollments.utm_medium IS 'UTM Medium - meio de marketing';
COMMENT ON COLUMN public.enrollments.utm_campaign IS 'UTM Campaign - campanha específica';
COMMENT ON COLUMN public.enrollments.utm_term IS 'UTM Term - termo de pesquisa';
COMMENT ON COLUMN public.enrollments.utm_content IS 'UTM Content - variação do anúncio';

-- Form submission timestamp
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone;

COMMENT ON COLUMN public.enrollments.submitted_at IS 'Data/hora de submissão do formulário original';

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_enrollments_purchase_date ON public.enrollments(purchase_date);
CREATE INDEX IF NOT EXISTS idx_enrollments_lead_date ON public.enrollments(lead_date);
CREATE INDEX IF NOT EXISTS idx_enrollments_city ON public.enrollments(city);
CREATE INDEX IF NOT EXISTS idx_enrollments_zipcode ON public.enrollments(zipcode);
CREATE INDEX IF NOT EXISTS idx_enrollments_utm_source ON public.enrollments(utm_source);
CREATE INDEX IF NOT EXISTS idx_enrollments_utm_campaign ON public.enrollments(utm_campaign);