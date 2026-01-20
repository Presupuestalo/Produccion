-- Script para arreglar los nombres de campos en budget_line_items
-- El código estaba usando 'code' pero la tabla tiene 'concept_code'

-- Verificar que la columna concept_code existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'budget_line_items' 
        AND column_name = 'concept_code'
    ) THEN
        -- Si no existe, crearla
        ALTER TABLE budget_line_items ADD COLUMN concept_code TEXT;
        RAISE NOTICE 'Column concept_code added to budget_line_items';
    ELSE
        RAISE NOTICE 'Column concept_code already exists in budget_line_items';
    END IF;
END
$$;

-- Asegurarse de que no hay una columna 'code' antigua
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'budget_line_items' 
        AND column_name = 'code'
    ) THEN
        -- Si existe 'code', migrar datos a 'concept_code' y eliminar
        UPDATE budget_line_items 
        SET concept_code = code 
        WHERE concept_code IS NULL AND code IS NOT NULL;
        
        ALTER TABLE budget_line_items DROP COLUMN code;
        RAISE NOTICE 'Migrated data from code to concept_code and dropped old column';
    ELSE
        RAISE NOTICE 'No old code column found';
    END IF;
END
$$;

-- Verificar estructura final
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'budget_line_items' 
AND column_name IN ('concept_code', 'concept', 'description')
ORDER BY column_name;
