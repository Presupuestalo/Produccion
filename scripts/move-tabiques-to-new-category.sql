-- Script para mover TABIQUES PLADUR DOBLE CARA y otros tabiques
-- desde ALBANILERIA a la nueva categoría TABIQUES Y TRASDOSADOS
-- 
-- IMPORTANTE: Esto NO afectará a los presupuestos existentes ni futuros
-- porque el sistema usa códigos (02-A-05) no categorías para identificar precios

-- Paso 1: Crear la nueva categoría "TABIQUES Y TRASDOSADOS" solo si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM price_categories WHERE name = 'TABIQUES Y TRASDOSADOS') THEN
    INSERT INTO price_categories (id, name, description, icon, display_order, is_active)
    VALUES (
      gen_random_uuid(),
      'TABIQUES Y TRASDOSADOS',
      'Formación de tabiques y trasdosados',
      '🧱',
      3,
      true
    );
  END IF;
END $$;

-- Paso 2: Mover los precios de tabiques desde ALBANILERIA a la nueva categoría
-- Movemos 3 precios relacionados con tabiquería:
-- - 02-A-03: FORMACIÓN DE TRASDOSADO EN PLADUR (13+45)
-- - 02-A-04: FORMACIÓN TABIQUE LADRILLO  
-- - 02-A-05: TABIQUES PLADUR DOBLE CARA (13x45x13) ← Este es el que mencionaste

UPDATE price_master
SET 
  category_id = (SELECT id FROM price_categories WHERE name = 'TABIQUES Y TRASDOSADOS'),
  updated_at = NOW()
WHERE code IN ('02-A-03', '02-A-04', '02-A-05')
  AND category_id = (SELECT id FROM price_categories WHERE name = 'ALBANILERIA');

-- Paso 3: También actualizar en user_prices (precios personalizados de usuarios)
UPDATE user_prices
SET 
  category_id = (SELECT id FROM price_categories WHERE name = 'TABIQUES Y TRASDOSADOS'),
  updated_at = NOW()
WHERE code IN ('02-A-03', '02-A-04', '02-A-05')
  AND category_id = (SELECT id FROM price_categories WHERE name = 'ALBANILERIA');

-- Paso 4: Verificar los cambios
SELECT 
  pm.code,
  pm.subcategory as concepto,
  pc.name as categoria_nueva,
  pm.description as descripcion
FROM price_master pm
LEFT JOIN price_categories pc ON pm.category_id = pc.id
WHERE pm.code IN ('02-A-03', '02-A-04', '02-A-05')
ORDER BY pm.code;
