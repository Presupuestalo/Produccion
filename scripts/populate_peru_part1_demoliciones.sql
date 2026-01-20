-- PARTE 1: DEMOLICIONES (16 conceptos)
-- Eliminar precios existentes de Perú en esta categoría
DELETE FROM price_master_peru WHERE category_id = '5b38410c-4b7b-412a-9f57-6e74db0cc237';

-- DEMOLICIONES
INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'TABIQUES DRYWALL DEMOLICIÓN', 'Demoler tabique existente de drywall, incluyendo mano de obra y eliminación de escombros a punto autorizado.', 'm²', 45, 5, 10, 5, 65, 0.15, 74.75, true),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'PICADO MAYÓLICA PAREDES', 'Picado de paredes para la retirada del enchape de mayólica o revestimiento cerámico existente en parámetros verticales.', 'm²', 40, 5, 8, 1, 54, 0.15, 62.10, true),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'PICADO PISOS', 'Picado de piso y posterior eliminación de escombros.', 'm²', 55, 10, 12, 2, 79, 0.15, 90.85, true),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE FALSO CIELO RASO', 'Retiro y eliminación de falso cielo raso de yeso o drywall.', 'm²', 40, 5, 8, 1, 54, 0.15, 62.10, true),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE MOLDURAS', 'Retiro de molduras de yeso o madera en el perímetro de cielos rasos.', 'ml', 4, 0.5, 1, 0.5, 6, 0.15, 6.90, true),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE PISO LAMINADO Y LISTONES', 'Desmontaje de piso laminado flotante o piso de madera incluyendo los listones inferiores.', 'm²', 22, 3, 5, 2, 32, 0.15, 36.80, true),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE CONTRAZÓCALO DE MADERA', 'Retiro de contrazócalo de madera y acopio para eliminación.', 'ml', 7, 1, 1.5, 0.5, 10, 0.15, 11.50, true),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE CONTRAZÓCALO CERÁMICO', 'Retiro de contrazócalo cerámico o de mayólica.', 'ml', 15, 2, 3, 1, 21, 0.15, 24.15, true),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'CONTENEDOR ESCOMBROS', 'Suministro, colocación y retiro de contenedor de residuos de obra a botadero autorizado.', 'Ud', 1200, 600, 200, 100, 2100, 0.04, 2185.00, true),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'HORA BAJADA DE ESCOMBROS', 'Mano de obra por hora dedicada al acarreo y bajada de escombros.', 'H', 52, 0, 0, 0, 52, 0.15, 59.80, true),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'ANULACIÓN INSTALACIÓN ELÉCTRICA/GASFITERÍA', 'Desconexión y anulación de líneas antiguas de electricidad y gasfitería.', 'Ud', 120, 20, 15, 5, 160, 0.08, 172.80, true),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'DESMONTAJE HOJAS PUERTAS Y RETIRADA', 'Desmontaje de hoja de puerta existente y posterior retiro.', 'Ud', 20, 2, 3, 0, 25, 0.15, 28.80, true),
('01-D-13', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'PREPARACIÓN PAREDES (Textura/Papel)', 'Rascado de paredes para eliminación de textura, papel tapiz o materiales blandos.', 'm²', 2.5, 0.3, 0.4, 0, 3.2, 0.13, 3.60, true),
('01-D-14', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO ELEMENTOS BAÑO (Sanitarios)', 'Desmontaje y retiro de inodoro, bidet, lavatorio o tina.', 'Ud', 120, 20, 15, 5, 160, 0.08, 172.80, true),
('01-D-15', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE MOBILIARIO COCINA', 'Desmontaje de muebles altos y bajos de cocina existentes.', 'Ud', 240, 30, 40, 10, 320, 0.08, 345.60, true),
('01-D-16', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE ARMARIOS Y RESTO MOBILIARIO', 'Desmontaje de armarios empotrados o mobiliario fijo a medida.', 'Ud', 380, 50, 60, 20, 510, 0.01, 515.52, true);

-- Verificación
SELECT 'DEMOLICIONES' as categoria, COUNT(*) as total_precios FROM price_master_peru WHERE category_id = '5b38410c-4b7b-412a-9f57-6e74db0cc237';
