-- Script completo para resetear el sistema de precios
-- Elimina todas las políticas, limpia datos, e inserta todo desde cero

-- Paso 1: Eliminar todas las políticas RLS existentes dinámicamente
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

-- Paso 2: Limpiar todas las tablas
TRUNCATE TABLE price_history CASCADE;
TRUNCATE TABLE price_master CASCADE;
TRUNCATE TABLE price_categories CASCADE;

-- Paso 3: Insertar categorías
INSERT INTO price_categories (id, name, description, display_order) VALUES
('11111111-1111-1111-1111-111111111111', 'DERRIBO', 'Trabajos de demolición y derribo', 1),
('22222222-2222-2222-2222-222222222222', 'ALBANILERIA', 'Trabajos de albañilería', 2),
('33333333-3333-3333-3333-333333333333', 'FONTANERIA', 'Instalaciones de fontanería', 3),
('44444444-4444-4444-4444-444444444444', 'CARPINTERIA', 'Trabajos de carpintería', 4),
('55555555-5555-5555-5555-555555555555', 'ELECTRICIDAD', 'Instalaciones eléctricas', 5),
('66666666-6666-6666-6666-666666666666', 'CALEFACCION', 'Sistemas de calefacción', 6),
('77777777-7777-7777-7777-777777777777', 'LIMPIEZA', 'Limpieza final de obra', 7),
('88888888-8888-8888-8888-888888888888', 'MATERIALES', 'Materiales de construcción', 8)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- Paso 4: Insertar precios por categoría
-- Removido el campo 'id' de todos los INSERT statements para permitir generación automática
-- DERRIBO
INSERT INTO price_master (code, category_id, subcategory, description, unit, base_price, material_cost, labor_cost, profit_margin, final_price, is_custom, user_id) VALUES
('DER-001', '11111111-1111-1111-1111-111111111111', 'Tabiquería', 'Derribo de tabique de ladrillo hueco sencillo', 'm²', 8.50, 0.50, 8.00, 0.00, 8.50, false, null),
('DER-002', '11111111-1111-1111-1111-111111111111', 'Tabiquería', 'Derribo de tabique de ladrillo hueco doble', 'm²', 12.00, 0.75, 11.25, 0.00, 12.00, false, null),
('DER-003', '11111111-1111-1111-1111-111111111111', 'Pavimentos', 'Levantado de pavimento cerámico', 'm²', 6.50, 0.30, 6.20, 0.00, 6.50, false, null),
('DER-004', '11111111-1111-1111-1111-111111111111', 'Pavimentos', 'Levantado de pavimento de madera', 'm²', 5.00, 0.20, 4.80, 0.00, 5.00, false, null),
('DER-005', '11111111-1111-1111-1111-111111111111', 'Revestimientos', 'Picado de azulejo en paredes', 'm²', 7.00, 0.40, 6.60, 0.00, 7.00, false, null),
('DER-006', '11111111-1111-1111-1111-111111111111', 'Carpintería', 'Desmontaje de puerta interior', 'Ud', 25.00, 2.00, 23.00, 0.00, 25.00, false, null),
('DER-007', '11111111-1111-1111-1111-111111111111', 'Carpintería', 'Desmontaje de ventana', 'Ud', 30.00, 2.50, 27.50, 0.00, 30.00, false, null),
('DER-008', '11111111-1111-1111-1111-111111111111', 'Sanitarios', 'Desmontaje de inodoro', 'Ud', 35.00, 3.00, 32.00, 0.00, 35.00, false, null),
('DER-009', '11111111-1111-1111-1111-111111111111', 'Sanitarios', 'Desmontaje de lavabo', 'Ud', 30.00, 2.50, 27.50, 0.00, 30.00, false, null),
('DER-010', '11111111-1111-1111-1111-111111111111', 'Sanitarios', 'Desmontaje de bañera', 'Ud', 80.00, 5.00, 75.00, 0.00, 80.00, false, null),
('DER-011', '11111111-1111-1111-1111-111111111111', 'Sanitarios', 'Desmontaje de plato de ducha', 'Ud', 45.00, 3.50, 41.50, 0.00, 45.00, false, null),
('DER-012', '11111111-1111-1111-1111-111111111111', 'Escombros', 'Retirada de escombros con contenedor', 'm³', 35.00, 30.00, 5.00, 0.00, 35.00, false, null);

