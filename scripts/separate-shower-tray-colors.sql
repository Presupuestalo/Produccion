-- Script para separar el plato de ducha por colores
-- Crear entradas separadas para cada color de plato de ducha

-- Primero, obtener el category_id de MATERIALES
DO $$
DECLARE
  materiales_category_id UUID;
BEGIN
  -- Obtener el UUID de la categoría MATERIALES
  SELECT id INTO materiales_category_id 
  FROM price_categories 
  WHERE name = 'MATERIALES' 
  LIMIT 1;

  -- Si no existe, crearla
  IF materiales_category_id IS NULL THEN
    INSERT INTO price_categories (name, description)
    VALUES ('MATERIALES', 'Materiales de construcción')
    RETURNING id INTO materiales_category_id;
  END IF;

  -- Actualizar el plato de ducha blanco existente
  UPDATE public.price_master 
  SET 
    subcategory = 'PLATO DE DUCHA DE RESINA',
    color = 'Blanco',
    description = 'Plato de ducha de resina color blanco'
  WHERE id = '08-M-01';

  -- Crear entrada para plato de ducha negro
  INSERT INTO public.price_master (
    id, category_id, subcategory, description, unit, 
    labor_cost, material_cost, equipment_cost, other_cost,
    color, is_custom, created_at, updated_at
  ) VALUES (
    '08-M-01-NEGRO',
    materiales_category_id,
    'PLATO DE DUCHA DE RESINA',
    'Plato de ducha de resina color negro',
    'Ud (Unidad)',
    0,
    0,
    0,
    0,
    'Negro',
    false,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    color = EXCLUDED.color,
    description = EXCLUDED.description,
    updated_at = NOW();

  -- Crear entrada para plato de ducha gris
  INSERT INTO public.price_master (
    id, category_id, subcategory, description, unit, 
    labor_cost, material_cost, equipment_cost, other_cost,
    color, is_custom, created_at, updated_at
  ) VALUES (
    '08-M-01-GRIS',
    materiales_category_id,
    'PLATO DE DUCHA DE RESINA',
    'Plato de ducha de resina color gris',
    'Ud (Unidad)',
    0,
    0,
    0,
    0,
    'Gris',
    false,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    color = EXCLUDED.color,
    description = EXCLUDED.description,
    updated_at = NOW();

  -- Crear entrada para plato de ducha antracita
  INSERT INTO public.price_master (
    id, category_id, subcategory, description, unit, 
    labor_cost, material_cost, equipment_cost, other_cost,
    color, is_custom, created_at, updated_at
  ) VALUES (
    '08-M-01-ANTRACITA',
    materiales_category_id,
    'PLATO DE DUCHA DE RESINA',
    'Plato de ducha de resina color antracita',
    'Ud (Unidad)',
    0,
    0,
    0,
    0,
    'Antracita',
    false,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    color = EXCLUDED.color,
    description = EXCLUDED.description,
    updated_at = NOW();

END $$;
