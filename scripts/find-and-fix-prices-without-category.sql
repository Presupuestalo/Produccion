-- Script para identificar y corregir precios maestros sin category_id

-- Paso 1: Identificar precios sin category_id
SELECT 
    id,
    code,
    subcategory,
    description,
    unit,
    labor_cost,
    material_cost
FROM price_master
WHERE category_id IS NULL
ORDER BY code;

-- Paso 2: Una vez identificados los 4 precios, asignarles la categoría correcta
-- Descomenta y ajusta las líneas siguientes según corresponda:

/*
-- Si son precios de DERRIBO:
UPDATE price_master
SET category_id = (SELECT id FROM price_categories WHERE name = 'DERRIBO')
WHERE category_id IS NULL AND code IN ('codigo1', 'codigo2');

-- Si son precios de ALBAÑILERÍA:
UPDATE price_master
SET category_id = (SELECT id FROM price_categories WHERE name = 'ALBANILERIA')
WHERE category_id IS NULL AND code IN ('codigo3');

-- Si son precios de FONTANERÍA:
UPDATE price_master
SET category_id = (SELECT id FROM price_categories WHERE name = 'FONTANERIA')
WHERE category_id IS NULL AND code IN ('codigo4');

-- O si son precios de otras categorías disponibles:
-- CARPINTERIA, ELECTRICIDAD, CALEFACCION, LIMPIEZA, MATERIALES
*/

-- Paso 3: Verificar que ya no quedan precios sin categoría
SELECT COUNT(*) as precios_sin_categoria
FROM price_master
WHERE category_id IS NULL;
