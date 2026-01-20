-- PARTE 3: GASFITERÍA (13 conceptos)
-- Eliminar precios existentes de Perú en esta categoría
DELETE FROM price_master_peru WHERE category_id = '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260';

-- GASFITERÍA
INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('03-F-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'RED DE BAÑO (Puntos de consumo: Inodoro, Lavatorio, etc.)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) del baño.', 'Ud', 700, 350, 100, 50, 1200, 0.05, 1260.00, true),
('03-F-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'RED DE COCINA (Puntos de consumo: Lavadero, L. etc.)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) de la cocina.', 'Ud', 500, 250, 80, 40, 870, 0.05, 913.50, true),
('03-F-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'RETIRADA BAJANTE DESAGÜES Y COLOCACIÓN PVC-110MM', 'Sustitución de tramo de bajante de desagüe.', 'Ud', 250, 150, 40, 20, 460, 0.05, 483.00, true),
('03-F-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'SUMINISTRO Y COLOCACIÓN CONDUCTO EXTRACCIÓN BAÑO', 'Colocación de conducto para extractor de ventilación en baño.', 'Ud', 130, 90, 20, 10, 250, 0.05, 262.50, true),
('03-F-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'SUMINISTRO Y COLOCACIÓN CONDUCTO CAMPANA EXTRACTORA', 'Colocación de conducto para campana extractora de humos.', 'Ud', 200, 150, 30, 15, 395, 0.05, 414.75, true),
('03-F-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'INSTALACIÓN INODORO (Montaje MO)', 'Montaje e instalación del inodoro.', 'Ud', 60, 20, 10, 5, 95, 0.05, 99.75, true),
('03-F-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'COLOCACIÓN PLATO DE DUCHA (Montaje MO)', 'Instalación y sellado del plato de ducha.', 'Ud', 120, 40, 20, 10, 190, 0.05, 199.50, true),
('03-F-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'INSTALACIÓN MUEBLE LAVATORIO (Montaje MO)', 'Instalación de mueble y lavatorio, incluyendo espejo y aplique.', 'Ud', 110, 30, 15, 10, 165, 0.05, 173.25, true),
('03-F-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'INSTALACIÓN MAMPARA (Montaje MO)', 'Montaje de mampara de ducha o tina.', 'Ud', 115, 30, 15, 10, 170, 0.05, 178.50, true),
('03-F-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'INSTALACIÓN CAÑO DUCHA (Montaje MO)', 'Montaje de monomando o termostática de ducha.', 'Ud', 60, 20, 10, 5, 95, 0.05, 99.75, true),
('03-F-11', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'INSTALACIÓN CAÑO LAVATORIO (Montaje MO)', 'Montaje de monomando de lavatorio.', 'Ud', 60, 20, 10, 5, 95, 0.05, 99.75, true),
('03-F-12', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'MONTAJE LAVADERO, LAVADORA Y LAVAVAJILLAS (MO)', 'Instalación y conexionado de electrodomésticos de agua.', 'Ud', 80, 30, 15, 5, 130, 0.05, 136.50, true),
('03-F-13', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'MONTAJE Y COLOCACIÓN CAMPANA EXTRACTORA COCINA (MO)', 'Instalación de campana extractora en cocina.', 'Ud', 60, 20, 10, 5, 95, 0.05, 99.75, true);

-- Verificación
SELECT 'GASFITERÍA' as categoria, COUNT(*) as total_precios FROM price_master_peru WHERE category_id = '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260';
