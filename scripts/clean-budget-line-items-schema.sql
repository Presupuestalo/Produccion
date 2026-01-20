-- Limpiar esquema de budget_line_items eliminando columnas redundantes
-- Este script elimina concept_code que era redundante con code

-- Verificar si la columna concept_code existe antes de eliminarla
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'budget_line_items' 
        AND column_name = 'concept_code'
    ) THEN
        -- Primero copiar datos de concept_code a code si code está vacío
        UPDATE budget_line_items
        SET code = concept_code
        WHERE code IS NULL OR code = '';
        
        -- Eliminar la columna concept_code
        ALTER TABLE budget_line_items DROP COLUMN concept_code;
        
        RAISE NOTICE 'Columna concept_code eliminada y datos migrados a code';
    ELSE
        RAISE NOTICE 'Columna concept_code no existe, no hay nada que hacer';
    END IF;
END $$;
