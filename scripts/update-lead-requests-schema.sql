-- Actualizar esquema de lead_requests para soportar el nuevo flujo

-- 1. Agregar budget_id y budget_snapshot
ALTER TABLE lead_requests
ADD COLUMN IF NOT EXISTS budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS budget_snapshot JSONB;

-- 2. Agregar reform_address (dirección completa de la reforma)
ALTER TABLE lead_requests
ADD COLUMN IF NOT EXISTS reform_address TEXT;

-- 3. Hacer postal_code opcional (ya que ahora usamos solo provincia)
ALTER TABLE lead_requests
ALTER COLUMN postal_code DROP NOT NULL;

-- 4. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_lead_requests_budget_id ON lead_requests(budget_id);
CREATE INDEX IF NOT EXISTS idx_lead_requests_budget_snapshot ON lead_requests USING GIN(budget_snapshot);
CREATE INDEX IF NOT EXISTS idx_lead_requests_province ON lead_requests(province);

-- 5. Comentarios explicativos
COMMENT ON COLUMN lead_requests.budget_id IS 'Referencia al presupuesto original';
COMMENT ON COLUMN lead_requests.budget_snapshot IS 'Snapshot completo del presupuesto en formato JSON: partidas, habitaciones, materiales, ajustes, etc.';
COMMENT ON COLUMN lead_requests.reform_address IS 'Dirección completa de la reforma (calle y número)';

-- Log de éxito
DO $$ 
BEGIN 
  RAISE NOTICE 'Schema de lead_requests actualizado exitosamente';
END $$;
