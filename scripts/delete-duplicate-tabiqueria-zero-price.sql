-- Eliminar entradas de TABIQUERÍA con precio 0 que son duplicados innecesarios
-- Usar base_price en lugar de unit_price y eliminar referencias a columnas inexistentes

DELETE FROM price_master
WHERE 
  subcategory = 'TABIQUERÍA' 
  AND base_price = 0.00
  AND final_price = 0.00;

-- Verificar las entradas restantes de TABIQUERÍA
SELECT 
  code,
  subcategory,
  description,
  base_price,
  final_price,
  unit
FROM price_master
WHERE 
  subcategory = 'TABIQUERÍA'
ORDER BY base_price DESC;
