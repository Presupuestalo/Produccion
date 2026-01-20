-- =====================================================
-- Añadir columnas faltantes a coordinator_project_trades
-- =====================================================

-- 1. Primero eliminar triggers existentes que pueden causar conflictos
DROP TRIGGER IF EXISTS trigger_calculate_final_budget ON coordinator_project_trades;
DROP FUNCTION IF EXISTS calculate_trade_final_budget() CASCADE;

-- 2. Añadir columnas que faltan
ALTER TABLE coordinator_project_trades 
ADD COLUMN IF NOT EXISTS includes_margin BOOLEAN DEFAULT FALSE;

ALTER TABLE coordinator_project_trades 
ADD COLUMN IF NOT EXISTS margin_percentage_included DECIMAL(5,2) DEFAULT 0;

ALTER TABLE coordinator_project_trades 
ADD COLUMN IF NOT EXISTS client_price DECIMAL(10,2) DEFAULT 0;

-- 3. Recrear función de cálculo simplificada (sin IVA)
CREATE OR REPLACE FUNCTION calculate_trade_final_budget()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el margen ya está incluido en el presupuesto, client_price = original_budget
  IF NEW.includes_margin = TRUE THEN
    NEW.client_price := NEW.original_budget;
    NEW.final_budget := NEW.original_budget;
  ELSE
    -- Si no está incluido, calcular según tipo de margen
    IF NEW.margin_type = 'percentage' THEN
      NEW.final_budget := NEW.original_budget * (1 + COALESCE(NEW.margin_value, 0) / 100);
    ELSE
      NEW.final_budget := NEW.original_budget + COALESCE(NEW.margin_value, 0);
    END IF;
    NEW.client_price := NEW.final_budget;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recrear trigger
CREATE TRIGGER trigger_calculate_final_budget
  BEFORE INSERT OR UPDATE OF original_budget, margin_type, margin_value, includes_margin, margin_percentage_included 
  ON coordinator_project_trades
  FOR EACH ROW
  EXECUTE FUNCTION calculate_trade_final_budget();

-- 5. Actualizar registros existentes para recalcular valores
UPDATE coordinator_project_trades 
SET client_price = CASE 
  WHEN includes_margin = TRUE THEN original_budget
  WHEN margin_type = 'percentage' THEN original_budget * (1 + COALESCE(margin_value, 0) / 100)
  ELSE original_budget + COALESCE(margin_value, 0)
END,
final_budget = CASE 
  WHEN includes_margin = TRUE THEN original_budget
  WHEN margin_type = 'percentage' THEN original_budget * (1 + COALESCE(margin_value, 0) / 100)
  ELSE original_budget + COALESCE(margin_value, 0)
END;
