-- Script completo para:
-- 1. Mover 02-A-03, 02-A-04, 02-A-05 de ALBAÑILERÍA a TABIQUES Y TRASDOSADOS
-- 2. Cambiar sus códigos de 02-A a 03-T
-- 3. Reordenar TODOS los códigos en cada categoría para que sean secuenciales (01, 02, 03...)

DO $$
DECLARE
  cat_tabiques UUID;
  cat_albanileria UUID;
  v_counter INT;
  v_row RECORD;
BEGIN
  -- Obtener UUIDs de las categorías
  SELECT id INTO cat_tabiques FROM price_categories WHERE name = 'TABIQUES Y TRASDOSADOS';
  SELECT id INTO cat_albanileria FROM price_categories WHERE name IN ('ALBAÑILERÍA', 'ALBANILERIA');

  -- Verificar que la categoría TABIQUES Y TRASDOSADOS existe
  IF cat_tabiques IS NULL THEN
    -- Crear la categoría si no existe
    INSERT INTO price_categories (id, name, description, icon, display_order, is_active)
    VALUES (
      gen_random_uuid(),
      'TABIQUES Y TRASDOSADOS',
      'Formación de tabiques y trasdosados',
      '🧱',
      3,
      true
    )
    RETURNING id INTO cat_tabiques;
    RAISE NOTICE 'Categoría TABIQUES Y TRASDOSADOS creada';
  END IF;

  RAISE NOTICE 'Moviendo 02-A-03, 02-A-04, 02-A-05 a TABIQUES Y TRASDOSADOS...';

  -- Paso 1: Mover los 3 precios a TABIQUES Y TRASDOSADOS y cambiar sus códigos
  UPDATE price_master
  SET 
    category_id = cat_tabiques,
    code = '03-T-01',
    updated_at = NOW()
  WHERE code = '02-A-03';

  UPDATE price_master
  SET 
    category_id = cat_tabiques,
    code = '03-T-02',
    updated_at = NOW()
  WHERE code = '02-A-04';

  UPDATE price_master
  SET 
    category_id = cat_tabiques,
    code = '03-T-03',
    updated_at = NOW()
  WHERE code = '02-A-05';

  RAISE NOTICE 'Precios movidos. Ahora reordenando todos los códigos...';

  -- Paso 2: Reordenar DERRIBOS (01-D-XX)
  v_counter := 1;
  FOR v_row IN (
    SELECT id, code 
    FROM price_master 
    WHERE code LIKE '01-D-%' 
    ORDER BY code
  ) LOOP
    UPDATE price_master 
    SET code = '01-D-' || LPAD(v_counter::text, 2, '0')
    WHERE id = v_row.id;
    v_counter := v_counter + 1;
  END LOOP;
  RAISE NOTICE 'DERRIBOS reordenado: % precios', v_counter - 1;

  -- Paso 3: Reordenar ALBAÑILERÍA (02-A-XX) - ahora sin los 3 que movimos
  v_counter := 1;
  FOR v_row IN (
    SELECT id, code 
    FROM price_master 
    WHERE code LIKE '02-A-%' 
    ORDER BY code
  ) LOOP
    UPDATE price_master 
    SET code = '02-A-' || LPAD(v_counter::text, 2, '0')
    WHERE id = v_row.id;
    v_counter := v_counter + 1;
  END LOOP;
  RAISE NOTICE 'ALBAÑILERÍA reordenado: % precios', v_counter - 1;

  -- Paso 4: Reordenar TABIQUES Y TRASDOSADOS (03-T-XX) - ahora con los 3 nuevos
  v_counter := 1;
  FOR v_row IN (
    SELECT id, code 
    FROM price_master 
    WHERE code LIKE '03-T-%' 
    ORDER BY code
  ) LOOP
    UPDATE price_master 
    SET code = '03-T-' || LPAD(v_counter::text, 2, '0')
    WHERE id = v_row.id;
    v_counter := v_counter + 1;
  END LOOP;
  RAISE NOTICE 'TABIQUES Y TRASDOSADOS reordenado: % precios', v_counter - 1;

  -- Paso 5: Reordenar FONTANERÍA (04-F-XX)
  v_counter := 1;
  FOR v_row IN (
    SELECT id, code 
    FROM price_master 
    WHERE code LIKE '04-F-%' OR code LIKE '03-F-%'
    ORDER BY code
  ) LOOP
    UPDATE price_master 
    SET code = '04-F-' || LPAD(v_counter::text, 2, '0')
    WHERE id = v_row.id;
    v_counter := v_counter + 1;
  END LOOP;
  RAISE NOTICE 'FONTANERÍA reordenado: % precios', v_counter - 1;

  -- Paso 6: Reordenar CARPINTERÍA (05-C-XX)
  v_counter := 1;
  FOR v_row IN (
    SELECT id, code 
    FROM price_master 
    WHERE code LIKE '05-C-%' OR code LIKE '04-C-%'
    ORDER BY code
  ) LOOP
    UPDATE price_master 
    SET code = '05-C-' || LPAD(v_counter::text, 2, '0')
    WHERE id = v_row.id;
    v_counter := v_counter + 1;
  END LOOP;
  RAISE NOTICE 'CARPINTERÍA reordenado: % precios', v_counter - 1;

  -- Paso 7: Reordenar ELECTRICIDAD (06-E-XX)
  v_counter := 1;
  FOR v_row IN (
    SELECT id, code 
    FROM price_master 
    WHERE code LIKE '06-E-%' OR code LIKE '05-E-%'
    ORDER BY code
  ) LOOP
    UPDATE price_master 
    SET code = '06-E-' || LPAD(v_counter::text, 2, '0')
    WHERE id = v_row.id;
    v_counter := v_counter + 1;
  END LOOP;
  RAISE NOTICE 'ELECTRICIDAD reordenado: % precios', v_counter - 1;

  -- Paso 8: Reordenar CALEFACCIÓN (07-CAL-XX)
  v_counter := 1;
  FOR v_row IN (
    SELECT id, code 
    FROM price_master 
    WHERE code LIKE '07-CAL-%' OR code LIKE '06-CAL-%'
    ORDER BY code
  ) LOOP
    UPDATE price_master 
    SET code = '07-CAL-' || LPAD(v_counter::text, 2, '0')
    WHERE id = v_row.id;
    v_counter := v_counter + 1;
  END LOOP;
  RAISE NOTICE 'CALEFACCIÓN reordenado: % precios', v_counter - 1;

  -- Paso 9: Reordenar LIMPIEZA (08-L-XX)
  v_counter := 1;
  FOR v_row IN (
    SELECT id, code 
    FROM price_master 
    WHERE code LIKE '08-L-%' OR code LIKE '07-L-%'
    ORDER BY code
  ) LOOP
    UPDATE price_master 
    SET code = '08-L-' || LPAD(v_counter::text, 2, '0')
    WHERE id = v_row.id;
    v_counter := v_counter + 1;
  END LOOP;
  RAISE NOTICE 'LIMPIEZA reordenado: % precios', v_counter - 1;

  -- Paso 10: Reordenar PINTURA (09-P-XX)
  v_counter := 1;
  FOR v_row IN (
    SELECT id, code 
    FROM price_master 
    WHERE code LIKE '09-P-%'
    ORDER BY code
  ) LOOP
    UPDATE price_master 
    SET code = '09-P-' || LPAD(v_counter::text, 2, '0')
    WHERE id = v_row.id;
    v_counter := v_counter + 1;
  END LOOP;
  RAISE NOTICE 'PINTURA reordenado: % precios', v_counter - 1;

  -- Paso 11: Reordenar MATERIALES (10-M-XX)
  v_counter := 1;
  FOR v_row IN (
    SELECT id, code 
    FROM price_master 
    WHERE code LIKE '10-M-%' OR code LIKE '08-M-%'
    ORDER BY code
  ) LOOP
    UPDATE price_master 
    SET code = '10-M-' || LPAD(v_counter::text, 2, '0')
    WHERE id = v_row.id;
    v_counter := v_counter + 1;
  END LOOP;
  RAISE NOTICE 'MATERIALES reordenado: % precios', v_counter - 1;

  RAISE NOTICE 'Todos los precios han sido reordenados correctamente';
