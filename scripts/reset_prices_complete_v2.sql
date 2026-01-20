DO $$
DECLARE
    r RECORD;
BEGIN
    -- Eliminar todas las políticas existentes de las tablas de precios
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE tablename IN ('price_categories', 'price_master', 'price_history')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Limpiar todas las tablas
TRUNCATE TABLE price_history CASCADE;
TRUNCATE TABLE price_master CASCADE;
TRUNCATE TABLE price_categories CASCADE;

-- Reiniciar secuencias si existen
ALTER SEQUENCE IF EXISTS price_categories_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS price_master_id_seq RESTART WITH 1;

-- ============================================
-- INSERTAR CATEGORÍAS
-- ============================================

INSERT INTO price_categories (id, name, description, display_order) VALUES
(1, 'DERRIBO', 'Trabajos de demolición y derribo', 1),
(2, 'ALBANILERIA', 'Trabajos de albañilería', 2),
(3, 'FONTANERIA', 'Instalaciones de fontanería', 3),
(4, 'CARPINTERIA', 'Trabajos de carpintería', 4),
(5, 'ELECTRICIDAD', 'Instalaciones eléctricas', 5),
(6, 'CALEFACCION', 'Sistemas de calefacción', 6),
(7, 'LIMPIEZA', 'Servicios de limpieza', 7),
(8, 'MATERIALES', 'Materiales de construcción', 8);

-- ============================================
-- INSERTAR PRECIOS - DERRIBO
-- ============================================

INSERT INTO price_master (code, category_id, concept, description, unit, base_price, material_cost, labor_cost, is_custom, user_id) VALUES
('DER-001', 1, 'Derribo tabique ladrillo hueco', 'Derribo de tabique de ladrillo hueco sencillo', 'm²', 8.50, 0, 8.50, false, NULL),
('DER-002', 1, 'Derribo tabique ladrillo doble', 'Derribo de tabique de ladrillo hueco doble', 'm²', 12.00, 0, 12.00, false, NULL),
('DER-003', 1, 'Derribo muro carga', 'Derribo de muro de carga con apuntalamiento', 'm²', 45.00, 5.00, 40.00, false, NULL),
('DER-004', 1, 'Levantado solado', 'Levantado de solado cerámico o similar', 'm²', 6.50, 0, 6.50, false, NULL),
('DER-005', 1, 'Levantado alicatado', 'Levantado de alicatado en paredes', 'm²', 7.00, 0, 7.00, false, NULL),
('DER-006', 1, 'Retirada sanitarios', 'Retirada de sanitarios completos', 'ud', 35.00, 0, 35.00, false, NULL),
('DER-007', 1, 'Retirada carpintería', 'Retirada de puerta o ventana con marco', 'ud', 25.00, 0, 25.00, false, NULL),
('DER-008', 1, 'Picado alicatado', 'Picado de alicatado en paredes', 'm²', 8.00, 0, 8.00, false, NULL);

-- ============================================
-- INSERTAR PRECIOS - ALBAÑILERÍA
-- ============================================

INSERT INTO price_master (code, category_id, concept, description, unit, base_price, material_cost, labor_cost, is_custom, user_id) VALUES
('ALB-001', 2, 'Tabique ladrillo hueco sencillo', 'Tabique de ladrillo hueco sencillo 7cm', 'm²', 28.00, 8.00, 20.00, false, NULL),
('ALB-002', 2, 'Tabique ladrillo hueco doble', 'Tabique de ladrillo hueco doble 9cm', 'm²', 32.00, 10.00, 22.00, false, NULL),
('ALB-003', 2, 'Tabique pladur simple', 'Tabique de pladur simple 48mm', 'm²', 22.00, 8.00, 14.00, false, NULL),
('ALB-004', 2, 'Tabique pladur doble', 'Tabique de pladur doble con aislamiento', 'm²', 35.00, 15.00, 20.00, false, NULL),
('ALB-005', 2, 'Enfoscado maestreado', 'Enfoscado maestreado en paramentos', 'm²', 18.00, 4.00, 14.00, false, NULL),
('ALB-006', 2, 'Enlucido yeso', 'Enlucido de yeso en paramentos', 'm²', 12.00, 3.00, 9.00, false, NULL),
('ALB-007', 2, 'Solado gres', 'Solado de gres porcelánico', 'm²', 35.00, 18.00, 17.00, false, NULL),
('ALB-008', 2, 'Alicatado', 'Alicatado en paredes', 'm²', 32.00, 16.00, 16.00, false, NULL),
('ALB-009', 2, 'Falso techo continuo', 'Falso techo continuo de pladur', 'm²', 28.00, 12.00, 16.00, false, NULL),
('ALB-010', 2, 'Falso techo registrable', 'Falso techo registrable desmontable', 'm²', 24.00, 10.00, 14.00, false, NULL);

