-- Añadir columna para marcar partidas añadidas por propietarios
ALTER TABLE budget_line_items 
ADD COLUMN IF NOT EXISTS added_by_owner BOOLEAN DEFAULT FALSE;

-- Añadir índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_budget_line_items_added_by_owner 
ON budget_line_items(added_by_owner) WHERE added_by_owner = TRUE;

-- Comentario explicativo
COMMENT ON COLUMN budget_line_items.added_by_owner IS 'Indica si la partida fue añadida por el propietario (sin precio, pendiente de cotizar por profesionales)';
