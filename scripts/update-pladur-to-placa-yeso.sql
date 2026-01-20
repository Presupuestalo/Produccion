-- Script para actualizar todas las referencias de "pladur" a "Placa de yeso laminado"
-- en la base de datos

-- Actualizar subcategorías en price_master
UPDATE public.price_master 
SET subcategory = 'FORMACIÓN DE TRASDOSADO EN PLACA DE YESO LAMINADO (13+45)' 
WHERE subcategory LIKE '%PLADUR%' AND code = '02-A-03';

UPDATE public.price_master 
SET subcategory = 'TABIQUES PLACA DE YESO LAMINADO DOBLE CARA (13x45x13)' 
WHERE subcategory LIKE '%PLADUR%' AND code = '02-A-05';

UPDATE public.price_master 
SET subcategory = 'BAJADO DE TECHOS (Placa de yeso laminado BA 15)' 
WHERE subcategory LIKE '%Pladur%' AND code = '02-A-16';

-- Actualizar descripciones que contengan "pladur"
UPDATE public.price_master 
SET description = REPLACE(description, 'pladur', 'placa de yeso laminado')
WHERE LOWER(description) LIKE '%pladur%';

UPDATE public.price_master 
SET description = REPLACE(description, 'Pladur', 'Placa de yeso laminado')
WHERE description LIKE '%Pladur%';

-- Actualizar conceptos que contengan "pladur"
UPDATE public.price_master 
SET concept = REPLACE(concept, 'pladur', 'placa de yeso laminado')
WHERE LOWER(concept) LIKE '%pladur%';

UPDATE public.price_master 
SET concept = REPLACE(concept, 'Pladur', 'Placa de yeso laminado')
WHERE concept LIKE '%Pladur%';

UPDATE public.price_master 
SET concept = REPLACE(concept, 'PLADUR', 'PLACA DE YESO LAMINADO')
WHERE concept LIKE '%PLADUR%';

-- Actualizar nombres de categorías si existen
UPDATE public.price_categories 
SET name = REPLACE(name, 'pladur', 'placa de yeso laminado')
WHERE LOWER(name) LIKE '%pladur%';

UPDATE public.price_categories 
SET name = REPLACE(name, 'Pladur', 'Placa de yeso laminado')
WHERE name LIKE '%Pladur%';

-- Actualizar descripciones de categorías
UPDATE public.price_categories 
SET description = REPLACE(description, 'pladur', 'placa de yeso laminado')
WHERE LOWER(description) LIKE '%pladur%';

UPDATE public.price_categories 
SET description = REPLACE(description, 'Pladur', 'Placa de yeso laminado')
WHERE description LIKE '%Pladur%';
