-- Simplificar la estructura de budget_line_items
-- Eliminar columnas innecesarias y mantener solo lo esencial

-- Eliminar concept_code (redundante con code y confuso)
ALTER TABLE budget_line_items DROP COLUMN IF EXISTS concept_code;

-- Eliminar notes (no se usan en presupuestos)
ALTER TABLE budget_line_items DROP COLUMN IF EXISTS notes;

-- Asegurar que tenemos las columnas correctas
-- code: código del precio (ej: "01-D-01")
-- concept: subcategoría del precio (ej: "Recolocar caldera")
-- description: descripción completa
-- unit: unidad (Ud, m², etc)
-- quantity: cantidad
-- unit_price: precio unitario final
-- total_price: total calculado
-- base_price_id: referencia a price_master.id
-- price_type: master/custom/imported

-- Detectar el tipo de price_master.id y crear base_price_id con el tipo correcto
DO $$
DECLARE
    price_master_id_type TEXT;
BEGIN
    -- Obtener el tipo de datos de price_master.id
    SELECT data_type INTO price_master_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'price_master'
      AND column_name = 'id';
    
    RAISE NOTICE 'Tipo de price_master.id: %', price_master_id_type;
    
    -- Verificar que existan las columnas necesarias
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='budget_line_items' AND column_name='code') THEN
        ALTER TABLE budget_line_items ADD COLUMN code TEXT;
        RAISE NOTICE 'Añadida columna code';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='budget_line_items' AND column_name='base_price_id') THEN
        -- Crear columna con el tipo correcto según price_master.id
        IF price_master_id_type = 'uuid' THEN
            ALTER TABLE budget_line_items ADD COLUMN base_price_id UUID REFERENCES price_master(id);
            RAISE NOTICE 'Añadida columna base_price_id (UUID)';
        ELSE
            ALTER TABLE budget_line_items ADD COLUMN base_price_id TEXT REFERENCES price_master(id);
            RAISE NOTICE 'Añadida columna base_price_id (TEXT)';
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='budget_line_items' AND column_name='price_type') THEN
        ALTER TABLE budget_line_items ADD COLUMN price_type TEXT DEFAULT 'master' CHECK (price_type IN ('master', 'custom', 'imported'));
        RAISE NOTICE 'Añadida columna price_type';
    END IF;
END $$;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_budget_line_items_code ON budget_line_items(code);
CREATE INDEX IF NOT EXISTS idx_budget_line_items_base_price_id ON budget_line_items(base_price_id);
CREATE INDEX IF NOT EXISTS idx_budget_line_items_price_type ON budget_line_items(price_type);
