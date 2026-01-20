-- Eliminar todas las políticas RLS existentes dinámicamente
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('price_master', 'price_categories', 'price_history')
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
INSERT INTO price_categories (id, name, description, display_order) VALUES
('11111111-1111-1111-1111-111111111111', 'DERRIBO', 'Trabajos de demolición', 1),
('22222222-2222-2222-2222-222222222222', 'ALBANILERIA', 'Trabajos de albañilería', 2),
('33333333-3333-3333-3333-333333333333', 'FONTANERIA', 'Instalaciones de fontanería', 3),
('44444444-4444-4444-4444-444444444444', 'CARPINTERIA', 'Trabajos de carpintería', 4),
('55555555-5555-5555-5555-555555555555', 'ELECTRICIDAD', 'Instalaciones eléctricas', 5),
('66666666-6666-6666-6666-666666666666', 'CALEFACCION', 'Sistemas de calefacción', 6),
('77777777-7777-7777-7777-777777777777', 'LIMPIEZA', 'Limpieza de obra', 7),
('88888888-8888-8888-8888-888888888888', 'MATERIALES', 'Materiales de construcción', 8)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;

-- Insertar precios de DERRIBO
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_active) VALUES
(gen_random_uuid(), 'DER-001', '11111111-1111-1111-1111-111111111111', 'Tabiquería', 'Derribo de tabique de ladrillo hueco sencillo', 'm²', 8.00, 0.50, 0.00, 0.00, true),
(gen_random_uuid(), 'DER-002', '11111111-1111-1111-1111-111111111111', 'Tabiquería', 'Derribo de tabique de ladrillo hueco doble', 'm²', 10.00, 0.60, 0.00, 0.00, true),
(gen_random_uuid(), 'DER-003', '11111111-1111-1111-1111-111111111111', 'Tabiquería', 'Derribo de tabique de pladur', 'm²', 6.00, 0.30, 0.00, 0.00, true),
(gen_random_uuid(), 'DER-004', '11111111-1111-1111-1111-111111111111', 'Suelos', 'Levantado de solado cerámico', 'm²', 7.00, 0.00, 0.00, 0.00, true),
(gen_random_uuid(), 'DER-005', '11111111-1111-1111-1111-111111111111', 'Suelos', 'Levantado de tarima flotante', 'm²', 5.00, 0.00, 0.00, 0.00, true),
(gen_random_uuid(), 'DER-006', '11111111-1111-1111-1111-111111111111', 'Suelos', 'Levantado de parquet encolado', 'm²', 9.00, 0.00, 0.00, 0.00, true),
(gen_random_uuid(), 'DER-007', '11111111-1111-1111-1111-111111111111', 'Techos', 'Desmontaje de falso techo registrable', 'm²', 4.00, 0.00, 0.00, 0.00, true),
(gen_random_uuid(), 'DER-008', '11111111-1111-1111-1111-111111111111', 'Techos', 'Picado de techo de escayola', 'm²', 8.00, 0.00, 0.00, 0.00, true),
(gen_random_uuid(), 'DER-009', '11111111-1111-1111-1111-111111111111', 'Carpintería', 'Desmontaje de puerta interior', 'ud', 25.00, 0.00, 0.00, 0.00, true),
(gen_random_uuid(), 'DER-010', '11111111-1111-1111-1111-111111111111', 'Carpintería', 'Desmontaje de ventana', 'ud', 30.00, 0.00, 0.00, 0.00, true),
(gen_random_uuid(), 'DER-011', '11111111-1111-1111-1111-111111111111', 'Sanitarios', 'Desmontaje de inodoro', 'ud', 20.00, 0.00, 0.00, 0.00, true),
(gen_random_uuid(), 'DER-012', '11111111-1111-1111-1111-111111111111', 'Sanitarios', 'Desmontaje de lavabo', 'ud', 18.00, 0.00, 0.00, 0.00, true),
(gen_random_uuid(), 'DER-013', '11111111-1111-1111-1111-111111111111', 'Sanitarios', 'Desmontaje de bañera', 'ud', 40.00, 0.00, 0.00, 0.00, true),
(gen_random_uuid(), 'DER-014', '11111111-1111-1111-1111-111111111111', 'Sanitarios', 'Desmontaje de plato de ducha', 'ud', 35.00, 0.00, 0.00, 0.00, true);

