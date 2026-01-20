-- Poblar price_master_peru con precios peruanos usando los IDs reales de categorías
-- Eliminar precios existentes de Perú
DELETE FROM price_master_peru;

-- DERRIBOS (5b38410c-4b7b-412a-9f57-6e74db0cc237)
INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('DER-001', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'Demolición', 'Demolición de tabique de drywall', 'Demolición de tabique de drywall existente, incluyendo mano de obra y desescombro a punto autorizado.', 'm²', 8.50, 0.00, 2.00, 1.50, 12.00, 20, 14.40, true),
('DER-002', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'Demolición', 'Picado de piso de concreto', 'Picado de piso de concreto y posterior desescombro.', 'm²', 12.00, 0.00, 3.50, 2.00, 17.50, 20, 21.00, true),
('DER-003', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'Demolición', 'Retiro de falso techo', 'Retiro y desescombro de falso techo de drywall o similar.', 'm²', 6.00, 0.00, 1.50, 1.00, 8.50, 20, 10.20, true);

-- ALBAÑILERIA (d6e90b3f-3bc5-4f15-8530-19da496abc5e)
INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('ALB-001', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'Muros', 'Tabique de drywall', 'Instalación de tabique de drywall con estructura metálica, incluye placas, perfiles, tornillos y cinta.', 'm²', 18.00, 25.00, 2.00, 3.00, 48.00, 25, 60.00, true),
('ALB-002', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'Pisos', 'Contrapiso de concreto', 'Vaciado de contrapiso de concreto pulido, espesor 5cm, incluye materiales y mano de obra.', 'm²', 15.00, 22.00, 4.00, 2.50, 43.50, 25, 54.38, true),
('ALB-003', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'Revestimientos', 'Tarrajeo de muros', 'Tarrajeo de muros con mezcla cemento-arena, acabado frotachado, incluye materiales.', 'm²', 12.00, 8.50, 1.50, 1.00, 23.00, 25, 28.75, true),
('ALB-004', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'Revestimientos', 'Instalación de mayólica', 'Instalación de mayólica en muros, incluye pegamento, fragua y mano de obra.', 'm²', 20.00, 35.00, 2.00, 3.00, 60.00, 25, 75.00, true),
('ALB-005', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'Pisos', 'Instalación de porcelanato', 'Instalación de porcelanato en pisos, incluye pegamento, fragua y nivelación.', 'm²', 25.00, 45.00, 3.00, 4.00, 77.00, 25, 96.25, true);

-- FONTANERIA (3d93ed2f-bfec-4f36-834e-2d3c4d7d7260)
INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('FON-001', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'Gasfitería', 'Instalación de inodoro', 'Instalación de inodoro con accesorios, incluye mano de obra y materiales de conexión.', 'und', 45.00, 15.00, 5.00, 5.00, 70.00, 25, 87.50, true),
('FON-002', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'Gasfitería', 'Instalación de lavatorio', 'Instalación de lavatorio con grifería, incluye conexiones y accesorios.', 'und', 40.00, 12.00, 4.00, 4.00, 60.00, 25, 75.00, true),
('FON-003', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'Tuberías', 'Tubería PVC desagüe', 'Instalación de tubería PVC para desagüe, incluye accesorios y pegamento.', 'm', 8.00, 12.00, 1.50, 1.50, 23.00, 25, 28.75, true),
('FON-004', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'Tuberías', 'Tubería PVC agua fría', 'Instalación de tubería PVC para agua fría, incluye accesorios.', 'm', 7.00, 10.00, 1.00, 1.00, 19.00, 25, 23.75, true);

-- CARPINTERIA (e4967edd-53b5-459a-bb68-b1fd88ee6836)
INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('CAR-001', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'Puertas', 'Puerta contraplacada', 'Suministro e instalación de puerta contraplacada con marco, incluye bisagras y cerradura.', 'und', 80.00, 180.00, 10.00, 15.00, 285.00, 25, 356.25, true),
('CAR-002', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'Ventanas', 'Ventana de aluminio', 'Fabricación e instalación de ventana de aluminio con vidrio, incluye accesorios.', 'm²', 120.00, 200.00, 15.00, 20.00, 355.00, 25, 443.75, true),
('CAR-003', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'Muebles', 'Mueble de melamina', 'Fabricación e instalación de mueble de melamina, incluye herrajes y acabados.', 'm', 60.00, 85.00, 8.00, 10.00, 163.00, 25, 203.75, true);

-- ELECTRICIDAD (243dee0d-edba-4de9-94a4-2a4c17ff607d)
INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('ELE-001', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'Instalaciones', 'Punto de luz', 'Instalación de punto de luz, incluye cable, caja y accesorios.', 'pto', 25.00, 18.00, 2.00, 3.00, 48.00, 25, 60.00, true),
('ELE-002', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'Instalaciones', 'Punto de tomacorriente', 'Instalación de punto de tomacorriente doble, incluye cable y accesorios.', 'pto', 28.00, 20.00, 2.00, 3.00, 53.00, 25, 66.25, true),
('ELE-003', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'Tableros', 'Tablero eléctrico', 'Instalación de tablero eléctrico con interruptores termomagnéticos.', 'und', 120.00, 250.00, 15.00, 20.00, 405.00, 25, 506.25, true);

-- CALEFACCION (5090928c-9b72-4d83-8667-9d01ddbfca47)
INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('CAL-001', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'Agua Caliente', 'Instalación de terma eléctrica', 'Instalación de terma eléctrica, incluye conexiones eléctricas y de agua.', 'und', 80.00, 35.00, 10.00, 12.00, 137.00, 25, 171.25, true),
('CAL-002', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'Agua Caliente', 'Instalación de terma a gas', 'Instalación de terma a gas, incluye conexiones de gas y agua.', 'und', 100.00, 45.00, 12.00, 15.00, 172.00, 25, 215.00, true);

-- LIMPIEZA (0f95a55f-12ba-4e0e-ba0d-d01229d05c4c)
INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('LIM-001', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'Limpieza Final', 'Limpieza de obra', 'Limpieza final de obra, incluye retiro de escombros menores y limpieza de superficies.', 'm²', 3.50, 1.50, 0.50, 0.50, 6.00, 25, 7.50, true),
('LIM-002', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'Limpieza Final', 'Limpieza de vidrios', 'Limpieza de vidrios y ventanas, incluye materiales de limpieza.', 'm²', 4.00, 1.00, 0.50, 0.50, 6.00, 25, 7.50, true);

-- Verificar inserción
SELECT 
  pc.name as categoria,
  COUNT(*) as cantidad_precios
FROM price_master_peru pm
JOIN price_categories pc ON pm.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;
