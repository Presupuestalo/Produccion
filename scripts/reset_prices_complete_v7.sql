-- Limpiar y resetear completamente el sistema de precios
-- Este script elimina todas las políticas RLS dinámicamente, limpia las tablas y las recrea desde cero

-- Paso 1: Eliminar todas las políticas RLS existentes de forma dinámica
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('price_categories', 'price_master', 'price_history')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Paso 2: Limpiar todas las tablas (esto eliminará todos los datos)
TRUNCATE TABLE price_history CASCADE;
TRUNCATE TABLE price_master CASCADE;
TRUNCATE TABLE price_categories CASCADE;

-- Paso 3: Insertar categorías
INSERT INTO price_categories (id, name, description, icon, display_order, is_active) VALUES
(gen_random_uuid(), 'DERRIBO', 'Trabajos de demolición y derribo', 'Hammer', 1, true),
(gen_random_uuid(), 'ALBANILERIA', 'Trabajos de albañilería', 'Brick', 2, true),
(gen_random_uuid(), 'FONTANERIA', 'Instalaciones de fontanería', 'Droplet', 3, true),
(gen_random_uuid(), 'CARPINTERIA', 'Trabajos de carpintería', 'Hammer', 4, true),
(gen_random_uuid(), 'ELECTRICIDAD', 'Instalaciones eléctricas', 'Zap', 5, true),
(gen_random_uuid(), 'CALEFACCION', 'Sistemas de calefacción', 'Flame', 6, true),
(gen_random_uuid(), 'LIMPIEZA', 'Limpieza y acabados', 'Sparkles', 7, true),
(gen_random_uuid(), 'MATERIALES', 'Materiales de construcción', 'Package', 8, true);

-- Paso 4: Insertar precios usando los IDs de categorías recién creados
WITH cats AS (
  SELECT id, name FROM price_categories
)
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active, is_custom, user_id) 
SELECT 
  gen_random_uuid(),
  code,
  category_id,
  subcategory,
  description,
  unit,
  labor_cost,
  material_cost,
  equipment_cost,
  other_cost,
  margin_percentage,
  is_active,
  is_custom,
  user_id
FROM (VALUES
  -- DERRIBO
  ('DER-001', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Tabiquería', 'Derribo de tabique de ladrillo hueco sencillo', 'm²', 8.00, 0.50, 0.00, 0.00, 0.15, true, false, NULL::uuid),
  ('DER-002', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Tabiquería', 'Derribo de tabique de ladrillo hueco doble', 'm²', 12.00, 0.75, 0.00, 0.00, 0.15, true, false, NULL::uuid),
  ('DER-003', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Pavimentos', 'Levantado de pavimento cerámico', 'm²', 6.00, 0.30, 0.00, 0.00, 0.15, true, false, NULL::uuid),
  ('DER-004', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Pavimentos', 'Levantado de pavimento de madera', 'm²', 5.00, 0.25, 0.00, 0.00, 0.15, true, false, NULL::uuid),
  ('DER-005', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Revestimientos', 'Picado de alicatado', 'm²', 7.00, 0.40, 0.00, 0.00, 0.15, true, false, NULL::uuid),
  
  -- ALBAÑILERÍA
  ('ALB-001', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Tabiquería', 'Tabique de ladrillo hueco sencillo', 'm²', 15.00, 8.50, 0.00, 0.00, 0.20, true, false, NULL::uuid),
  ('ALB-002', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Tabiquería', 'Tabique de ladrillo hueco doble', 'm²', 18.00, 12.00, 0.00, 0.00, 0.20, true, false, NULL::uuid),
  ('ALB-003', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Tabiquería', 'Tabique de pladur simple', 'm²', 12.00, 10.00, 0.00, 0.00, 0.20, true, false, NULL::uuid),
  ('ALB-004', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Revestimientos', 'Alicatado hasta 20x60', 'm²', 18.00, 15.00, 0.00, 0.00, 0.20, true, false, NULL::uuid),
  ('ALB-005', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Pavimentos', 'Solado cerámico hasta 60x60', 'm²', 16.00, 18.00, 0.00, 0.00, 0.20, true, false, NULL::uuid),
  
  -- FONTANERÍA
  ('FON-001', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Sanitarios', 'Inodoro suspendido con cisterna empotrada', 'ud', 80.00, 250.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
  ('FON-002', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Sanitarios', 'Lavabo con pedestal', 'ud', 60.00, 120.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
  ('FON-003', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Sanitarios', 'Plato de ducha de resina', 'ud', 100.00, 180.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
  ('FON-004', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Grifería', 'Grifo monomando lavabo', 'ud', 40.00, 85.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
  ('FON-005', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Grifería', 'Grifo termostático ducha', 'ud', 50.00, 150.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
  
  -- CARPINTERÍA
  ('CAR-001', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Puertas', 'Puerta interior lacada blanca 72,5cm', 'ud', 80.00, 180.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
  ('CAR-002', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Puertas', 'Puerta interior lacada blanca 82,5cm', 'ud', 85.00, 200.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
  ('CAR-003', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Armarios', 'Armario empotrado melamina 2 puertas correderas', 'm²', 120.00, 180.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
  ('CAR-004', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Ventanas', 'Ventana PVC blanco 2 hojas oscilobatiente', 'm²', 100.00, 250.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
  ('CAR-005', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Rodapiés', 'Rodapié lacado blanco 7cm', 'ml', 3.50, 4.50, 0.00, 0.00, 0.25, true, false, NULL::uuid),
  
  -- ELECTRICIDAD
  ('ELE-001', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Puntos de luz', 'Punto de luz sencillo', 'ud', 25.00, 8.00, 0.00, 0.00, 0.30, true, false, NULL::uuid),
  ('ELE-002', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Puntos de luz', 'Punto de luz conmutado', 'ud', 35.00, 12.00, 0.00, 0.00, 0.30, true, false, NULL::uuid),
  ('ELE-003', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Enchufes', 'Base de enchufe 16A', 'ud', 20.00, 6.00, 0.00, 0.00, 0.30, true, false, NULL::uuid),
  ('ELE-004', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Cuadros', 'Cuadro eléctrico 12 módulos', 'ud', 150.00, 180.00, 0.00, 0.00, 0.30, true, false, NULL::uuid),
  ('ELE-005', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Iluminación', 'Downlight LED empotrable 12W', 'ud', 15.00, 25.00, 0.00, 0.00, 0.30, true, false, NULL::uuid)
) AS t(code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active, is_custom, user_id);

-- Paso 5: Recrear políticas RLS

-- Políticas para price_categories (tabla pública de solo lectura)
CREATE POLICY "Ver categorías" ON price_categories
  FOR SELECT USING (true);

-- Políticas para price_master
CREATE POLICY "Ver precios base" ON price_master
  FOR SELECT USING (is_custom = false OR user_id = auth.uid());

CREATE POLICY "Crear precio personalizado" ON price_master
  FOR INSERT WITH CHECK (is_custom = true AND user_id = auth.uid());

CREATE POLICY "Actualizar precio propio" ON price_master
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Eliminar precio propio" ON price_master
  FOR DELETE USING (user_id = auth.uid());

-- Políticas para price_history usando changed_by en lugar de user_id
CREATE POLICY "Ver historial propio" ON price_history
  FOR SELECT USING (changed_by = auth.uid());

CREATE POLICY "Crear historial" ON price_history
  FOR INSERT WITH CHECK (changed_by = auth.uid());
