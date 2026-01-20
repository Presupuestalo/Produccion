-- Limpiar y resetear completamente el sistema de precios
-- Este script elimina todas las políticas, limpia los datos y los recrea desde cero

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

-- Paso 2: Limpiar todas las tablas
TRUNCATE TABLE price_history CASCADE;
TRUNCATE TABLE price_master CASCADE;
TRUNCATE TABLE price_categories CASCADE;

-- Paso 3: Insertar categorías (sin user_id)
INSERT INTO price_categories (id, name, description, icon, display_order) VALUES
  (gen_random_uuid(), 'Derribo', 'Trabajos de demolición', '🔨', 0),
  (gen_random_uuid(), 'Albañilería', 'Trabajos de construcción y mampostería', '🧱', 1),
  (gen_random_uuid(), 'Fontanería', 'Instalaciones de agua y saneamiento', '🚰', 2),
  (gen_random_uuid(), 'Carpintería', 'Puertas, ventanas y trabajos en madera', '🚪', 3),
  (gen_random_uuid(), 'Electricidad', 'Instalaciones eléctricas', '⚡', 4),
  (gen_random_uuid(), 'Calefacción', 'Sistemas de calefacción', '🌡️', 5),
  (gen_random_uuid(), 'Limpieza', 'Limpieza final de obra', '🧹', 6),
  (gen_random_uuid(), 'Materiales', 'Materiales de construcción', '📦', 7);

-- Paso 4: Insertar precios usando los IDs de categorías recién creados
-- Primero obtenemos los IDs de las categorías
WITH cat_ids AS (
  SELECT id, name FROM price_categories
)

-- DERRIBO
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id)
SELECT 
  gen_random_uuid(),
  'DER-001',
  cat_ids.id,
  'Tabiquería',
  'Derribo de tabique de ladrillo hueco sencillo',
  'm²',
  8.00,
  0.50,
  0.00,
  0.00,
  false,
  NULL
FROM cat_ids WHERE cat_ids.name = 'Derribo'
UNION ALL
SELECT gen_random_uuid(), 'DER-002', cat_ids.id, 'Tabiquería', 'Derribo de tabique de ladrillo hueco doble', 'm²', 10.00, 0.75, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Derribo'
UNION ALL
SELECT gen_random_uuid(), 'DER-003', cat_ids.id, 'Solados', 'Levantado de solado cerámico', 'm²', 6.00, 0.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Derribo'
UNION ALL
SELECT gen_random_uuid(), 'DER-004', cat_ids.id, 'Solados', 'Levantado de solado de madera', 'm²', 7.00, 0.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Derribo'
UNION ALL
SELECT gen_random_uuid(), 'DER-005', cat_ids.id, 'Falsos techos', 'Desmontaje de falso techo de escayola', 'm²', 5.00, 0.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Derribo'
UNION ALL
SELECT gen_random_uuid(), 'DER-006', cat_ids.id, 'Falsos techos', 'Desmontaje de falso techo de pladur', 'm²', 4.50, 0.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Derribo'
UNION ALL
SELECT gen_random_uuid(), 'DER-007', cat_ids.id, 'Carpintería', 'Desmontaje de puerta interior', 'ud', 15.00, 0.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Derribo'
UNION ALL
SELECT gen_random_uuid(), 'DER-008', cat_ids.id, 'Carpintería', 'Desmontaje de ventana', 'ud', 20.00, 0.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Derribo'
UNION ALL
SELECT gen_random_uuid(), 'DER-009', cat_ids.id, 'Sanitarios', 'Desmontaje de inodoro', 'ud', 25.00, 0.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Derribo'
UNION ALL
SELECT gen_random_uuid(), 'DER-010', cat_ids.id, 'Sanitarios', 'Desmontaje de lavabo', 'ud', 20.00, 0.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Derribo';

-- ALBAÑILERÍA
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id)
SELECT gen_random_uuid(), 'ALB-001', cat_ids.id, 'Tabiquería', 'Tabique de ladrillo hueco sencillo 7cm', 'm²', 15.00, 8.50, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Albañilería'
UNION ALL
SELECT gen_random_uuid(), 'ALB-002', cat_ids.id, 'Tabiquería', 'Tabique de ladrillo hueco doble 9cm', 'm²', 18.00, 11.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Albañilería'
UNION ALL
SELECT gen_random_uuid(), 'ALB-003', cat_ids.id, 'Tabiquería', 'Tabique de pladur simple 70mm', 'm²', 12.00, 9.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Albañilería'
UNION ALL
SELECT gen_random_uuid(), 'ALB-004', cat_ids.id, 'Revestimientos', 'Enfoscado de cemento maestreado', 'm²', 10.00, 4.50, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Albañilería'
UNION ALL
SELECT gen_random_uuid(), 'ALB-005', cat_ids.id, 'Revestimientos', 'Alicatado con azulejo 20x20', 'm²', 18.00, 12.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Albañilería'
UNION ALL
SELECT gen_random_uuid(), 'ALB-006', cat_ids.id, 'Solados', 'Solado con gres porcelánico 60x60', 'm²', 20.00, 25.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Albañilería'
UNION ALL
SELECT gen_random_uuid(), 'ALB-007', cat_ids.id, 'Solados', 'Solado con tarima flotante', 'm²', 15.00, 18.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Albañilería'
UNION ALL
SELECT gen_random_uuid(), 'ALB-008', cat_ids.id, 'Falsos techos', 'Falso techo continuo de pladur', 'm²', 16.00, 12.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Albañilería';

