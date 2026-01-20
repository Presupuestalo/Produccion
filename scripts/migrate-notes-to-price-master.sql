-- Migrar notas únicas de budget_line_items a price_master
-- Este script toma las notas que existen en budget_line_items y las asigna a price_master

-- Paso 1: Actualizar notas en price_master basándose en el code
UPDATE price_master pm
SET notes = bli.notes
FROM (
  -- Corregida la sintaxis del DISTINCT ON especificando el alias de tabla
  SELECT DISTINCT ON (bli.code) bli.code, bli.notes
  FROM budget_line_items bli
  WHERE bli.notes IS NOT NULL 
    AND bli.notes != ''
    AND bli.code IS NOT NULL
  ORDER BY bli.code, bli.created_at DESC
) bli
WHERE pm.code = bli.code
  AND (pm.notes IS NULL OR pm.notes = '');

-- Paso 2: Para los que tienen base_price_id (referencia directa)
UPDATE price_master pm
SET notes = bli.notes
FROM (
  -- Corregida la sintaxis del DISTINCT ON especificando el alias de tabla
  SELECT DISTINCT ON (bli.base_price_id) bli.base_price_id, bli.notes
  FROM budget_line_items bli
  WHERE bli.notes IS NOT NULL 
    AND bli.notes != ''
    AND bli.base_price_id IS NOT NULL
  ORDER BY bli.base_price_id, bli.created_at DESC
) bli
WHERE pm.id = bli.base_price_id
  AND (pm.notes IS NULL OR pm.notes = '');

-- Paso 3: Verificar resultados
SELECT 
  COUNT(*) FILTER (WHERE notes IS NOT NULL AND notes != '') as precios_con_notas,
  COUNT(*) as total_precios
FROM price_master;