END $$;

-- Mostrar resumen de cada categoría
SELECT 
  CASE 
    WHEN code LIKE '01-D-%' THEN '01. DERRIBOS'
    WHEN code LIKE '02-A-%' THEN '02. ALBAÑILERÍA'
    WHEN code LIKE '03-T-%' THEN '03. TABIQUES Y TRASDOSADOS'
    WHEN code LIKE '04-F-%' THEN '04. FONTANERÍA'
    WHEN code LIKE '05-C-%' THEN '05. CARPINTERÍA'
    WHEN code LIKE '06-E-%' THEN '06. ELECTRICIDAD'
    WHEN code LIKE '07-CAL-%' THEN '07. CALEFACCIÓN'
    WHEN code LIKE '08-L-%' THEN '08. LIMPIEZA'
    WHEN code LIKE '09-P-%' THEN '09. PINTURA'
    WHEN code LIKE '10-M-%' THEN '10. MATERIALES'
    ELSE 'OTROS'
  END as categoria,
  COUNT(*) as total_precios,
  MIN(code) as primer_codigo,
  MAX(code) as ultimo_codigo
FROM price_master
GROUP BY 
  CASE 
    WHEN code LIKE '01-D-%' THEN '01. DERRIBOS'
    WHEN code LIKE '02-A-%' THEN '02. ALBAÑILERÍA'
    WHEN code LIKE '03-T-%' THEN '03. TABIQUES Y TRASDOSADOS'
    WHEN code LIKE '04-F-%' THEN '04. FONTANERÍA'
    WHEN code LIKE '05-C-%' THEN '05. CARPINTERÍA'
    WHEN code LIKE '06-E-%' THEN '06. ELECTRICIDAD'
    WHEN code LIKE '07-CAL-%' THEN '07. CALEFACCIÓN'
    WHEN code LIKE '08-L-%' THEN '08. LIMPIEZA'
    WHEN code LIKE '09-P-%' THEN '09. PINTURA'
    WHEN code LIKE '10-M-%' THEN '10. MATERIALES'
    ELSE 'OTROS'
  END
ORDER BY categoria;