-- ============================================
-- INSERTAR PRECIOS - FONTANERÍA
-- ============================================

INSERT INTO price_master (code, category_id, concept, description, unit, base_price, material_cost, labor_cost, is_custom, user_id) VALUES
('FON-001', 3, 'Inodoro suspendido', 'Suministro e instalación de inodoro suspendido', 'ud', 320.00, 220.00, 100.00, false, NULL),
('FON-002', 3, 'Inodoro pie', 'Suministro e instalación de inodoro de pie', 'ud', 180.00, 110.00, 70.00, false, NULL),
('FON-003', 3, 'Lavabo suspendido', 'Suministro e instalación de lavabo suspendido', 'ud', 250.00, 160.00, 90.00, false, NULL),
('FON-004', 3, 'Lavabo pedestal', 'Suministro e instalación de lavabo con pedestal', 'ud', 200.00, 130.00, 70.00, false, NULL),
('FON-005', 3, 'Ducha completa', 'Plato de ducha con mampara y grifería', 'ud', 650.00, 450.00, 200.00, false, NULL),
('FON-006', 3, 'Bañera acrílica', 'Bañera acrílica con grifería', 'ud', 550.00, 380.00, 170.00, false, NULL),
('FON-007', 3, 'Grifería lavabo', 'Grifería monomando para lavabo', 'ud', 85.00, 55.00, 30.00, false, NULL),
('FON-008', 3, 'Grifería ducha', 'Grifería termostática para ducha', 'ud', 180.00, 130.00, 50.00, false, NULL),
('FON-009', 3, 'Tubería cobre', 'Tubería de cobre instalada', 'm', 18.00, 8.00, 10.00, false, NULL),
('FON-010', 3, 'Tubería multicapa', 'Tubería multicapa instalada', 'm', 12.00, 5.00, 7.00, false, NULL);

-- ============================================
-- INSERTAR PRECIOS - CARPINTERÍA
-- ============================================

INSERT INTO price_master (code, category_id, concept, description, unit, base_price, material_cost, labor_cost, is_custom, user_id) VALUES
('CAR-001', 4, 'Puerta interior lisa', 'Puerta interior lisa lacada con premarco', 'ud', 280.00, 180.00, 100.00, false, NULL),
('CAR-002', 4, 'Puerta interior moldura', 'Puerta interior con moldura lacada', 'ud', 320.00, 210.00, 110.00, false, NULL),
('CAR-003', 4, 'Puerta corredera', 'Puerta corredera empotrada', 'ud', 450.00, 320.00, 130.00, false, NULL),
('CAR-004', 4, 'Armario empotrado', 'Armario empotrado con puertas correderas', 'm²', 280.00, 180.00, 100.00, false, NULL),
('CAR-005', 4, 'Ventana PVC', 'Ventana de PVC con doble acristalamiento', 'm²', 320.00, 220.00, 100.00, false, NULL),
('CAR-006', 4, 'Ventana aluminio', 'Ventana de aluminio con RPT', 'm²', 280.00, 190.00, 90.00, false, NULL),
('CAR-007', 4, 'Rodapié madera', 'Rodapié de madera lacado', 'm', 12.00, 5.00, 7.00, false, NULL),
('CAR-008', 4, 'Tarima flotante', 'Tarima flotante AC4 instalada', 'm²', 35.00, 20.00, 15.00, false, NULL);

-- ============================================
-- INSERTAR PRECIOS - ELECTRICIDAD
-- ============================================

