-- Crear una tabla de mapeo para cambios futuros de códigos
-- Esto permitirá cambiar códigos sin romper presupuestos existentes

CREATE TABLE IF NOT EXISTS price_code_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Changed price_id from UUID to TEXT to match price_master.id type
  price_id TEXT REFERENCES price_master(id) ON DELETE CASCADE,
  old_code TEXT NOT NULL,
  new_code TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id),
  reason TEXT
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_price_code_history_old_code ON price_code_history(old_code);
CREATE INDEX IF NOT EXISTS idx_price_code_history_new_code ON price_code_history(new_code);
CREATE INDEX IF NOT EXISTS idx_price_code_history_price_id ON price_code_history(price_id);

-- Función para obtener el código actual de un precio dado un código antiguo
CREATE OR REPLACE FUNCTION get_current_price_code(p_old_code TEXT)
RETURNS TEXT AS $$
DECLARE
  v_current_code TEXT;
BEGIN
  -- Buscar el código más reciente en el historial
  SELECT new_code INTO v_current_code
  FROM price_code_history
  WHERE old_code = p_old_code
  ORDER BY changed_at DESC
  LIMIT 1;
  
  -- Si no hay historial, devolver el código original
  IF v_current_code IS NULL THEN
    RETURN p_old_code;
  END IF;
  
  -- Si el nuevo código también cambió, buscar recursivamente
  IF EXISTS (SELECT 1 FROM price_code_history WHERE old_code = v_current_code) THEN
    RETURN get_current_price_code(v_current_code);
  END IF;
  
  RETURN v_current_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE price_code_history IS 'Historial de cambios de códigos de precios para mantener trazabilidad';
COMMENT ON FUNCTION get_current_price_code IS 'Obtiene el código actual de un precio dado un código histórico';
