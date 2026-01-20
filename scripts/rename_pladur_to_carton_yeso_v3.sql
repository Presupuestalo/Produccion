-- Script para renombrar "pladur" por "cartón yeso" en todos los registros existentes
-- Version 3: Actualización completa de scripts SQL

-- Actualizar la tabla price_master donde aparezca "pladur" en cualquier campo de texto
UPDATE price_master
SET 
  concept = REPLACE(concept, 'pladur', 'cartón yeso'),
  concept = REPLACE(concept, 'Pladur', 'Cartón yeso'),
  concept = REPLACE(concept, 'PLADUR', 'CARTÓN YESO'),
  description = REPLACE(description, 'pladur', 'cartón yeso'),
  description = REPLACE(description, 'Pladur', 'Cartón yeso'),
  description = REPLACE(description, 'PLADUR', 'CARTÓN YESO'),
  subcategory = REPLACE(subcategory, 'pladur', 'cartón yeso'),
  subcategory = REPLACE(subcategory, 'Pladur', 'Cartón yeso'),
  subcategory = REPLACE(subcategory, 'PLADUR', 'CARTÓN YESO')
WHERE 
  LOWER(concept) LIKE '%pladur%' 
  OR LOWER(description) LIKE '%pladur%'
  OR LOWER(subcategory) LIKE '%pladur%';

-- Actualizar los precios estimados si hay referencias a pladur
UPDATE estimated_prices
SET 
  notes = REPLACE(notes, 'pladur', 'cartón yeso'),
  notes = REPLACE(notes, 'Pladur', 'Cartón yeso'),
  notes = REPLACE(notes, 'PLADUR', 'CARTÓN YESO')
WHERE 
  LOWER(notes) LIKE '%pladur%';

-- Actualizar proyectos si contienen la palabra pladur
UPDATE projects
SET 
  description = REPLACE(description, 'pladur', 'cartón yeso'),
  description = REPLACE(description, 'Pladur', 'Cartón yeso'),
  description = REPLACE(description, 'PLADUR', 'CARTÓN YESO'),
  notes = REPLACE(notes, 'pladur', 'cartón yeso'),
  notes = REPLACE(notes, 'Pladur', 'Cartón yeso'),
  notes = REPLACE(notes, 'PLADUR', 'CARTÓN YESO')
WHERE 
  LOWER(description) LIKE '%pladur%' 
  OR LOWER(notes) LIKE '%pladur%';

-- Actualizar el historial de precios
UPDATE price_history
SET 
  change_type = REPLACE(change_type, 'pladur', 'cartón yeso'),
  change_type = REPLACE(change_type, 'Pladur', 'Cartón yeso'),
  change_type = REPLACE(change_type, 'PLADUR', 'CARTÓN YESO')
WHERE 
  LOWER(change_type) LIKE '%pladur%';

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Actualización completada: todas las referencias a "pladur" han sido reemplazadas por "cartón yeso"';
END $$;
