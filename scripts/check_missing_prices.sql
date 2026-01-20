-- Script de diagnóstico para verificar precios por categoría

-- Contar precios por categoría
SELECT 
  category,
  COUNT(*) as total_prices,
  COUNT(CASE WHEN is_custom = true THEN 1 END) as custom_prices,
  COUNT(CASE WHEN is_custom = false THEN 1 END) as base_prices
FROM price_master
GROUP BY category
ORDER BY category;

-- Ver precios específicos de Fontanería, Electricidad y Carpintería
SELECT 
  code,
  concept,
  category,
  is_custom,
  user_id,
  created_at
FROM price_master
WHERE category IN ('Fontanería', 'Electricidad', 'Carpintería')
ORDER BY category, code
LIMIT 50;

-- Verificar si hay precios con códigos duplicados
SELECT 
  code,
  COUNT(*) as count
FROM price_master
GROUP BY code
HAVING COUNT(*) > 1
ORDER BY count DESC
LIMIT 20;
