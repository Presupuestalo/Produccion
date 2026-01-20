-- Script para mover los precios de tabiques y trasdosados de ALBAÑILERÍA (02) a TABIQUES Y TRASDOSADOS (03)
-- Los precios con códigos 02.01, 02.02, 02.03 que son de tabiques/trasdosados deben usar códigos 03-T-XX

BEGIN;

-- Obtener el ID de la categoría TABIQUES Y TRASDOSADOS
DO $$
DECLARE
  tabiques_category_id UUID;
BEGIN
  SELECT id INTO tabiques_category_id 
  FROM price_categories 
  WHERE name = 'TABIQUES Y TRASDOSADOS';

  -- Actualizar Trasdosado o Tabique de Pladur (02.01 -> 03-T-04)
  UPDATE price_master
  SET 
    code = '03-T-04',
    category_id = tabiques_category_id
  WHERE code IN ('02.01', '02-A-01') 
    AND (subcategory ILIKE '%trasdosado%' OR subcategory ILIKE '%tabique%pladur%');

  -- Actualizar Tabique de Ladrillo Cerámico (02.02 -> 03-T-05)
  UPDATE price_master
  SET 
    code = '03-T-05',
    category_id = tabiques_category_id
  WHERE code IN ('02.02', '02-A-02') 
    AND subcategory ILIKE '%tabique%ladrillo%';

  -- Actualizar Falso Techo de Pladur (02.03 -> 03-T-06)
  UPDATE price_master
  SET 
    code = '03-T-06',
    category_id = tabiques_category_id
  WHERE code IN ('02.03', '02-A-03') 
    AND subcategory ILIKE '%falso techo%';

  RAISE NOTICE 'Precios de tabiques actualizados a la categoría TABIQUES Y TRASDOSADOS';
END $$;

COMMIT;

-- Verificar los cambios
SELECT code, subcategory, category_id
FROM price_master
WHERE code LIKE '03-T-%'
ORDER BY code;
