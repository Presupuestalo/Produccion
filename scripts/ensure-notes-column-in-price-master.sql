-- Verificar que la columna notes existe en price_master
-- Esta columna ya debería existir según el esquema, pero este script lo asegura

DO $$
BEGIN
    -- Verificar si la columna notes NO existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'price_master' 
        AND column_name = 'notes'
    ) THEN
        -- Añadir la columna notes si no existe
        ALTER TABLE price_master ADD COLUMN notes TEXT;
        RAISE NOTICE 'Columna notes añadida a price_master';
    ELSE
        RAISE NOTICE 'La columna notes ya existe en price_master';
    END IF;
END $$;

-- Verificar el resultado
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'price_master' 
AND column_name = 'notes';
