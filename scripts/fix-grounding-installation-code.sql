-- Corrige el código de la partida de toma de tierra de 02-E-10 (Albañilería) a 06-E-18 (Electricidad)
-- Esto soluciona el problema de que aparezca en la categoría incorrecta en el presupuesto

DO $$
DECLARE
  v_category_id TEXT;
BEGIN
  -- 1. Buscar el ID de la categoría ELECTRICIDAD para asegurar que está en la categoría correcta
  SELECT id INTO v_category_id
  FROM price_categories
  WHERE name = 'ELECTRICIDAD' OR name = '06. ELECTRICIDAD'
  LIMIT 1;

  IF v_category_id IS NULL THEN
    RAISE NOTICE 'No se encontró la categoría ELECTRICIDAD, se mantendrá la actual si existe';
  END IF;

  -- 2. Actualizar el código y la categoría
  UPDATE price_master
  SET 
    code = '06-E-18',
    category_id = COALESCE(v_category_id, category_id), -- Usar la nueva categoría si se encontró, si no mantener la actual
    updated_at = NOW()
  WHERE code = '02-E-10';

  IF FOUND THEN
    RAISE NOTICE 'Código actualizado de 02-E-10 a 06-E-18 correctamente.';
  ELSE
    RAISE NOTICE 'No se encontró el código 02-E-10. Verificando si ya existe 06-E-18...';
    
    IF EXISTS (SELECT 1 FROM price_master WHERE code = '06-E-18') THEN
       RAISE NOTICE 'El código 06-E-18 ya existe.';
    ELSE
       RAISE NOTICE 'No se encontró 02-E-10 ni 06-E-18. Puede que necesites insertar el concepto primero.';
    END IF;
  END IF;

END $$;
