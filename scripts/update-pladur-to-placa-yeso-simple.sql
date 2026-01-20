-- Script simple para actualizar todas las referencias de "pladur" a "Placa de yeso laminado"
-- en la base de datos existente

-- Actualizar la tabla price_master
UPDATE price_master
SET 
  description = REPLACE(REPLACE(REPLACE(description, 'pladur', 'Placa de yeso laminado'), 'Pladur', 'Placa de yeso laminado'), 'PLADUR', 'Placa de yeso laminado'),
  subcategory = REPLACE(REPLACE(REPLACE(subcategory, 'pladur', 'Placa de yeso laminado'), 'Pladur', 'Placa de yeso laminado'), 'PLADUR', 'Placa de yeso laminado'),
  updated_at = NOW()
WHERE 
  description ILIKE '%pladur%' 
  OR subcategory ILIKE '%pladur%';

-- Actualizar productos de Amazon usando columna 'name' en lugar de 'title'
UPDATE amazon_products
SET 
  name = REPLACE(REPLACE(REPLACE(name, 'pladur', 'Placa de yeso laminado'), 'Pladur', 'Placa de yeso laminado'), 'PLADUR', 'Placa de yeso laminado'),
  description = REPLACE(REPLACE(REPLACE(description, 'pladur', 'Placa de yeso laminado'), 'Pladur', 'Placa de yeso laminado'), 'PLADUR', 'Placa de yeso laminado'),
  category = REPLACE(REPLACE(REPLACE(category, 'pladur', 'Placa de yeso laminado'), 'Pladur', 'Placa de yeso laminado'), 'PLADUR', 'Placa de yeso laminado'),
  subcategory = REPLACE(REPLACE(REPLACE(subcategory, 'pladur', 'Placa de yeso laminado'), 'Pladur', 'Placa de yeso laminado'), 'PLADUR', 'Placa de yeso laminado'),
  updated_at = NOW()
WHERE 
  name ILIKE '%pladur%' 
  OR description ILIKE '%pladur%'
  OR category ILIKE '%pladur%'
  OR subcategory ILIKE '%pladur%';

-- Mostrar los registros actualizados
SELECT code, subcategory, description 
FROM price_master 
WHERE subcategory ILIKE '%placa de yeso laminado%' OR description ILIKE '%placa de yeso laminado%';