-- Insertar precios de ALBAÑILERÍA
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_active) VALUES
(gen_random_uuid(), 'ALB-001', '22222222-2222-2222-2222-222222222222', 'Tabiquería', 'Tabique de ladrillo hueco sencillo', 'm²', 18.00, 12.00, 0.00, 0.00, true),
(gen_random_uuid(), 'ALB-002', '22222222-2222-2222-2222-222222222222', 'Tabiquería', 'Tabique de ladrillo hueco doble', 'm²', 22.00, 16.00, 0.00, 0.00, true),
(gen_random_uuid(), 'ALB-003', '22222222-2222-2222-2222-222222222222', 'Tabiquería', 'Tabique de pladur simple', 'm²', 15.00, 10.00, 0.00, 0.00, true),
(gen_random_uuid(), 'ALB-004', '22222222-2222-2222-2222-222222222222', 'Tabiquería', 'Tabique de pladur con aislamiento', 'm²', 18.00, 14.00, 0.00, 0.00, true),
(gen_random_uuid(), 'ALB-005', '22222222-2222-2222-2222-222222222222', 'Revestimientos', 'Enfoscado y enlucido de paredes', 'm²', 12.00, 5.00, 0.00, 0.00, true),
(gen_random_uuid(), 'ALB-006', '22222222-2222-2222-2222-222222222222', 'Revestimientos', 'Alicatado con azulejo 20x20', 'm²', 20.00, 15.00, 0.00, 0.00, true),
(gen_random_uuid(), 'ALB-007', '22222222-2222-2222-2222-222222222222', 'Revestimientos', 'Alicatado con azulejo 30x60', 'm²', 22.00, 20.00, 0.00, 0.00, true),
(gen_random_uuid(), 'ALB-008', '22222222-2222-2222-2222-222222222222', 'Solados', 'Solado con gres porcelánico 60x60', 'm²', 18.00, 18.00, 0.00, 0.00, true),
(gen_random_uuid(), 'ALB-009', '22222222-2222-2222-2222-222222222222', 'Solados', 'Solado con baldosa hidráulica', 'm²', 25.00, 35.00, 0.00, 0.00, true),
(gen_random_uuid(), 'ALB-010', '22222222-2222-2222-2222-222222222222', 'Solados', 'Recrecido de mortero', 'm²', 8.00, 4.00, 0.00, 0.00, true);

-- Insertar precios de FONTANERÍA
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_active) VALUES
(gen_random_uuid(), 'FON-001', '33333333-3333-3333-3333-333333333333', 'Sanitarios', 'Inodoro con cisterna empotrada', 'ud', 80.00, 180.00, 0.00, 0.00, true),
(gen_random_uuid(), 'FON-002', '33333333-3333-3333-3333-333333333333', 'Sanitarios', 'Lavabo con pedestal', 'ud', 60.00, 120.00, 0.00, 0.00, true),
(gen_random_uuid(), 'FON-003', '33333333-3333-3333-3333-333333333333', 'Sanitarios', 'Lavabo suspendido', 'ud', 70.00, 150.00, 0.00, 0.00, true),
(gen_random_uuid(), 'FON-004', '33333333-3333-3333-3333-333333333333', 'Sanitarios', 'Plato de ducha de resina 80x80', 'ud', 100.00, 200.00, 0.00, 0.00, true),
(gen_random_uuid(), 'FON-005', '33333333-3333-3333-3333-333333333333', 'Sanitarios', 'Bañera acrílica 170x70', 'ud', 120.00, 250.00, 0.00, 0.00, true),
(gen_random_uuid(), 'FON-006', '33333333-3333-3333-3333-333333333333', 'Grifería', 'Grifo monomando lavabo', 'ud', 30.00, 80.00, 0.00, 0.00, true),
(gen_random_uuid(), 'FON-007', '33333333-3333-3333-3333-333333333333', 'Grifería', 'Grifo monomando ducha', 'ud', 35.00, 90.00, 0.00, 0.00, true),
(gen_random_uuid(), 'FON-008', '33333333-3333-3333-3333-333333333333', 'Grifería', 'Grifo termostático ducha', 'ud', 40.00, 150.00, 0.00, 0.00, true),
(gen_random_uuid(), 'FON-009', '33333333-3333-3333-3333-333333333333', 'Instalación', 'Punto de agua fría/caliente', 'ud', 45.00, 25.00, 0.00, 0.00, true),
(gen_random_uuid(), 'FON-010', '33333333-3333-3333-3333-333333333333', 'Instalación', 'Punto de desagüe', 'ud', 40.00, 20.00, 0.00, 0.00, true);

