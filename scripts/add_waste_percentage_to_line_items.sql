-- Añadir columna waste_percentage a budget_line_items
ALTER TABLE budget_line_items ADD COLUMN IF NOT EXISTS waste_percentage DECIMAL(5,2);

-- Comentario para documentación
COMMENT ON COLUMN budget_line_items.waste_percentage IS 'Porcentaje de margen de desperdicio aplicado a esta partida';
