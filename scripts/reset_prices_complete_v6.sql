-- Eliminar todas las políticas RLS existentes de forma dinámica
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

-- Limpiar todas las tablas
TRUNCATE TABLE price_history CASCADE;
TRUNCATE TABLE price_master CASCADE;
TRUNCATE TABLE price_categories CASCADE;

-- Insertar categorías
INSERT INTO price_categories (id, name, description, icon, display_order, is_active) VALUES
(gen_random_uuid(), 'DERRIBO', 'Trabajos de demolición y derribo', '🔨', 1, true),
(gen_random_uuid(), 'ALBANILERIA', 'Trabajos de albañilería', '🧱', 2, true),
(gen_random_uuid(), 'FONTANERIA', 'Instalaciones de fontanería', '🚰', 3, true),
(gen_random_uuid(), 'CARPINTERIA', 'Trabajos de carpintería', '🪵', 4, true),
(gen_random_uuid(), 'ELECTRICIDAD', 'Instalaciones eléctricas', '⚡', 5, true),
(gen_random_uuid(), 'CALEFACCION', 'Sistemas de calefacción', '🔥', 6, true),
(gen_random_uuid(), 'LIMPIEZA', 'Limpieza y acabados', '🧹', 7, true),
(gen_random_uuid(), 'MATERIALES', 'Materiales de construcción', '📦', 8, true);

