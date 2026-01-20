-- Añadir columna budget_snapshot para guardar snapshot completo del presupuesto
ALTER TABLE lead_requests
ADD COLUMN IF NOT EXISTS budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS budget_snapshot JSONB;

-- Índice para búsquedas en el snapshot
CREATE INDEX IF NOT EXISTS idx_lead_requests_budget_snapshot ON lead_requests USING GIN(budget_snapshot);

-- Comentario explicativo
COMMENT ON COLUMN lead_requests.budget_id IS 'Referencia al presupuesto original';
COMMENT ON COLUMN lead_requests.budget_snapshot IS 'Snapshot completo del presupuesto en formato JSON: partidas, habitaciones, materiales, ajustes, etc.';

-- Log de éxito
DO $$ 
BEGIN 
  RAISE NOTICE 'Columnas budget_id y budget_snapshot añadidas a lead_requests exitosamente';
END $$;
