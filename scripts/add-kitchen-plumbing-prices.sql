-- ============================================================================
-- SCRIPT PARA AGREGAR NUEVOS CONCEPTOS DE FONTANERÍA AL CATÁLOGO MAESTRO
-- Conceptos: Montaje de Fregadero, Conexión Lavadora, Conexión Lavavajillas
-- ============================================================================

DO $$
DECLARE
  fontaneria_category_id UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
  -- 1. Montaje y colocación de fregadero
  INSERT INTO price_master (
    code, category_id, subcategory, description, unit, 
    labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_custom
  ) VALUES (
    '03-F-14', fontaneria_category_id, 'INSTALACIÓN FREGADERO COCINA', 
    'Montaje y colocación de fregadero, incluyendo fijación y sellado (No incluye suministro del fregadero).', 
    'Ud', 55.00, 15.00, 0, 0, 15, false
  ) ON CONFLICT (code) DO UPDATE SET
    description = EXCLUDED.description,
    labor_cost = EXCLUDED.labor_cost,
    material_cost = EXCLUDED.material_cost;

  -- 2. Conexión de lavadora
  INSERT INTO price_master (
    code, category_id, subcategory, description, unit, 
    labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_custom
  ) VALUES (
    '03-F-15', fontaneria_category_id, 'CONEXIONES DE LAVADORA', 
    'Conexión y puesta en marcha de lavadora a toma existente de agua y desagüe.', 
    'Ud', 30.00, 10.00, 0, 0, 15, false
  ) ON CONFLICT (code) DO UPDATE SET
    description = EXCLUDED.description,
    labor_cost = EXCLUDED.labor_cost,
    material_cost = EXCLUDED.material_cost;

  -- 3. Conexión de lavavajillas
  INSERT INTO price_master (
    code, category_id, subcategory, description, unit, 
    labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_custom
  ) VALUES (
    '03-F-16', fontaneria_category_id, 'CONEXION DE LAVAVAJILLAS', 
    'Conexión y puesta en marcha de lavavajillas a toma existente de agua y desagüe.', 
    'Ud', 30.00, 10.00, 0, 0, 15, false
  ) ON CONFLICT (code) DO UPDATE SET
    description = EXCLUDED.description,
    labor_cost = EXCLUDED.labor_cost,
    material_cost = EXCLUDED.material_cost;

  RAISE NOTICE 'Nuevos conceptos de Fontanería agregados correctamente.';
END $$;