-- Insertar precios de CARPINTERÍA
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_active) VALUES
(gen_random_uuid(), 'CAR-001', '44444444-4444-4444-4444-444444444444', 'Puertas', 'Puerta interior lacada blanca 72,5cm', 'ud', 80.00, 180.00, 0.00, 0.00, true),
(gen_random_uuid(), 'CAR-002', '44444444-4444-4444-4444-444444444444', 'Puertas', 'Puerta interior lacada blanca 82,5cm', 'ud', 85.00, 200.00, 0.00, 0.00, true),
(gen_random_uuid(), 'CAR-003', '44444444-4444-4444-4444-444444444444', 'Puertas', 'Puerta corredera empotrada', 'ud', 150.00, 350.00, 0.00, 0.00, true),
(gen_random_uuid(), 'CAR-004', '44444444-4444-4444-4444-444444444444', 'Puertas', 'Puerta de entrada blindada', 'ud', 200.00, 600.00, 0.00, 0.00, true),
(gen_random_uuid(), 'CAR-005', '44444444-4444-4444-4444-444444444444', 'Ventanas', 'Ventana PVC 120x120 oscilobatiente', 'ud', 100.00, 300.00, 0.00, 0.00, true),
(gen_random_uuid(), 'CAR-006', '44444444-4444-4444-4444-444444444444', 'Ventanas', 'Ventana aluminio 120x120 corredera', 'ud', 90.00, 250.00, 0.00, 0.00, true),
(gen_random_uuid(), 'CAR-007', '44444444-4444-4444-4444-444444444444', 'Armarios', 'Armario empotrado 2 puertas correderas', 'ml', 180.00, 320.00, 0.00, 0.00, true),
(gen_random_uuid(), 'CAR-008', '44444444-4444-4444-4444-444444444444', 'Suelos', 'Tarima flotante AC4', 'm²', 12.00, 18.00, 0.00, 0.00, true),
(gen_random_uuid(), 'CAR-009', '44444444-4444-4444-4444-444444444444', 'Suelos', 'Parquet encolado roble', 'm²', 20.00, 35.00, 0.00, 0.00, true),
(gen_random_uuid(), 'CAR-010', '44444444-4444-4444-4444-444444444444', 'Rodapiés', 'Rodapié lacado blanco 7cm', 'ml', 3.00, 4.00, 0.00, 0.00, true);

-- Insertar precios de ELECTRICIDAD
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_active) VALUES
(gen_random_uuid(), 'ELE-001', '55555555-5555-5555-5555-555555555555', 'Puntos de luz', 'Punto de luz sencillo', 'ud', 35.00, 15.00, 0.00, 0.00, true),
(gen_random_uuid(), 'ELE-002', '55555555-5555-5555-5555-555555555555', 'Puntos de luz', 'Punto de luz conmutado', 'ud', 45.00, 20.00, 0.00, 0.00, true),
(gen_random_uuid(), 'ELE-003', '55555555-5555-5555-5555-555555555555', 'Enchufes', 'Base de enchufe', 'ud', 30.00, 12.00, 0.00, 0.00, true),
(gen_random_uuid(), 'ELE-004', '55555555-5555-5555-5555-555555555555', 'Enchufes', 'Base de enchufe con toma USB', 'ud', 35.00, 25.00, 0.00, 0.00, true),
(gen_random_uuid(), 'ELE-005', '55555555-5555-5555-5555-555555555555', 'Cuadro eléctrico', 'Cuadro eléctrico vivienda 80m²', 'ud', 200.00, 300.00, 0.00, 0.00, true),
(gen_random_uuid(), 'ELE-006', '55555555-5555-5555-5555-555555555555', 'Cuadro eléctrico', 'Cuadro eléctrico vivienda 120m²', 'ud', 250.00, 400.00, 0.00, 0.00, true),
(gen_random_uuid(), 'ELE-007', '55555555-5555-5555-5555-555555555555', 'Iluminación', 'Downlight LED empotrable', 'ud', 25.00, 20.00, 0.00, 0.00, true),
(gen_random_uuid(), 'ELE-008', '55555555-5555-5555-5555-555555555555', 'Iluminación', 'Regleta LED superficie', 'ud', 20.00, 30.00, 0.00, 0.00, true),
(gen_random_uuid(), 'ELE-009', '55555555-5555-5555-5555-555555555555', 'Especiales', 'Punto de cocina/horno', 'ud', 40.00, 18.00, 0.00, 0.00, true),
(gen_random_uuid(), 'ELE-010', '55555555-5555-5555-5555-555555555555', 'Especiales', 'Punto de aire acondicionado', 'ud', 50.00, 25.00, 0.00, 0.00, true);

