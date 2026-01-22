-- Force creation of hierarchy tables if they are missing
-- Even if migration history says they ran, explicit checks are safer here

-- Nível 1: Funis (Funnels)
CREATE TABLE IF NOT EXISTS funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Nível 2: Origens Macro
CREATE TABLE IF NOT EXISTS macro_origins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES funnels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(funnel_id, name)
);

-- Nível 3: Origens Micro
CREATE TABLE IF NOT EXISTS micro_origins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  macro_origin_id UUID REFERENCES macro_origins(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(macro_origin_id, name)
);

-- Nível 4: Variações Micro
CREATE TABLE IF NOT EXISTS micro_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  micro_origin_id UUID REFERENCES micro_origins(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(micro_origin_id, name)
);

-- Nível 5: Nano Variações (que faltava)
CREATE TABLE IF NOT EXISTS nano_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  micro_variation_id UUID REFERENCES micro_variations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(micro_variation_id, name)
);

-- Ensure enrollments has FK columns
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS funnel_id UUID REFERENCES funnels(id);
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS macro_origin_id UUID REFERENCES macro_origins(id);
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS micro_origin_id UUID REFERENCES micro_origins(id);
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS micro_variation_id UUID REFERENCES micro_variations(id);

-- RLS Policies (Safely create if likely missing)
DO $$
BEGIN
    ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
    ALTER TABLE macro_origins ENABLE ROW LEVEL SECURITY;
    ALTER TABLE micro_origins ENABLE ROW LEVEL SECURITY;
    ALTER TABLE micro_variations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE nano_variations ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Policies (Drop first to avoid errors)
DROP POLICY IF EXISTS "Enable ALL funnels" ON funnels;
CREATE POLICY "Enable ALL funnels" ON funnels FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable ALL macro" ON macro_origins;
CREATE POLICY "Enable ALL macro" ON macro_origins FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable ALL micro" ON micro_origins;
CREATE POLICY "Enable ALL micro" ON micro_origins FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable ALL micro_var" ON micro_variations;
CREATE POLICY "Enable ALL micro_var" ON micro_variations FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable ALL nano" ON nano_variations;
CREATE POLICY "Enable ALL nano" ON nano_variations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
