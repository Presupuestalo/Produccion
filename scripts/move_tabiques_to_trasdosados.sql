-- Mover TRASDOSADO desde ALBAÑILERÍA a TABIQUES Y TRASDOSADOS
-- Solo mueve el 02-A-03 que faltaba (los otros ya fueron movidos)

BEGIN;

-- ID de la categoría TABIQUES Y TRASDOSADOS
DO $$
DECLARE
    trasdosados_category_id UUID := 'c4c68527-3b91-4125-a96c-7db5a32a31f5';
BEGIN
    -- Mover FORMACIÓN DE TRASDOSADO EN PLACA DE YESO de 02-A-03 a 03-T-03
    UPDATE price_master 
    SET 
        code = '03-T-03',
        category_id = trasdosados_category_id,
        updated_at = NOW()
    WHERE code = '02-A-03';

    RAISE NOTICE 'Movido 02-A-03 (TRASDOSADO PLACA DE YESO) a 03-T-03';
END $$;

COMMIT;

-- Verificar el cambio
SELECT code, subcategory, category_id 
FROM price_master 
WHERE code = '03-T-03';