-- Insertar precios de CALEFACCIÓN
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_active) VALUES
(gen_random_uuid(), 'CAL-001', '66666666-6666-6666-6666-666666666666', 'Radiadores', 'Radiador aluminio 600mm 5 elementos', 'ud', 80.00, 120.00, 0.00, 0.00, true),
(gen_random_uuid(), 'CAL-002', '66666666-6666-6666-6666-666666666666', 'Radiadores', 'Radiador aluminio 600mm 7 elementos', 'ud', 90.00, 150.00, 0.00, 0.00, true),
(gen_random_uuid(), 'CAL-003', '66666666-6666-6666-6666-666666666666', 'Radiadores', 'Radiador toallero eléctrico', 'ud', 60.00, 100.00, 0.00, 0.00, true),
(gen_random_uuid(), 'CAL-004', '66666666-6666-6666-6666-666666666666', 'Suelo radiante', 'Suelo radiante por m²', 'm²', 25.00, 35.00, 0.00, 0.00, true),
(gen_random_uuid(), 'CAL-005', '66666666-6666-6666-6666-666666666666', 'Calderas', 'Caldera de gas condensación 24kW', 'ud', 400.00, 1200.00, 0.00, 0.00, true),
(gen_random_uuid(), 'CAL-006', '66666666-6666-6666-6666-666666666666', 'Calderas', 'Caldera de gas condensación 30kW', 'ud', 450.00, 1500.00, 0.00, 0.00, true),
(gen_random_uuid(), 'CAL-007', '66666666-6666-6666-6666-666666666666', 'Aire acondicionado', 'Split 1x1 2.500 frigorías', 'ud', 250.00, 450.00, 0.00, 0.00, true),
(gen_random_uuid(), 'CAL-008', '66666666-6666-6666-6666-666666666666', 'Aire acondicionado', 'Split 1x1 3.500 frigorías', 'ud', 280.00, 550.00, 0.00, 0.00, true);

-- Insertar precios de LIMPIEZA
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_active) VALUES
(gen_random_uuid(), 'LIM-001', '77777777-7777-7777-7777-777777777777', 'Limpieza final', 'Limpieza final de obra', 'm²', 3.00, 1.00, 0.00, 0.00, true),
(gen_random_uuid(), 'LIM-002', '77777777-7777-7777-7777-777777777777', 'Retirada', 'Retirada de escombros', 'm³', 25.00, 15.00, 0.00, 0.00, true),
(gen_random_uuid(), 'LIM-003', '77777777-7777-7777-7777-777777777777', 'Contenedor', 'Alquiler contenedor 7m³', 'ud', 0.00, 180.00, 0.00, 0.00, true);

-- Insertar precios de MATERIALES
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_active) VALUES
(gen_random_uuid(), 'MAT-001', '88888888-8888-8888-8888-888888888888', 'Cemento', 'Saco de cemento 25kg', 'ud', 0.00, 8.00, 0.00, 0.00, true),
(gen_random_uuid(), 'MAT-002', '88888888-8888-8888-8888-888888888888', 'Arena', 'Arena de río m³', 'm³', 0.00, 25.00, 0.00, 0.00, true),
(gen_random_uuid(), 'MAT-003', '88888888-8888-8888-8888-888888888888', 'Ladrillos', 'Ladrillo hueco sencillo', 'ud', 0.00, 0.35, 0.00, 0.00, true),
(gen_random_uuid(), 'MAT-004', '88888888-8888-8888-8888-888888888888', 'Yeso', 'Saco de yeso 25kg', 'ud', 0.00, 6.00, 0.00, 0.00, true);

-- Recrear políticas RLS
ALTER TABLE price_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Políticas para price_categories
CREATE POLICY "Ver categorías" ON price_categories FOR SELECT USING (true);
CREATE POLICY "Crear categorías admin" ON price_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizar categorías admin" ON price_categories FOR UPDATE USING (true);
CREATE POLICY "Eliminar categorías admin" ON price_categories FOR DELETE USING (true);

-- Políticas para price_master
CREATE POLICY "Ver precios base" ON price_master FOR SELECT USING (is_custom = false OR user_id = auth.uid());
CREATE POLICY "Crear precios personalizados" ON price_master FOR INSERT WITH CHECK (is_custom = true AND user_id = auth.uid());
CREATE POLICY "Actualizar precios propios" ON price_master FOR UPDATE USING (is_custom = true AND user_id = auth.uid());
CREATE POLICY "Eliminar precios propios" ON price_master FOR DELETE USING (is_custom = true AND user_id = auth.uid());

-- Políticas para price_history
CREATE POLICY "Ver historial propio" ON price_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Crear historial" ON price_history FOR INSERT WITH CHECK (user_id = auth.uid());
