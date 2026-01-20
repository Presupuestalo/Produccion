-- Eliminar el color del nombre de los platos de ducha
-- El color ahora se muestra en la columna "color" en detalles

UPDATE public.price_master
SET subcategory = 'PLATO DE DUCHA DE RESINA'
WHERE subcategory LIKE 'PLATO DE DUCHA DE RESINA%'
  AND color IS NOT NULL;

-- Verificar los cambios
SELECT 
  id,
  subcategory,
  color,
  description
FROM public.price_master
WHERE subcategory = 'PLATO DE DUCHA DE RESINA'
ORDER BY color;
