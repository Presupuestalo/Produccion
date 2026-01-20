-- Changed description column to subcategory so concepts show correctly in UI
-- Restaurar precios de CARPINTERÍA desde el backup del 20 de noviembre 2024
-- Updated column names to match current schema: base_cost→base_price, cost_with_margin→final_price
-- Este script elimina los precios existentes de CARPINTERÍA y los reemplaza con los del backup

BEGIN;

-- Eliminar precios existentes de CARPINTERÍA
DELETE FROM price_master WHERE code LIKE '05-C-%';

-- Insertar precios de CARPINTERÍA desde el backup
-- Using subcategory instead of description so concepts show correctly in UI
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, material_cost, labor_cost, base_price, profit_margin, final_price, brand, model, color, is_active, is_custom, created_at, updated_at) VALUES
('740d4781-0fec-444d-b988-6ed43666702d', '05-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'NIVELACIÓN DE SUELOS CON TABLERO Y RASTRELE', 'Colocación de tablero sobre rastreles para nivelar un suelo antes de instalar tarima.', 'm²', 30.24, 20.16, 50.40, 0.15, 50.40, NULL, NULL, NULL, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('f2ddc499-d10d-468c-862f-b7849f883139', '05-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PARQUET FLOTANTE (MO)', 'Mano de obra de colocación de tarima flotante o suelo laminado.', 'm²', 12.53, 8.35, 20.88, 0.15, 20.88, NULL, NULL, NULL, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('e70f7f48-74cd-4c0d-a30c-7f2d05f0fa87', '05-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'SUMINISTRO Y COLOCACIÓN PREMARCOS (MO)', 'Instalación de premarco.', 'Ud', 77.76, 51.84, 129.60, 0.15, 129.60, NULL, NULL, NULL, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('d0de5ccd-d4af-48c8-b82c-f4bd6e1dc0ae', '05-C-12', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'REBAJE DE PUERTAS', 'Rebaje inferior de puertas para ajuste a la altura del nuevo suelo.', 'Ud', 13.82, 9.22, 23.04, 0.15, 23.04, NULL, NULL, NULL, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('903cbce6-567f-4f1a-93d6-7872ea2aad50', '05-C-10', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ACUCHILLADO SUELO + BARNIZADO', 'INSTALACIÓN DE AEROTERMIA', 'm²', 85.00, 45.00, 130.00, 15.00, 149.50, NULL, NULL, NULL, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-19 21:56:12.749945+00'),
('002863e4-d4f1-4241-b15e-2d2730019aab', '05-C-11', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'EMPLASTECIDO DE LAS LAMAS DE TARIMA', 'INSTALACIÓN DE SUELO RADIANTE', 'm²', 75.00, 40.00, 115.00, 15.00, 132.25, NULL, NULL, NULL, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-19 21:56:12.749945+00'),
('7729d0f8-2734-4b00-86a6-2823e82343ba', '05-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA ABATIBLE 1 HOJA', 'Instalación de puerta abatible en block.', 'Ud', 86.40, 57.60, 144.00, 0.15, 144.00, NULL, NULL, NULL, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('5bae5637-8b2e-4dac-a38f-7cedaec61593', '05-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN RODAPIÉ DM LACADO', 'Suministro y colocación de rodapié.', 'ml', 4.84, 3.22, 8.06, 0.15, 8.06, NULL, NULL, NULL, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('31f56b5b-26df-4e58-8deb-d617b60db3b2', '05-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA CORREDERA', 'Instalación de hoja de puerta corredera en su cajetín.', 'Ud', 198.72, 132.48, 331.20, 0.15, 331.20, NULL, NULL, NULL, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('1bffca2a-b260-4ed9-ba9c-dad98317af11', '05-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'SUMINISTRO Y COLOCACIÓN FORRO (MARCOS SIN PUERTA)', 'Instalación de forro de marco sin hoja de puerta.', 'Ud', 171.94, 114.62, 286.56, 0.15, 286.56, NULL, NULL, NULL, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('ceac6398-088c-4477-bb35-6ac29e7ce2e0', '05-C-09', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA SEGURIDAD ENTRADA', 'Instalación de puerta de seguridad.', 'Ud', 390.00, 260.00, 650.00, 0.15, 650.00, NULL, NULL, NULL, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('9a7e0e16-8ae2-4902-a1c1-eb304383489f', '05-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN SUELO VINÍLICO', 'Mano de obra de colocación de suelo de vinilo tipo "click".', 'm²', 16.42, 10.94, 27.36, 0.15, 27.36, NULL, NULL, NULL, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('87305ce9-dadb-4d0f-800f-5ea9bd21253e', '05-C-18', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA CORREDERA EXTERIOR CON CARRIL', 'Instalación de puerta corredera exterior con sistema de carril visto.', 'Ud', 0.00, 165.60, 0.00, 0.15, 0.00, NULL, NULL, NULL, true, false, '2025-10-12 22:54:15.019137+00', '2025-11-14 18:36:51.543027+00');

COMMIT;

-- Verificar que se restauraron correctamente
SELECT COUNT(*) as total_carpinteria FROM price_master WHERE code LIKE '05-C-%';
SELECT code, subcategory, description, base_price, final_price FROM price_master WHERE code LIKE '05-C-%' ORDER BY code;
