-- Eliminar categorías duplicadas y estandarizar nombres
-- Este script corrige inconsistencias en price_categories

-- Primero, obtenemos las categorías que queremos mantener
DO $$
BEGIN
  -- Eliminar categoría "Materiales" con M mayúscula si existe "MATERIALES"
  DELETE FROM price_categories 
  WHERE name = 'Materiales' 
  AND EXISTS (SELECT 1 FROM price_categories WHERE name = 'MATERIALES');

  -- Estandarizar nombres de categorías a formato título (Primera letra mayúscula)
  UPDATE price_categories SET name = 'Derribos' WHERE UPPER(name) = 'DERRIBOS';
  UPDATE price_categories SET name = 'Albañilería' WHERE UPPER(name) = 'ALBAÑILERÍA' OR UPPER(name) = 'ALBANILERIA';
  UPDATE price_categories SET name = 'Tabiques y Trasdosados' WHERE UPPER(name) IN ('TABIQUES Y TRASDOSADOS', 'TABIQUES');
  UPDATE price_categories SET name = 'Fontanería' WHERE UPPER(name) = 'FONTANERÍA' OR UPPER(name) = 'FONTANERIA';
  UPDATE price_categories SET name = 'Carpintería' WHERE UPPER(name) = 'CARPINTERÍA' OR UPPER(name) = 'CARPINTERIA';
  UPDATE price_categories SET name = 'Materiales' WHERE UPPER(name) = 'MATERIALES';
  UPDATE price_categories SET name = 'Electricidad' WHERE UPPER(name) = 'ELECTRICIDAD';
  UPDATE price_categories SET name = 'Calefacción' WHERE UPPER(name) IN ('CALEFACCIÓN', 'CALEFACCION', 'CLIMATIZACIÓN', 'CLIMATIZACION');
  UPDATE price_categories SET name = 'Limpieza' WHERE UPPER(name) = 'LIMPIEZA';
  UPDATE price_categories SET name = 'Pintura' WHERE UPPER(name) = 'PINTURA';

  -- Asegurar que no haya duplicados después de la normalización
  -- Mantener solo la primera ocurrencia de cada nombre
  DELETE FROM price_categories a
  USING price_categories b
  WHERE a.id > b.id 
  AND a.name = b.name;

  -- Actualizar display_order para mantener un orden lógico
  UPDATE price_categories SET display_order = 1, updated_at = NOW() WHERE name = 'Derribos';
  UPDATE price_categories SET display_order = 2, updated_at = NOW() WHERE name = 'Albañilería';
  UPDATE price_categories SET display_order = 3, updated_at = NOW() WHERE name = 'Tabiques y Trasdosados';
  UPDATE price_categories SET display_order = 4, updated_at = NOW() WHERE name = 'Fontanería';
  UPDATE price_categories SET display_order = 5, updated_at = NOW() WHERE name = 'Carpintería';
  UPDATE price_categories SET display_order = 6, updated_at = NOW() WHERE name = 'Materiales';
  UPDATE price_categories SET display_order = 7, updated_at = NOW() WHERE name = 'Electricidad';
  UPDATE price_categories SET display_order = 8, updated_at = NOW() WHERE name = 'Calefacción';
  UPDATE price_categories SET display_order = 9, updated_at = NOW() WHERE name = 'Limpieza';
  UPDATE price_categories SET display_order = 10, updated_at = NOW() WHERE name = 'Pintura';

END $$;

-- Verificar resultado
SELECT name, display_order, is_active 
FROM price_categories 
ORDER BY display_order;
