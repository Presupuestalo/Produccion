-- Añadir nueva categoría "TABIQUES Y TRASDOSADOS"
-- Este script crea la categoría y mueve las partidas correspondientes desde albañilería

-- Paso 1: Insertar la nueva categoría
INSERT INTO price_categories (name, description, icon, display_order, is_active)
VALUES (
  'TABIQUES Y TRASDOSADOS',
  'Formación de tabiques de ladrillo y trasdosados de pladur',
  '🧱',
  3, -- Después de Derribos (1) y Albañilería (2)
  true
)
ON CONFLICT DO NOTHING;

-- Paso 2: Actualizar el display_order de las categorías existentes para hacer espacio
UPDATE price_categories
SET display_order = display_order + 1
WHERE display_order >= 3 AND name != 'TABIQUES Y TRASDOSADOS';

-- Paso 3: Obtener el ID de la nueva categoría y mover las partidas
WITH new_category AS (
  SELECT id FROM price_categories WHERE name = 'TABIQUES Y TRASDOSADOS'
),
partitions_to_move AS (
  SELECT 
    pm.id,
    pm.code,
    pm.description,
    pm.unit,
    pm.material_cost,
    pm.labor_cost,
    pm.base_price,
    pm.profit_margin,
    pm.final_price,
    pm.subcategory,
    pm.is_active
  FROM price_master pm
  WHERE pm.code IN ('02-A-02', '02-A-03') -- Tabiques de ladrillo y trasdosados
)
UPDATE price_master pm
SET category_id = (SELECT id FROM new_category)
FROM partitions_to_move ptm
WHERE pm.id = ptm.id;

-- Verificar los cambios
SELECT 
  pc.name as categoria,
  pm.code,
  pm.description,
  pm.final_price
FROM price_master pm
JOIN price_categories pc ON pm.category_id = pc.id
WHERE pm.code IN ('02-A-02', '02-A-03')
ORDER BY pm.code;
