-- Añadir columnas de detalles de producto a budget_line_items
-- Estas columnas guardan el snapshot de color, marca y modelo al crear el presupuesto

ALTER TABLE budget_line_items 
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS model TEXT;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Columnas color, brand y model añadidas a budget_line_items';
END $$;
