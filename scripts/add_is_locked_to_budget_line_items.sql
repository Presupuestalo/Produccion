-- Añadir columna is_locked a budget_line_items para proteger partidas editadas manualmente
ALTER TABLE budget_line_items ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

-- Opcional: indexar la columna si se harán muchas búsquedas o filtrados por ella
CREATE INDEX IF NOT EXISTS idx_budget_line_items_is_locked ON budget_line_items(budget_id, is_locked);
