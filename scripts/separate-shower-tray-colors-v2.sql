-- Separar el plato de ducha en diferentes colores con precios ajustados
-- Este script debe ejecutarse DESPUÉS de fix-price-categories-id.sql

DO $$
DECLARE
  v_category_id TEXT;
  v_original_price NUMERIC;
BEGIN
  -- Obtener el ID de la categoría MATERIALES (o crearla si no existe)
  SELECT id INTO v_category_id
  FROM price_categories
  WHERE name = 'MATERIALES';
  
  IF v_category_id IS NULL THEN
    INSERT INTO price_categories (name, description)
    VALUES ('MATERIALES', 'Materiales de construcción')
    RETURNING id INTO v_category_id;
  END IF;

  -- Obtener el precio original del plato de ducha
  SELECT base_price INTO v_original_price
  FROM price_master
  WHERE id = '08-M-01';

  -- Actualizar el plato de ducha existente para especificar que es blanco
  UPDATE price_master
  SET 
    subcategory = 'PLATO DE DUCHA DE RESINA',
    color = 'Blanco',
    description = 'Plato de ducha de resina color blanco'
  WHERE id = '08-M-01';

  -- Crear entrada para plato de ducha negro
  INSERT INTO price_master (
    id, category_id, subcategory, description, unit,
    labor_cost, material_cost, equipment_cost, other_cost,
    color, is_custom, created_at, updated_at
  ) VALUES (
    '08-M-01-NEGRO',
    v_category_id,
    'PLATO DE DUCHA DE RESINA',
    'Plato de ducha de resina color negro',
    'Ud (Unidad)',
    0, v_original_price * 1.15, 0, 0,
    'Negro', false, NOW(), NOW()
  );

  -- Crear entrada para plato de ducha gris
  INSERT INTO price_master (
    id, category_id, subcategory, description, unit,
    labor_cost, material_cost, equipment_cost, other_cost,
    color, is_custom, created_at, updated_at
  ) VALUES (
    '08-M-01-GRIS',
    v_category_id,
    'PLATO DE DUCHA DE RESINA',
    'Plato de ducha de resina color gris',
    'Ud (Unidad)',
    0, v_original_price * 1.10, 0, 0,
    'Gris', false, NOW(), NOW()
  );

  -- Crear entrada para plato de ducha antracita
  INSERT INTO price_master (
    id, category_id, subcategory, description, unit,
    labor_cost, material_cost, equipment_cost, other_cost,
    color, is_custom, created_at, updated_at
  ) VALUES (
    '08-M-01-ANTRACITA',
    v_category_id,
    'PLATO DE DUCHA DE RESINA',
    'Plato de ducha de resina color antracita',
    'Ud (Unidad)',
    0, v_original_price * 1.12, 0, 0,
    'Antracita', false, NOW(), NOW()
  );

  RAISE NOTICE 'Platos de ducha separados por color correctamente';
END $$;
