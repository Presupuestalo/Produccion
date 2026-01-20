-- Mover TABIQUES PLADUR DOBLE CARA y FORMACIÓN TABIQUE LADRILLO a TABIQUES Y TRASDOSADOS
-- Este script actualiza los precios 02-A-04 y 02-A-05 para que estén en la categoría correcta

-- Primero, verificar que la categoría TABIQUES Y TRASDOSADOS existe
-- Si no existe, crearla
DO $$
DECLARE
  v_category_id UUID;
BEGIN
  -- Buscar la categoría TABIQUES Y TRASDOSADOS
  SELECT id INTO v_category_id
  FROM price_categories
  WHERE name = 'TABIQUES Y TRASDOSADOS';
  
  -- Si no existe, crearla
  IF v_category_id IS NULL THEN
    INSERT INTO price_categories (id, name, description, icon, display_order, is_active)
    VALUES (
      gen_random_uuid(),
      'TABIQUES Y TRASDOSADOS',
      'Tabiques de pladur, ladrillo y trasdosados',
      '🧱',
      9,
      true
    )
    RETURNING id INTO v_category_id;
    
    RAISE NOTICE 'Categoría TABIQUES Y TRASDOSADOS creada con ID: %', v_category_id;
  ELSE
    RAISE NOTICE 'Categoría TABIQUES Y TRASDOSADOS ya existe con ID: %', v_category_id;
  END IF;
  
  -- Actualizar ambos precios 02-A-04 y 02-A-05 a la nueva categoría
  UPDATE price_master
  SET category_id = v_category_id,
      updated_at = NOW()
  WHERE code IN ('02-A-04', '02-A-05');
  
  RAISE NOTICE 'Precios 02-A-04 y 02-A-05 actualizados a categoría TABIQUES Y TRASDOSADOS';
END $$;

-- Verificar el cambio
SELECT 
  pm.code,
  pm.subcategory,
  pc.name as categoria,
  pm.description
FROM price_master pm
JOIN price_categories pc ON pm.category_id = pc.id
WHERE pm.code IN ('02-A-03', '02-A-04', '02-A-05')
ORDER BY pm.code;