-- FONTANERÍA
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id)
SELECT gen_random_uuid(), 'FON-001', cat_ids.id, 'Instalación', 'Instalación de lavabo con grifo', 'ud', 80.00, 120.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Fontanería'
UNION ALL
SELECT gen_random_uuid(), 'FON-002', cat_ids.id, 'Instalación', 'Instalación de inodoro', 'ud', 90.00, 150.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Fontanería'
UNION ALL
SELECT gen_random_uuid(), 'FON-003', cat_ids.id, 'Instalación', 'Instalación de ducha con mampara', 'ud', 200.00, 350.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Fontanería'
UNION ALL
SELECT gen_random_uuid(), 'FON-004', cat_ids.id, 'Instalación', 'Instalación de bañera', 'ud', 180.00, 400.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Fontanería'
UNION ALL
SELECT gen_random_uuid(), 'FON-005', cat_ids.id, 'Tuberías', 'Tubería de PVC evacuación Ø110mm', 'm', 8.00, 5.50, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Fontanería'
UNION ALL
SELECT gen_random_uuid(), 'FON-006', cat_ids.id, 'Tuberías', 'Tubería multicapa Ø20mm', 'm', 6.00, 4.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Fontanería';

-- CARPINTERÍA
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id)
SELECT gen_random_uuid(), 'CAR-001', cat_ids.id, 'Puertas', 'Puerta interior lacada blanca 72,5cm', 'ud', 80.00, 120.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Carpintería'
UNION ALL
SELECT gen_random_uuid(), 'CAR-002', cat_ids.id, 'Puertas', 'Puerta interior lacada blanca 82,5cm', 'ud', 85.00, 135.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Carpintería'
UNION ALL
SELECT gen_random_uuid(), 'CAR-003', cat_ids.id, 'Puertas', 'Puerta corredera empotrada', 'ud', 150.00, 280.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Carpintería'
UNION ALL
SELECT gen_random_uuid(), 'CAR-004', cat_ids.id, 'Ventanas', 'Ventana PVC 120x120cm', 'ud', 100.00, 250.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Carpintería'
UNION ALL
SELECT gen_random_uuid(), 'CAR-005', cat_ids.id, 'Armarios', 'Armario empotrado 2,40m', 'ud', 300.00, 450.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Carpintería';

-- ELECTRICIDAD
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id)
SELECT gen_random_uuid(), 'ELE-001', cat_ids.id, 'Puntos de luz', 'Punto de luz sencillo', 'ud', 35.00, 15.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Electricidad'
UNION ALL
SELECT gen_random_uuid(), 'ELE-002', cat_ids.id, 'Puntos de luz', 'Punto de luz conmutado', 'ud', 45.00, 20.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Electricidad'
UNION ALL
SELECT gen_random_uuid(), 'ELE-003', cat_ids.id, 'Enchufes', 'Base de enchufe', 'ud', 30.00, 12.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Electricidad'
UNION ALL
SELECT gen_random_uuid(), 'ELE-004', cat_ids.id, 'Cuadro eléctrico', 'Cuadro eléctrico vivienda 80m²', 'ud', 200.00, 180.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Electricidad'
UNION ALL
SELECT gen_random_uuid(), 'ELE-005', cat_ids.id, 'Mecanismos', 'Mecanismo interruptor', 'ud', 8.00, 5.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Electricidad';

-- CALEFACCIÓN
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id)
SELECT gen_random_uuid(), 'CAL-001', cat_ids.id, 'Radiadores', 'Radiador aluminio 600mm 6 elementos', 'ud', 80.00, 120.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Calefacción'
UNION ALL
SELECT gen_random_uuid(), 'CAL-002', cat_ids.id, 'Radiadores', 'Radiador aluminio 600mm 8 elementos', 'ud', 90.00, 150.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Calefacción'
UNION ALL
SELECT gen_random_uuid(), 'CAL-003', cat_ids.id, 'Calderas', 'Caldera de gas condensación 24kW', 'ud', 400.00, 1200.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Calefacción';

-- LIMPIEZA
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id)
SELECT gen_random_uuid(), 'LIM-001', cat_ids.id, 'Limpieza final', 'Limpieza final de obra', 'm²', 3.00, 1.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Limpieza';

-- MATERIALES
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id)
SELECT gen_random_uuid(), 'MAT-001', cat_ids.id, 'Cemento', 'Saco de cemento 25kg', 'ud', 0.00, 8.50, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Materiales'
UNION ALL
SELECT gen_random_uuid(), 'MAT-002', cat_ids.id, 'Arena', 'Arena de río m³', 'm³', 0.00, 25.00, 0.00, 0.00, false, NULL FROM cat_ids WHERE cat_ids.name = 'Materiales';

-- Paso 5: Recrear políticas RLS
-- Price Categories
CREATE POLICY "Todos pueden ver categorías activas"
  ON price_categories FOR SELECT
  USING (is_active = true);

-- Price Master
CREATE POLICY "Ver precios base"
  ON price_master FOR SELECT
  USING (is_custom = false OR user_id = auth.uid());

CREATE POLICY "Crear precios personalizados"
  ON price_master FOR INSERT
  WITH CHECK (is_custom = true AND user_id = auth.uid());

CREATE POLICY "Actualizar precios propios"
  ON price_master FOR UPDATE
  USING (is_custom = true AND user_id = auth.uid());

CREATE POLICY "Eliminar precios propios"
  ON price_master FOR DELETE
  USING (is_custom = true AND user_id = auth.uid());

-- Price History
CREATE POLICY "Ver historial propio"
  ON price_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Insertar historial propio"
  ON price_history FOR INSERT
  WITH CHECK (user_id = auth.uid());
