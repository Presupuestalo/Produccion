-- Añadir nueva categoría "TABIQUES Y TRASDOSADOS"
INSERT INTO price_categories (id, name, description, icon, display_order, is_active)
VALUES (
  '99999999-9999-9999-9999-999999999999',
  'TABIQUES Y TRASDOSADOS',
  'Formación de tabiques y trasdosados',
  '🧱',
  3,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Mover partidas de tabiques y trasdosados desde ALBAÑILERÍA a la nueva categoría
UPDATE price_master
SET category_id = '99999999-9999-9999-9999-999999999999'
WHERE code IN ('02-A-03', '02-A-04', '02-A-05')
  AND category_id = (SELECT id FROM price_categories WHERE name = 'ALBANILERIA');

-- Verificar los cambios
SELECT 
  pm.code,
  pm.concept,
  pc.name as category
FROM price_master pm
JOIN price_categories pc ON pm.category_id = pc.id
WHERE pm.code IN ('02-A-03', '02-A-04', '02-A-05')
ORDER BY pm.code;
