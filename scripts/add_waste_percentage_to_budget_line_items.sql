-- Añadir waste_percentage a budget_line_items si no existe
ALTER TABLE public.budget_line_items
ADD COLUMN IF NOT EXISTS waste_percentage NUMERIC(5, 2) DEFAULT 0;

-- Optionally comment on column
COMMENT ON COLUMN public.budget_line_items.waste_percentage IS 'Porcentaje de desperdicio/merma aplicado a esta partida en el momento de generar el presupuesto.';
