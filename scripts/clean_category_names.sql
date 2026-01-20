-- Script para limpiar los nombres de categorías en price_categories
-- Elimina los números del principio de los nombres de categorías

-- Actualizar nombres de categorías eliminando números
UPDATE price_categories
SET name = TRIM(REGEXP_REPLACE(name, '^\d+(-[A-Z])?\.\s*', '', 'g'))
WHERE name ~ '^\d+';

-- Verificar que no haya duplicados después de la limpieza
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT name, COUNT(*)
    FROM price_categories
    GROUP BY name
    HAVING COUNT(*) > 1
  ) AS duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Advertencia: Se encontraron % categorías duplicadas después de limpiar los nombres', duplicate_count;
    -- Delete duplicate categories keeping only the first one
    DELETE FROM price_categories
    WHERE id NOT IN (
      SELECT MIN(id)
      FROM price_categories
      GROUP BY name
    );
    RAISE NOTICE 'Duplicados eliminados exitosamente';
  ELSE
    RAISE NOTICE 'No se encontraron duplicados. Limpieza exitosa.';
  END IF;
END $$;

-- Removido sort_order que no existe en la tabla
-- Mostrar las categorías actualizadas
SELECT id, name
FROM price_categories
ORDER BY name;