-- ALBAÑILERÍA
-- Reemplazando "pladur" por "cartón yeso" en los conceptos ALB-003 y ALB-004
INSERT INTO price_master (code, category_id, subcategory, description, unit, base_price, material_cost, labor_cost, profit_margin, final_price, is_custom, user_id) VALUES
('ALB-001', '22222222-2222-2222-2222-222222222222', 'Tabiquería', 'Tabique de ladrillo hueco sencillo 7cm', 'm²', 18.50, 8.50, 10.00, 0.00, 18.50, false, null),
('ALB-002', '22222222-2222-2222-2222-222222222222', 'Tabiquería', 'Tabique de ladrillo hueco doble 9cm', 'm²', 22.00, 10.00, 12.00, 0.00, 22.00, false, null),
('ALB-003', '22222222-2222-2222-2222-222222222222', 'Tabiquería', 'Tabique de Placa de yeso laminado simple 48mm', 'm²', 15.00, 7.00, 8.00, 0.00, 15.00, false, null),
('ALB-004', '22222222-2222-2222-2222-222222222222', 'Tabiquería', 'Tabique de Placa de yeso laminado doble 70mm', 'm²', 20.00, 9.50, 10.50, 0.00, 20.00, false, null),
('ALB-005', '22222222-2222-2222-2222-222222222222', 'Revestimientos', 'Enfoscado y enlucido de yeso', 'm²', 12.00, 4.00, 8.00, 0.00, 12.00, false, null),
('ALB-006', '22222222-2222-2222-2222-222222222222', 'Revestimientos', 'Alicatado con azulejo 20x20', 'm²', 25.00, 12.00, 13.00, 0.00, 25.00, false, null),
('ALB-007', '22222222-2222-2222-2222-222222222222', 'Revestimientos', 'Alicatado con azulejo 30x60', 'm²', 30.00, 15.00, 15.00, 0.00, 30.00, false, null),
('ALB-008', '22222222-2222-2222-2222-222222222222', 'Pavimentos', 'Solado con gres porcelánico 60x60', 'm²', 35.00, 18.00, 17.00, 0.00, 35.00, false, null),
('ALB-009', '22222222-2222-2222-2222-222222222222', 'Pavimentos', 'Solado con tarima flotante', 'm²', 28.00, 15.00, 13.00, 0.00, 28.00, false, null),
('ALB-010', '22222222-2222-2222-2222-222222222222', 'Falsos techos', 'Falso techo continuo de Placa de yeso laminado', 'm²', 18.00, 8.00, 10.00, 0.00, 18.00, false, null),
('ALB-011', '22222222-2222-2222-2222-222222222222', 'Falsos techos', 'Falso techo desmontable 60x60', 'm²', 22.00, 11.00, 11.00, 0.00, 22.00, false, null),
('ALB-012', '22222222-2222-2222-2222-222222222222', 'Pintura', 'Pintura plástica lisa en paramentos', 'm²', 6.50, 2.00, 4.50, 0.00, 6.50, false, null),
('ALB-013', '22222222-2222-2222-2222-222222222222', 'Pintura', 'Pintura plástica en techos', 'm²', 7.00, 2.20, 4.80, 0.00, 7.00, false, null);

-- FONTANERÍA
INSERT INTO price_master (code, category_id, subcategory, description, unit, base_price, material_cost, labor_cost, profit_margin, final_price, is_custom, user_id) VALUES
('FON-001', '33333333-3333-3333-3333-333333333333', 'Sanitarios', 'Instalación de inodoro con cisterna', 'Ud', 180.00, 120.00, 60.00, 0.00, 180.00, false, null),
('FON-002', '33333333-3333-3333-3333-333333333333', 'Sanitarios', 'Instalación de lavabo con pedestal', 'Ud', 150.00, 90.00, 60.00, 0.00, 150.00, false, null),
('FON-003', '33333333-3333-3333-3333-333333333333', 'Sanitarios', 'Instalación de bañera acrílica', 'Ud', 350.00, 250.00, 100.00, 0.00, 350.00, false, null),
('FON-004', '33333333-3333-3333-3333-333333333333', 'Sanitarios', 'Instalación de plato de ducha', 'Ud', 280.00, 180.00, 100.00, 0.00, 280.00, false, null),
('FON-005', '33333333-3333-3333-3333-333333333333', 'Sanitarios', 'Instalación de mampara de ducha', 'Ud', 220.00, 160.00, 60.00, 0.00, 220.00, false, null),
('FON-006', '33333333-3333-3333-3333-333333333333', 'Grifería', 'Instalación de grifo monomando lavabo', 'Ud', 85.00, 55.00, 30.00, 0.00, 85.00, false, null),
('FON-007', '33333333-3333-3333-3333-333333333333', 'Grifería', 'Instalación de grifo monomando ducha', 'Ud', 95.00, 65.00, 30.00, 0.00, 95.00, false, null),
('FON-008', '33333333-3333-3333-3333-333333333333', 'Tuberías', 'Tubería de PVC evacuación Ø110mm', 'm', 12.00, 6.00, 6.00, 0.00, 12.00, false, null),
('FON-009', '33333333-3333-3333-3333-333333333333', 'Tuberías', 'Tubería multicapa agua fría/caliente', 'm', 8.50, 4.50, 4.00, 0.00, 8.50, false, null),
('FON-010', '33333333-3333-3333-3333-333333333333', 'Calentadores', 'Instalación de termo eléctrico 50L', 'Ud', 280.00, 200.00, 80.00, 0.00, 280.00, false, null),
('FON-011', '33333333-3333-3333-3333-333333333333', 'Calentadores', 'Instalación de calentador gas 11L', 'Ud', 350.00, 250.00, 100.00, 0.00, 350.00, false, null);

