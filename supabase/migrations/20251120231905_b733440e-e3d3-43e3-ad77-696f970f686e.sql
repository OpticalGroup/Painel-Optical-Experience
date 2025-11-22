-- Expand enrollment_source enum to include all sources from official spreadsheet
-- This preserves the exact source names used in the real sales process

-- First, add new values to the enum
ALTER TYPE public.enrollment_source ADD VALUE IF NOT EXISTS 'Instagram Bio';
ALTER TYPE public.enrollment_source ADD VALUE IF NOT EXISTS 'Instagram Manychat';
ALTER TYPE public.enrollment_source ADD VALUE IF NOT EXISTS 'WEB - Downsell';
ALTER TYPE public.enrollment_source ADD VALUE IF NOT EXISTS 'Área de Membros FOTS';
ALTER TYPE public.enrollment_source ADD VALUE IF NOT EXISTS 'Tráfego Pago (Público Frio)';
ALTER TYPE public.enrollment_source ADD VALUE IF NOT EXISTS 'Tráfego Pago (Público Quente)';
ALTER TYPE public.enrollment_source ADD VALUE IF NOT EXISTS 'API Remarketing';
ALTER TYPE public.enrollment_source ADD VALUE IF NOT EXISTS 'Aluno Mentoria';
ALTER TYPE public.enrollment_source ADD VALUE IF NOT EXISTS 'Programa de Indicação';
ALTER TYPE public.enrollment_source ADD VALUE IF NOT EXISTS 'Não Rastreada';

-- Keep existing values for backward compatibility:
-- Instagram, Facebook, Indicação, Tráfego Pago, Direto, Outro

-- Note: "Tráfego Pago" is kept as a generic option
-- "Programa de Indicação" is more specific than "Indicação", both are available