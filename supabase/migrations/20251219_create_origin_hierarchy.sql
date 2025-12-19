-- Migration: Create Origin Hierarchy Tables
-- Hierarquia: Funil > Origem Macro > Origem Micro > Variação Micro

-- ============================================
-- Nível 1: Funis (Funnels)
-- ============================================
CREATE TABLE IF NOT EXISTS funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Nível 2: Origens Macro
-- ============================================
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

-- ============================================
-- Nível 3: Origens Micro
-- ============================================
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

-- ============================================
-- Nível 4: Variações Micro
-- ============================================
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

-- ============================================
-- Adicionar colunas na tabela enrollments
-- ============================================
ALTER TABLE enrollments 
  ADD COLUMN IF NOT EXISTS funnel_id UUID REFERENCES funnels(id),
  ADD COLUMN IF NOT EXISTS macro_origin_id UUID REFERENCES macro_origins(id),
  ADD COLUMN IF NOT EXISTS micro_origin_id UUID REFERENCES micro_origins(id),
  ADD COLUMN IF NOT EXISTS micro_variation_id UUID REFERENCES micro_variations(id);

-- ============================================
-- Índices para performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_macro_origins_funnel ON macro_origins(funnel_id);
CREATE INDEX IF NOT EXISTS idx_micro_origins_macro ON micro_origins(macro_origin_id);
CREATE INDEX IF NOT EXISTS idx_micro_variations_micro ON micro_variations(micro_origin_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_funnel ON enrollments(funnel_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_macro_origin ON enrollments(macro_origin_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_micro_origin ON enrollments(micro_origin_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_micro_variation ON enrollments(micro_variation_id);

-- ============================================
-- RLS Policies para as novas tabelas
-- ============================================

-- Funnels
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON funnels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON funnels FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON funnels FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON funnels FOR DELETE TO authenticated USING (true);

-- Macro Origins
ALTER TABLE macro_origins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON macro_origins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON macro_origins FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON macro_origins FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON macro_origins FOR DELETE TO authenticated USING (true);

-- Micro Origins
ALTER TABLE micro_origins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON micro_origins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON micro_origins FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON micro_origins FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON micro_origins FOR DELETE TO authenticated USING (true);

-- Micro Variations
ALTER TABLE micro_variations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON micro_variations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON micro_variations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON micro_variations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON micro_variations FOR DELETE TO authenticated USING (true);

-- ============================================
-- Migrar dados existentes de source para macro_origins
-- ============================================

-- Criar funil padrão "Legado" para dados existentes
INSERT INTO funnels (name, description) 
VALUES ('Legado', 'Funil para origens migradas do sistema anterior')
ON CONFLICT (name) DO NOTHING;

-- Migrar origens existentes do enum para macro_origins
DO $$
DECLARE
  legacy_funnel_id UUID;
  source_val TEXT;
BEGIN
  SELECT id INTO legacy_funnel_id FROM funnels WHERE name = 'Legado';
  
  -- Inserir cada valor único de source como macro_origin
  FOR source_val IN 
    SELECT DISTINCT source::TEXT FROM enrollments WHERE source IS NOT NULL
  LOOP
    INSERT INTO macro_origins (funnel_id, name, description)
    VALUES (legacy_funnel_id, source_val, 'Migrado automaticamente do campo source')
    ON CONFLICT (funnel_id, name) DO NOTHING;
  END LOOP;
END $$;

-- Atualizar enrollments com os IDs das macro_origins correspondentes
UPDATE enrollments e
SET 
  funnel_id = (SELECT f.id FROM funnels f WHERE f.name = 'Legado'),
  macro_origin_id = (
    SELECT mo.id 
    FROM macro_origins mo 
    JOIN funnels f ON mo.funnel_id = f.id
    WHERE f.name = 'Legado' AND mo.name = e.source::TEXT
  )
WHERE e.source IS NOT NULL AND e.macro_origin_id IS NULL;

-- Migrar custom_enrollment_sources também
DO $$
DECLARE
  legacy_funnel_id UUID;
BEGIN
  SELECT id INTO legacy_funnel_id FROM funnels WHERE name = 'Legado';
  
  INSERT INTO macro_origins (funnel_id, name, description, active)
  SELECT legacy_funnel_id, ces.name, ces.description, ces.active
  FROM custom_enrollment_sources ces
  ON CONFLICT (funnel_id, name) DO NOTHING;
END $$;

-- ============================================
-- Comentários para documentação
-- ============================================
COMMENT ON TABLE funnels IS 'Nível 1 da hierarquia de origens - Funis de marketing';
COMMENT ON TABLE macro_origins IS 'Nível 2 da hierarquia - Origens Macro (agrupamento principal)';
COMMENT ON TABLE micro_origins IS 'Nível 3 da hierarquia - Origens Micro (detalhamento)';
COMMENT ON TABLE micro_variations IS 'Nível 4 da hierarquia - Variações (variantes de teste)';
