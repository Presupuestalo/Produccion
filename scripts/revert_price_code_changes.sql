-- Revertir los cambios de códigos de precios para recuperar la consistencia del presupuesto
-- Este script revierte los 3 códigos que se movieron de ALBAÑILERÍA a TABIQUES Y TRASDOSADOS

BEGIN;

-- 1. Primero, volver a poner los 3 precios en su categoría original (ALBAÑILERÍA)
UPDATE price_master
SET 
  code = '02-A-03',
  category_id = (SELECT id FROM price_categories WHERE name = 'ALBAÑILERÍA' LIMIT 1)
WHERE subcategory LIKE '%TRASDOSADO EN PLACA DE YESO%'
  OR subcategory LIKE '%FORMACIÓN DE TRASDOSADO%';

UPDATE price_master
SET 
  code = '02-A-04',
  category_id = (SELECT id FROM price_categories WHERE name = 'ALBAÑILERÍA' LIMIT 1)
WHERE subcategory LIKE '%TABIQUE LADRILLO%'
  OR subcategory LIKE '%FORMACIÓN TABIQUE LADRILLO%';

UPDATE price_master
SET 
  code = '02-A-05',
  category_id = (SELECT id FROM price_categories WHERE name = 'ALBAÑILERÍA' LIMIT 1)
WHERE subcategory LIKE '%TABIQUE PLACA DE YESO%'
  OR subcategory LIKE '%TABIQUE PLACA DE YESO A DOBLE CARA%';

-- 2. Verificar los cambios
SELECT 
  code,
  subcategory,
  (SELECT name FROM price_categories WHERE id = category_id) as categoria
FROM price_master
WHERE code IN ('02-A-03', '02-A-04', '02-A-05')
ORDER BY code;

-- 3. Opcional: Si ya había códigos con la nueva numeración en TABIQUES, eliminarlos
DELETE FROM price_master
WHERE code IN ('03-T-01', '03-T-02', '03-T-03')
  AND (subcategory LIKE '%TRASDOSADO%' OR subcategory LIKE '%TABIQUE%');

COMMIT;

-- Verificar que los presupuestos ahora vuelven a tener las referencias correctas
SELECT 
  bli.concept_code,
  bli.concept,
  bli.description,
  COUNT(*) as veces_usado
FROM budget_line_items bli
WHERE bli.concept_code IN ('02-A-03', '02-A-04', '02-A-05')
GROUP BY bli.concept_code, bli.concept, bli.description
ORDER BY bli.concept_code;
