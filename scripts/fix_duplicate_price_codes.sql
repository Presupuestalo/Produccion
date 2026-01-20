-- Script para limpiar códigos duplicados y restaurar el orden correcto
-- Este script maneja el problema de códigos duplicados de forma segura

BEGIN;

-- Paso 1: Identificar y mostrar duplicados actuales
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT code, COUNT(*) as cnt
        FROM price_master
        WHERE code IN ('02-A-03', '02-A-04', '02-A-05', '03-T-01', '03-T-02', '03-T-03')
        GROUP BY code
        HAVING COUNT(*) > 1
    ) duplicates;
    
    RAISE NOTICE 'Códigos duplicados encontrados: %', duplicate_count;
END $$;

-- Paso 2: Eliminar duplicados manteniendo el registro más reciente de cada código
DELETE FROM price_master
WHERE id IN (
    SELECT id FROM (
        SELECT id, code,
               ROW_NUMBER() OVER (PARTITION BY code ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC) as rn
        FROM price_master
        WHERE code IN ('02-A-03', '02-A-04', '02-A-05', '03-T-01', '03-T-02', '03-T-03')
    ) t
    WHERE rn > 1
);

-- Paso 3: Verificar qué códigos existen ahora
-- Corregido: concept → description, category → category_id
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Códigos existentes después de limpieza:';
    FOR rec IN 
        SELECT code, description, category_id 
        FROM price_master 
        WHERE code LIKE '02-A-%' OR code LIKE '03-T-%'
        ORDER BY code
    LOOP
        RAISE NOTICE 'Código: %, Descripción: %, Categoría ID: %', rec.code, rec.description, rec.category_id;
    END LOOP;
END $$;

-- Paso 4: Si los precios están en 03-T-*, moverlos de vuelta a 02-A-* (revertir cambios)
-- Solo si NO existen ya los códigos 02-A-03, 02-A-04, 02-A-05
-- Corregido: concept → description, category → category_id

UPDATE price_master
SET 
    code = '02-A-03',
    category_id = (SELECT id FROM price_categories WHERE name = 'ALBAÑILERÍA' LIMIT 1)
WHERE code = '03-T-01'
  AND description LIKE '%TRASDOSADO EN PLACA DE YESO%'
  AND NOT EXISTS (SELECT 1 FROM price_master WHERE code = '02-A-03' AND id != price_master.id);

UPDATE price_master
SET 
    code = '02-A-04',
    category_id = (SELECT id FROM price_categories WHERE name = 'ALBAÑILERÍA' LIMIT 1)
WHERE code = '03-T-02'
  AND description LIKE '%TABIQUE LADRILLO%'
  AND NOT EXISTS (SELECT 1 FROM price_master WHERE code = '02-A-04' AND id != price_master.id);

UPDATE price_master
SET 
    code = '02-A-05',
    category_id = (SELECT id FROM price_categories WHERE name = 'ALBAÑILERÍA' LIMIT 1)
WHERE code = '03-T-03'
  AND description LIKE '%TABIQUE PLACA DE YESO%'
  AND NOT EXISTS (SELECT 1 FROM price_master WHERE code = '02-A-05' AND id != price_master.id);

-- Paso 5: Reordenar secuencialmente todos los códigos de ALBAÑILERÍA para eliminar huecos
-- Corregido: category → category_id
WITH numbered_prices AS (
    SELECT 
        id,
        code,
        ROW_NUMBER() OVER (ORDER BY 
            CASE 
                WHEN code ~ '^[0-9]+-[A-Z]+-[0-9]+$' THEN
                    CAST(SPLIT_PART(code, '-', 3) AS INTEGER)
                ELSE 999
            END,
            code
        ) as new_number
    FROM price_master
    WHERE category_id = (SELECT id FROM price_categories WHERE name = 'ALBAÑILERÍA' LIMIT 1)
        AND code LIKE '02-A-%'
)
UPDATE price_master pm
SET code = '02-A-' || LPAD(np.new_number::TEXT, 2, '0')
FROM numbered_prices np
WHERE pm.id = np.id
    AND pm.code != '02-A-' || LPAD(np.new_number::TEXT, 2, '0');

-- Paso 6: Verificar el resultado final
-- Corregido: concept → description, category → category_id
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Códigos finales de ALBAÑILERÍA:';
    FOR rec IN 
        SELECT code, description 
        FROM price_master 
        WHERE category_id = (SELECT id FROM price_categories WHERE name = 'ALBAÑILERÍA' LIMIT 1)
        ORDER BY code
    LOOP
        RAISE NOTICE 'Código: %, Descripción: %', rec.code, rec.description;
    END LOOP;
END $$;

COMMIT;