-- CARPINTERÍA
INSERT INTO price_master (code, category_id, subcategory, description, unit, base_price, material_cost, labor_cost, profit_margin, final_price, is_custom, user_id) VALUES
('CAR-001', '44444444-4444-4444-4444-444444444444', 'Puertas', 'Puerta interior lisa blanca 72,5x203', 'Ud', 180.00, 120.00, 60.00, 0.00, 180.00, false, null),
('CAR-002', '44444444-4444-4444-4444-444444444444', 'Puertas', 'Puerta interior maciza roble 82,5x203', 'Ud', 280.00, 200.00, 80.00, 0.00, 280.00, false, null),
('CAR-003', '44444444-4444-4444-4444-444444444444', 'Puertas', 'Puerta corredera empotrada', 'Ud', 350.00, 250.00, 100.00, 0.00, 350.00, false, null),
('CAR-004', '44444444-4444-4444-4444-444444444444', 'Ventanas', 'Ventana PVC 2 hojas 120x120', 'Ud', 320.00, 240.00, 80.00, 0.00, 320.00, false, null),
('CAR-005', '44444444-4444-4444-4444-444444444444', 'Ventanas', 'Ventana aluminio RPT 2 hojas 120x120', 'Ud', 380.00, 290.00, 90.00, 0.00, 380.00, false, null),
('CAR-006', '44444444-4444-4444-4444-444444444444', 'Armarios', 'Armario empotrado melamina 2,40m', 'm', 280.00, 180.00, 100.00, 0.00, 280.00, false, null),
('CAR-007', '44444444-4444-4444-4444-444444444444', 'Armarios', 'Armario empotrado lacado 2,40m', 'm', 350.00, 230.00, 120.00, 0.00, 350.00, false, null),
('CAR-008', '44444444-4444-4444-4444-444444444444', 'Rodapiés', 'Rodapié DM lacado blanco 7cm', 'm', 8.50, 4.50, 4.00, 0.00, 8.50, false, null),
('CAR-009', '44444444-4444-4444-4444-444444444444', 'Rodapiés', 'Rodapié madera maciza 7cm', 'm', 12.00, 7.00, 5.00, 0.00, 12.00, false, null);

-- ELECTRICIDAD
INSERT INTO price_master (code, category_id, subcategory, description, unit, base_price, material_cost, labor_cost, profit_margin, final_price, is_custom, user_id) VALUES
('ELE-001', '55555555-5555-5555-5555-555555555555', 'Puntos de luz', 'Punto de luz sencillo', 'Ud', 45.00, 15.00, 30.00, 0.00, 45.00, false, null),
('ELE-002', '55555555-5555-5555-5555-555555555555', 'Puntos de luz', 'Punto de luz conmutado', 'Ud', 65.00, 25.00, 40.00, 0.00, 65.00, false, null),
('ELE-003', '55555555-5555-5555-5555-555555555555', 'Enchufes', 'Base de enchufe 16A', 'Ud', 35.00, 12.00, 23.00, 0.00, 35.00, false, null),
('ELE-004', '55555555-5555-5555-5555-555555555555', 'Enchufes', 'Base de enchufe con toma de tierra', 'Ud', 40.00, 15.00, 25.00, 0.00, 40.00, false, null),
('ELE-005', '55555555-5555-5555-5555-555555555555', 'Cuadros', 'Cuadro eléctrico vivienda 80m²', 'Ud', 450.00, 280.00, 170.00, 0.00, 450.00, false, null),
('ELE-006', '55555555-5555-5555-5555-555555555555', 'Cuadros', 'Cuadro eléctrico vivienda 120m²', 'Ud', 580.00, 360.00, 220.00, 0.00, 580.00, false, null),
('ELE-007', '55555555-5555-5555-5555-555555555555', 'Iluminación', 'Downlight LED empotrable 12W', 'Ud', 35.00, 22.00, 13.00, 0.00, 35.00, false, null),
('ELE-008', '55555555-5555-5555-5555-555555555555', 'Iluminación', 'Plafón LED superficie 24W', 'Ud', 45.00, 28.00, 17.00, 0.00, 45.00, false, null),
('ELE-009', '55555555-5555-5555-5555-555555555555', 'Mecanismos', 'Interruptor simple', 'Ud', 18.00, 8.00, 10.00, 0.00, 18.00, false, null),
('ELE-010', '55555555-5555-5555-5555-555555555555', 'Mecanismos', 'Conmutador', 'Ud', 22.00, 10.00, 12.00, 0.00, 22.00, false, null);

