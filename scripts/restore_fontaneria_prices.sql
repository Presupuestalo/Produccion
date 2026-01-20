-- Changed description column to subcategory so concepts show correctly in UI
-- Restauración de precios de FONTANERÍA desde backup del 20 de noviembre 2024
-- Este script elimina los precios corruptos de FONTANERÍA y los reemplaza con los datos del backup

BEGIN;

-- Eliminar precios existentes de FONTANERÍA
DELETE FROM price_master WHERE code LIKE '04-F-%' OR code LIKE '03-F-%';

-- Insertando con subcategory (concepto visible en UI) en lugar de description
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, material_cost, labor_cost, base_price, profit_margin, final_price, is_active, is_custom, created_at, updated_at) VALUES
('6a022a8c-8d1e-4505-87ab-2d28913ff40c', '04-F-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED DE BAÑO', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) del baño.', 'Ud', 475.20, 475.20, 950.40, 0.15, 950.40, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-20 10:57:47.664612+00'),
('cb1d1e86-e3cc-4f5f-8a46-8e2fdc97a5c2', '04-F-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED DE COCINA', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) de la cocina.', 'Ud', 331.20, 331.20, 662.40, 0.15, 662.40, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-20 10:57:42.873106+00'),
('449479f3-623c-4667-9987-55e0362ca262', '04-F-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RETIRADA BAJANTE FECALES Y COLOCACIÓN PVC-110MM', 'Sustitución de tramo de bajante.', 'Ud', 154.80, 154.80, 309.60, 0.15, 309.60, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('d03ee679-07d3-4fc5-8118-a30ad07bc873', '04-F-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'SUMINISTRO Y COLOCACIÓN CONDUCTO EXTRACCIÓN BAÑO', 'Colocación de conducto para extractor de ventilación en baño.', 'Ud', 82.08, 82.08, 164.16, 0.15, 164.16, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('3cb2be14-8432-4a13-a0c6-56b82e9168c9', '04-F-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'SUMINISTRO Y COLOCACIÓN CONDUCTO CAMPANA EXTRACTORA', 'Colocación de conducto para campana extractora de humos.', 'Ud', 129.60, 129.60, 259.20, 0.15, 259.20, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('b9dc9334-9b57-42ef-8eb9-ab0312b331db', '04-F-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN INODORO', 'Instalación de inodoro con cisterna.', 'Ud', 36.00, 36.00, 72.00, 0.15, 72.00, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('18ebbcab-2768-46ac-9799-0e9e0e0562dd', '04-F-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'COLOCACIÓN PLATO DE DUCHA', 'Instalación y sellado del plato de ducha.', 'Ud', 72.00, 72.00, 144.00, 0.15, 144.00, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('7d05f5f6-fa2f-4fd9-9c7f-15ded8f09192', '04-F-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN MUEBLE LAVABO', 'Instalación de mueble y lavabo, incluyendo espejo y aplique.', 'Ud', 64.80, 64.80, 129.60, 0.15, 129.60, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('e77ee27d-bc58-4913-9fdd-6decc040e124', '04-F-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN MAMPARA (Montaje MO)', 'Montaje de mampara de ducha o bañera.', 'Ud', 68.40, 68.40, 136.80, 0.15, 136.80, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('abe078b6-65ec-4e45-a2ca-ce204b356d97', '04-F-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN GRIFO DUCHA', 'Montaje de monomando o termostática de ducha.', 'Ud', 36.00, 36.00, 72.00, 0.15, 72.00, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('d6232897-fd8b-4652-8745-d20c1705eefe', '04-F-11', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN GRIFO LAVABO (Montaje MO)', 'Montaje de monomando de lavabo.', 'Ud', 36.00, 36.00, 72.00, 0.15, 72.00, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('978c7590-e46a-4598-a2fa-9fcaa2ddd019', '04-F-12', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'MONTAJE FREGADERO, LAVADORA Y LAVAVAJILLAS', 'Instalación y conexionado de electrodomésticos de agua.', 'Ud', 46.80, 46.80, 93.60, 0.15, 93.60, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('f4bac64a-c0f9-4580-98f2-f7e4d5a9d950', '04-F-13', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'MONTAJE Y COLOCACIÓN CAMPANA EXTRACTORA COCINA (MO)', 'Instalación de campana extractora en cocina.', 'Ud', 36.00, 36.00, 72.00, 0.15, 72.00, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00');

COMMIT;

-- Verificación
SELECT COUNT(*) as total_fontaneria FROM price_master WHERE code LIKE '04-F-%' OR code LIKE '03-F-%';
