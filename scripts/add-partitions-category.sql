-- Añadir nueva categoría "TABIQUES Y TRASDOSADOS"
INSERT INTO price_categories (code, name, sort_order)
VALUES ('03', 'TABIQUES Y TRASDOSADOS', 3)
ON CONFLICT (code) DO NOTHING;

-- Actualizar el sort_order de las categorías existentes para hacer espacio
UPDATE price_categories SET sort_order = 4 WHERE code = '04'; -- FONTANERÍA
UPDATE price_categories SET sort_order = 5 WHERE code = '05'; -- ELECTRICIDAD
UPDATE price_categories SET sort_order = 6 WHERE code = '06'; -- PINTURA
UPDATE price_categories SET sort_order = 7 WHERE code = '07'; -- CARPINTERÍA
UPDATE price_categories SET sort_order = 8 WHERE code = '08'; -- MATERIALES
UPDATE price_categories SET sort_order = 9 WHERE code = '09'; -- VARIOS

-- Mover partidas de tabiques y trasdosados de ALBAÑILERÍA a la nueva categoría
UPDATE price_master
SET category_code = '03'
WHERE code IN ('02-A-03', '02-A-04', '02-A-05', '02-A-06', '02-A-07', '02-A-08', '02-A-09');

-- Actualizar los códigos de las partidas movidas
UPDATE price_master SET code = '03-T-01' WHERE code = '02-A-03'; -- Tabique pladur simple
UPDATE price_master SET code = '03-T-02' WHERE code = '02-A-04'; -- Tabique pladur doble
UPDATE price_master SET code = '03-T-03' WHERE code = '02-A-05'; -- Tabique ladrillo
UPDATE price_master SET code = '03-T-04' WHERE code = '02-A-06'; -- Trasdosado pladur simple
UPDATE price_master SET code = '03-T-05' WHERE code = '02-A-07'; -- Trasdosado pladur doble
UPDATE price_master SET code = '03-T-06' WHERE code = '02-A-08'; -- Trasdosado ladrillo
UPDATE price_master SET code = '03-T-07' WHERE code = '02-A-09'; -- Aislamiento acústico