-- CALEFACCIÓN
INSERT INTO price_master (code, category_id, subcategory, description, unit, base_price, material_cost, labor_cost, profit_margin, final_price, is_custom, user_id) VALUES
('CAL-001', '66666666-6666-6666-6666-666666666666', 'Radiadores', 'Radiador aluminio 600mm 6 elementos', 'Ud', 180.00, 120.00, 60.00, 0.00, 180.00, false, null),
('CAL-002', '66666666-6666-6666-6666-666666666666', 'Radiadores', 'Radiador aluminio 600mm 8 elementos', 'Ud', 220.00, 150.00, 70.00, 0.00, 220.00, false, null),
('CAL-003', '66666666-6666-6666-6666-666666666666', 'Radiadores', 'Radiador toallero eléctrico', 'Ud', 150.00, 100.00, 50.00, 0.00, 150.00, false, null),
('CAL-004', '66666666-6666-6666-6666-666666666666', 'Calderas', 'Caldera gas condensación 24kW', 'Ud', 1800.00, 1400.00, 400.00, 0.00, 1800.00, false, null),
('CAL-005', '66666666-6666-6666-6666-666666666666', 'Suelo radiante', 'Suelo radiante por agua', 'm²', 65.00, 40.00, 25.00, 0.00, 65.00, false, null),
('CAL-006', '66666666-6666-6666-6666-666666666666', 'Aire acondicionado', 'Split 1x1 3000 frigorías', 'Ud', 850.00, 600.00, 250.00, 0.00, 850.00, false, null);

-- LIMPIEZA
INSERT INTO price_master (code, category_id, subcategory, description, unit, base_price, material_cost, labor_cost, profit_margin, final_price, is_custom, user_id) VALUES
('LIM-001', '77777777-7777-7777-7777-777777777777', 'Limpieza final', 'Limpieza final de obra', 'm²', 3.50, 1.00, 2.50, 0.00, 3.50, false, null);

-- MATERIALES
INSERT INTO price_master (code, category_id, subcategory, description, unit, base_price, material_cost, labor_cost, profit_margin, final_price, is_custom, user_id) VALUES
('MAT-001', '88888888-8888-8888-8888-888888888888', 'Cemento', 'Saco de cemento 25kg', 'Ud', 8.50, 8.50, 0.00, 0.00, 8.50, false, null),
('MAT-002', '88888888-8888-8888-8888-888888888888', 'Arena', 'Arena de río m³', 'm³', 25.00, 25.00, 0.00, 0.00, 25.00, false, null),
('MAT-003', '88888888-8888-8888-8888-888888888888', 'Ladrillos', 'Ladrillo hueco sencillo', 'Ud', 0.35, 0.35, 0.00, 0.00, 0.35, false, null);

-- Paso 5: Recrear políticas RLS
-- Políticas para price_categories
CREATE POLICY "Todos pueden ver categorías"
  ON price_categories FOR SELECT
  USING (true);

-- Políticas para price_master
CREATE POLICY "Ver precios base activos"
  ON price_master FOR SELECT
  USING (is_custom = false AND is_active = true);

CREATE POLICY "Ver precios propios"
  ON price_master FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Crear precios personalizados"
  ON price_master FOR INSERT
  WITH CHECK (is_custom = true AND user_id = auth.uid());

CREATE POLICY "Actualizar precios propios"
  ON price_master FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Eliminar precios propios"
  ON price_master FOR DELETE
  USING (user_id = auth.uid());

-- Políticas para price_history
CREATE POLICY "Ver historial propio"
  ON price_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Insertar historial propio"
  ON price_history FOR INSERT
  WITH CHECK (user_id = auth.uid());
