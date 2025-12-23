-- ============================================
-- Migration: Criar tabela nano_variations
-- Nível 6 da hierarquia de origens
-- ============================================

-- Criar tabela nano_variations
CREATE TABLE IF NOT EXISTS nano_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    micro_variation_id UUID NOT NULL REFERENCES micro_variations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_nano_variations_micro_variation 
ON nano_variations(micro_variation_id);

-- Habilitar RLS
ALTER TABLE nano_variations ENABLE ROW LEVEL SECURITY;

-- Política permissiva (ajuste conforme necessário)
CREATE POLICY "Allow all authenticated users" ON nano_variations
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- VERIFICAR: Adicionar product_id aos funnels se não existir
-- (para vincular funnels a produtos)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'funnels' AND column_name = 'product_id'
    ) THEN
        ALTER TABLE funnels ADD COLUMN product_id UUID REFERENCES products(id);
        CREATE INDEX idx_funnels_product ON funnels(product_id);
    END IF;
END $$;

-- ============================================
-- Comentários para documentação
-- ============================================
COMMENT ON TABLE nano_variations IS 'Nível 6 da hierarquia de origens: Variações Nano (sub-variações das variações micro)';
COMMENT ON COLUMN nano_variations.micro_variation_id IS 'FK para a variação micro pai';