-- Insertar precios usando los IDs de categorías recién creados
WITH cats AS (
  SELECT id, name FROM price_categories
)
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active, is_custom, user_id) VALUES
-- DERRIBO
(gen_random_uuid(), 'DER-001', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Tabiquería', 'Derribo de tabique de ladrillo hueco sencillo', 'm²', 8.00, 0.50, 0.00, 0.00, 0.15, true, false, NULL::uuid),
(gen_random_uuid(), 'DER-002', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Tabiquería', 'Derribo de tabique de ladrillo hueco doble', 'm²', 10.00, 0.75, 0.00, 0.00, 0.15, true, false, NULL::uuid),
(gen_random_uuid(), 'DER-003', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Pavimentos', 'Levantado de pavimento cerámico', 'm²', 6.00, 0.00, 0.00, 0.00, 0.15, true, false, NULL::uuid),
(gen_random_uuid(), 'DER-004', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Pavimentos', 'Levantado de pavimento de madera', 'm²', 7.00, 0.00, 0.00, 0.00, 0.15, true, false, NULL::uuid),
(gen_random_uuid(), 'DER-005', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Revestimientos', 'Picado de alicatado en paredes', 'm²', 5.50, 0.00, 0.00, 0.00, 0.15, true, false, NULL::uuid),
(gen_random_uuid(), 'DER-006', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Sanitarios', 'Desmontaje de inodoro', 'ud', 25.00, 0.00, 0.00, 0.00, 0.15, true, false, NULL::uuid),
(gen_random_uuid(), 'DER-007', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Sanitarios', 'Desmontaje de lavabo', 'ud', 20.00, 0.00, 0.00, 0.00, 0.15, true, false, NULL::uuid),
(gen_random_uuid(), 'DER-008', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Sanitarios', 'Desmontaje de bañera', 'ud', 45.00, 0.00, 0.00, 0.00, 0.15, true, false, NULL::uuid),

-- ALBAÑILERÍA
(gen_random_uuid(), 'ALB-001', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Tabiquería', 'Tabique de ladrillo hueco sencillo 7cm', 'm²', 18.00, 12.00, 0.00, 0.00, 0.20, true, false, NULL::uuid),
(gen_random_uuid(), 'ALB-002', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Tabiquería', 'Tabique de ladrillo hueco doble 9cm', 'm²', 22.00, 15.00, 0.00, 0.00, 0.20, true, false, NULL::uuid),
(gen_random_uuid(), 'ALB-003', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Tabiquería', 'Tabique de pladur simple 48mm', 'm²', 15.00, 10.00, 0.00, 0.00, 0.20, true, false, NULL::uuid),
(gen_random_uuid(), 'ALB-004', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Revestimientos', 'Enfoscado de cemento en paramentos verticales', 'm²', 12.00, 5.00, 0.00, 0.00, 0.20, true, false, NULL::uuid),
(gen_random_uuid(), 'ALB-005', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Revestimientos', 'Alicatado con azulejo 20x20', 'm²', 20.00, 18.00, 0.00, 0.00, 0.20, true, false, NULL::uuid),
(gen_random_uuid(), 'ALB-006', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Pavimentos', 'Solado con gres porcelánico 60x60', 'm²', 22.00, 25.00, 0.00, 0.00, 0.20, true, false, NULL::uuid),
(gen_random_uuid(), 'ALB-007', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Pavimentos', 'Recrecido de mortero autonivelante', 'm²', 8.00, 6.00, 0.00, 0.00, 0.20, true, false, NULL::uuid),

-- FONTANERÍA
(gen_random_uuid(), 'FON-001', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Sanitarios', 'Suministro e instalación de inodoro suspendido', 'ud', 120.00, 280.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
(gen_random_uuid(), 'FON-002', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Sanitarios', 'Suministro e instalación de lavabo con pedestal', 'ud', 80.00, 150.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
(gen_random_uuid(), 'FON-003', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Sanitarios', 'Suministro e instalación de plato de ducha acrílico', 'ud', 100.00, 180.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
(gen_random_uuid(), 'FON-004', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Tuberías', 'Tubería de PVC evacuación Ø110mm', 'm', 12.00, 8.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
(gen_random_uuid(), 'FON-005', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Tuberías', 'Tubería multicapa para agua Ø20mm', 'm', 8.00, 5.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
(gen_random_uuid(), 'FON-006', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Grifería', 'Grifo monomando lavabo', 'ud', 40.00, 85.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
(gen_random_uuid(), 'FON-007', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Grifería', 'Grifo monomando ducha empotrado', 'ud', 60.00, 120.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),

-- CARPINTERÍA
(gen_random_uuid(), 'CAR-001', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Puertas', 'Puerta interior lacada blanca 203x82,5cm', 'ud', 80.00, 180.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
(gen_random_uuid(), 'CAR-002', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Puertas', 'Puerta corredera empotrada lacada', 'ud', 150.00, 350.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
(gen_random_uuid(), 'CAR-003', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Ventanas', 'Ventana PVC blanco 120x120cm', 'ud', 100.00, 280.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
(gen_random_uuid(), 'CAR-004', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Armarios', 'Armario empotrado melamina 2,50m', 'ud', 200.00, 450.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
(gen_random_uuid(), 'CAR-005', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Rodapiés', 'Rodapié lacado blanco 7cm', 'm', 5.00, 4.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),

-- ELECTRICIDAD
(gen_random_uuid(), 'ELE-001', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Puntos de luz', 'Punto de luz sencillo', 'ud', 35.00, 15.00, 0.00, 0.00, 0.30, true, false, NULL::uuid),
(gen_random_uuid(), 'ELE-002', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Enchufes', 'Base de enchufe 16A', 'ud', 30.00, 12.00, 0.00, 0.00, 0.30, true, false, NULL::uuid),
(gen_random_uuid(), 'ELE-003', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Cuadros', 'Cuadro eléctrico vivienda 4 circuitos', 'ud', 180.00, 220.00, 0.00, 0.00, 0.30, true, false, NULL::uuid),
(gen_random_uuid(), 'ELE-004', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Cableado', 'Cable H07V-K 1,5mm² bajo tubo', 'm', 2.50, 1.20, 0.00, 0.00, 0.30, true, false, NULL::uuid),
(gen_random_uuid(), 'ELE-005', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Mecanismos', 'Interruptor simple', 'ud', 25.00, 8.00, 0.00, 0.00, 0.30, true, false, NULL::uuid),

-- CALEFACCIÓN
(gen_random_uuid(), 'CAL-001', (SELECT id FROM cats WHERE name = 'CALEFACCION'), 'Radiadores', 'Radiador aluminio 600mm 6 elementos', 'ud', 80.00, 120.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
(gen_random_uuid(), 'CAL-002', (SELECT id FROM cats WHERE name = 'CALEFACCION'), 'Calderas', 'Caldera mural gas condensación 24kW', 'ud', 400.00, 1200.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),
(gen_random_uuid(), 'CAL-003', (SELECT id FROM cats WHERE name = 'CALEFACCION'), 'Tuberías', 'Tubería cobre para calefacción Ø18mm', 'm', 10.00, 8.00, 0.00, 0.00, 0.25, true, false, NULL::uuid),

-- LIMPIEZA
(gen_random_uuid(), 'LIM-001', (SELECT id FROM cats WHERE name = 'LIMPIEZA'), 'Limpieza', 'Limpieza final de obra', 'm²', 3.00, 1.00, 0.00, 0.00, 0.20, true, false, NULL::uuid),
(gen_random_uuid(), 'LIM-002', (SELECT id FROM cats WHERE name = 'LIMPIEZA'), 'Gestión', 'Gestión de residuos y escombros', 'm³', 25.00, 15.00, 0.00, 0.00, 0.20, true, false, NULL::uuid),

-- MATERIALES
(gen_random_uuid(), 'MAT-001', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Cemento', 'Saco de cemento 25kg', 'ud', 0.00, 8.50, 0.00, 0.00, 0.15, true, false, NULL::uuid),
(gen_random_uuid(), 'MAT-002', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Arena', 'Arena de río m³', 'm³', 0.00, 25.00, 0.00, 0.00, 0.15, true, false, NULL::uuid),
(gen_random_uuid(), 'MAT-003', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Yeso', 'Saco de yeso 25kg', 'ud', 0.00, 6.00, 0.00, 0.00, 0.15, true, false, NULL::uuid);

-- Recrear políticas RLS
ALTER TABLE price_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Políticas para price_categories
CREATE POLICY "Ver todas las categorías" ON price_categories FOR SELECT USING (true);
CREATE POLICY "Crear categorías (admin)" ON price_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizar categorías (admin)" ON price_categories FOR UPDATE USING (true);
CREATE POLICY "Eliminar categorías (admin)" ON price_categories FOR DELETE USING (true);

-- Políticas para price_master
CREATE POLICY "Ver precios base" ON price_master FOR SELECT USING (is_custom = false OR user_id = auth.uid());
CREATE POLICY "Crear precios personalizados" ON price_master FOR INSERT WITH CHECK (is_custom = true AND user_id = auth.uid());
CREATE POLICY "Actualizar precios propios" ON price_master FOR UPDATE USING (is_custom = true AND user_id = auth.uid());
CREATE POLICY "Eliminar precios propios" ON price_master FOR DELETE USING (is_custom = true AND user_id = auth.uid());

-- Políticas para price_history
CREATE POLICY "Ver historial propio" ON price_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Crear historial propio" ON price_history FOR INSERT WITH CHECK (user_id = auth.uid());