INSERT INTO price_master (code, category_id, concept, description, unit, base_price, material_cost, labor_cost, is_custom, user_id) VALUES
('ELE-001', 5, 'Punto luz', 'Punto de luz sencillo', 'ud', 45.00, 15.00, 30.00, false, NULL),
('ELE-002', 5, 'Punto enchufe', 'Punto de enchufe sencillo', 'ud', 42.00, 12.00, 30.00, false, NULL),
('ELE-003', 5, 'Punto conmutado', 'Punto de luz conmutado', 'ud', 65.00, 25.00, 40.00, false, NULL),
('ELE-004', 5, 'Cuadro eléctrico', 'Cuadro eléctrico vivienda 10 elementos', 'ud', 320.00, 180.00, 140.00, false, NULL),
('ELE-005', 5, 'Downlight LED', 'Downlight LED empotrable', 'ud', 35.00, 20.00, 15.00, false, NULL),
('ELE-006', 5, 'Aplique pared', 'Aplique de pared decorativo', 'ud', 55.00, 30.00, 25.00, false, NULL),
('ELE-007', 5, 'Toma TV', 'Toma de televisión', 'ud', 38.00, 15.00, 23.00, false, NULL),
('ELE-008', 5, 'Toma datos', 'Toma de datos RJ45', 'ud', 42.00, 18.00, 24.00, false, NULL);

-- ============================================
-- INSERTAR PRECIOS - CALEFACCIÓN
-- ============================================

INSERT INTO price_master (code, category_id, concept, description, unit, base_price, material_cost, labor_cost, is_custom, user_id) VALUES
('CAL-001', 6, 'Radiador aluminio', 'Radiador de aluminio con válvulas', 'ud', 180.00, 110.00, 70.00, false, NULL),
('CAL-002', 6, 'Radiador toallero', 'Radiador toallero cromado', 'ud', 220.00, 150.00, 70.00, false, NULL),
('CAL-003', 6, 'Suelo radiante', 'Suelo radiante por m²', 'm²', 55.00, 30.00, 25.00, false, NULL),
('CAL-004', 6, 'Caldera gas', 'Caldera de gas condensación', 'ud', 1800.00, 1400.00, 400.00, false, NULL),
('CAL-005', 6, 'Aerotermia', 'Sistema de aerotermia completo', 'ud', 8500.00, 7000.00, 1500.00, false, NULL);

-- ============================================
-- INSERTAR PRECIOS - LIMPIEZA
-- ============================================

INSERT INTO price_master (code, category_id, concept, description, unit, base_price, material_cost, labor_cost, is_custom, user_id) VALUES
('LIM-001', 7, 'Limpieza final obra', 'Limpieza final de obra completa', 'm²', 3.50, 0.50, 3.00, false, NULL),
('LIM-002', 7, 'Retirada escombros', 'Retirada y gestión de escombros', 'm³', 35.00, 25.00, 10.00, false, NULL);

-- ============================================
-- INSERTAR PRECIOS - MATERIALES
-- ============================================

INSERT INTO price_master (code, category_id, concept, description, unit, base_price, material_cost, labor_cost, is_custom, user_id) VALUES
('MAT-001', 8, 'Cemento', 'Saco de cemento 25kg', 'ud', 8.50, 8.50, 0, false, NULL),
('MAT-002', 8, 'Arena', 'Metro cúbico de arena', 'm³', 25.00, 25.00, 0, false, NULL),
('MAT-003', 8, 'Ladrillo hueco', 'Palet de ladrillo hueco', 'ud', 180.00, 180.00, 0, false, NULL),
('MAT-004', 8, 'Placa pladur', 'Placa de pladur estándar', 'ud', 8.00, 8.00, 0, false, NULL);

-- ============================================
-- POLÍTICAS RLS
-- ============================================

-- Políticas para price_categories
CREATE POLICY "Ver categorías" ON price_categories FOR SELECT USING (true);
CREATE POLICY "Crear categorías admin" ON price_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizar categorías admin" ON price_categories FOR UPDATE USING (true);
CREATE POLICY "Eliminar categorías admin" ON price_categories FOR DELETE USING (true);

-- Políticas para price_master
CREATE POLICY "Ver precios base" ON price_master FOR SELECT USING (
  is_custom = false OR user_id = auth.uid()
);

CREATE POLICY "Crear precio personalizado" ON price_master FOR INSERT WITH CHECK (
  (is_custom = true AND user_id = auth.uid()) OR 
  (is_custom = false AND user_id IS NULL)
);

CREATE POLICY "Actualizar precio propio" ON price_master FOR UPDATE USING (
  (is_custom = true AND user_id = auth.uid()) OR
  (is_custom = false AND user_id IS NULL)
);

CREATE POLICY "Eliminar precio propio" ON price_master FOR DELETE USING (
  is_custom = true AND user_id = auth.uid()
);

-- Políticas para price_history
CREATE POLICY "Ver historial propio" ON price_history FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY "Crear historial" ON price_history FOR INSERT WITH CHECK (
  user_id = auth.uid()
);
