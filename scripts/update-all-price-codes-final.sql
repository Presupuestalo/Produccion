-- Script para actualizar TODOS los códigos de precios en price_master
-- para que coincidan con la nueva numeración de categorías

-- IMPORTANTE: Este script actualiza los códigos (ej: "01-D-01" → "01-D-01")
-- Y también actualiza el category_id para que apunte al UUID correcto de price_categories

-- Obtener los UUIDs de las categorías actuales
DO $$
DECLARE
  cat_derribos UUID;
  cat_albanileria UUID;
  cat_tabiques UUID;
  cat_fontaneria UUID;
  cat_carpinteria UUID;
  cat_electricidad UUID;
  cat_calefaccion UUID;
  cat_limpieza UUID;
  cat_pintura UUID;
  cat_materiales UUID;
  cat_ventanas UUID;
BEGIN
  -- Obtener UUIDs de las categorías
  SELECT id INTO cat_derribos FROM price_categories WHERE name = 'DERRIBOS' AND display_order = 1;
  SELECT id INTO cat_albanileria FROM price_categories WHERE name = 'ALBAÑILERÍA' AND display_order = 2;
  SELECT id INTO cat_tabiques FROM price_categories WHERE name = 'TABIQUES Y TRASDOSADOS' AND display_order = 3;
  SELECT id INTO cat_fontaneria FROM price_categories WHERE name = 'FONTANERÍA' AND display_order = 4;
  SELECT id INTO cat_carpinteria FROM price_categories WHERE name = 'CARPINTERÍA' AND display_order = 5;
  SELECT id INTO cat_electricidad FROM price_categories WHERE name = 'ELECTRICIDAD' AND display_order = 6;
  SELECT id INTO cat_calefaccion FROM price_categories WHERE name = 'CALEFACCIÓN' AND display_order = 7;
  SELECT id INTO cat_limpieza FROM price_categories WHERE name = 'LIMPIEZA' AND display_order = 8;
  SELECT id INTO cat_pintura FROM price_categories WHERE name = 'PINTURA' AND display_order = 9;
  SELECT id INTO cat_materiales FROM price_categories WHERE name = 'MATERIALES' AND display_order = 10;
  SELECT id INTO cat_ventanas FROM price_categories WHERE name = 'VENTANAS' AND display_order = 11;

  -- 1. DERRIBOS (01) - No cambiar códigos, solo asegurar category_id
  UPDATE price_master 
  SET category_id = cat_derribos
  WHERE code LIKE '01-D-%';

  -- 2. ALBAÑILERÍA (02) - No cambiar códigos, solo asegurar category_id
  UPDATE price_master 
  SET category_id = cat_albanileria
  WHERE code LIKE '02-A-%';

  -- 3. TABIQUES (03) - Cambiar de 02-T a 03-T
  UPDATE price_master 
  SET 
    code = REPLACE(code, '02-T-', '03-T-'),
    category_id = cat_tabiques
  WHERE code LIKE '02-T-%';

  -- 4. FONTANERÍA (04) - Cambiar de 03-F a 04-F
  UPDATE price_master 
  SET 
    code = REPLACE(code, '03-F-', '04-F-'),
    category_id = cat_fontaneria
  WHERE code LIKE '03-F-%';

  -- 5. CARPINTERÍA (05) - Cambiar de 04-C a 05-C
  UPDATE price_master 
  SET 
    code = REPLACE(code, '04-C-', '05-C-'),
    category_id = cat_carpinteria
  WHERE code LIKE '04-C-%';

  -- 6. ELECTRICIDAD (06) - Cambiar de 05-E a 06-E
  UPDATE price_master 
  SET 
    code = REPLACE(code, '05-E-', '06-E-'),
    category_id = cat_electricidad
  WHERE code LIKE '05-E-%';

  -- 7. CALEFACCIÓN (07) - Cambiar de 06-CAL a 07-CAL
  UPDATE price_master 
  SET 
    code = REPLACE(code, '06-CAL-', '07-CAL-'),
    category_id = cat_calefaccion
  WHERE code LIKE '06-CAL-%';

  -- 8. LIMPIEZA (08) - Cambiar de 07-L a 08-L
  UPDATE price_master 
  SET 
    code = REPLACE(code, '07-L-', '08-L-'),
    category_id = cat_limpieza
  WHERE code LIKE '07-L-%';

  -- 9. PINTURA (09) - Cambiar de 09-P a 09-P (ya está correcto)
  UPDATE price_master 
  SET category_id = cat_pintura
  WHERE code LIKE '09-P-%';

  -- 10. MATERIALES (10) - Cambiar de 08-M a 10-M
  UPDATE price_master 
  SET 
    code = REPLACE(code, '08-M-', '10-M-'),
    category_id = cat_materiales
  WHERE code LIKE '08-M-%';

  -- 11. VENTANAS (11) - Asegurar category_id
  UPDATE price_master 
  SET category_id = cat_ventanas
  WHERE code LIKE '11-V-%';

  RAISE NOTICE 'Códigos actualizados correctamente';
END $$;
