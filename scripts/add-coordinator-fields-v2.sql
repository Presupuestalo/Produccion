-- =====================================================
-- Campos adicionales para sistema de coordinación
-- =====================================================

-- 1. Añadir campo para indicar si el presupuesto ya incluye el margen
ALTER TABLE coordinator_project_trades 
ADD COLUMN IF NOT EXISTS includes_margin BOOLEAN DEFAULT FALSE;

-- 2. Añadir campos de IVA
ALTER TABLE coordinator_project_trades 
ADD COLUMN IF NOT EXISTS includes_vat BOOLEAN DEFAULT FALSE;

ALTER TABLE coordinator_project_trades 
ADD COLUMN IF NOT EXISTS vat_percentage DECIMAL(5,2) DEFAULT 21;

-- 3. Añadir campos para calcular valores con/sin IVA
ALTER TABLE coordinator_project_trades 
ADD COLUMN IF NOT EXISTS budget_without_vat DECIMAL(10,2) DEFAULT 0;

ALTER TABLE coordinator_project_trades 
ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(10,2) DEFAULT 0;

-- 4. Añadir campo para el precio final real para el cliente (con todo incluido)
ALTER TABLE coordinator_project_trades 
ADD COLUMN IF NOT EXISTS client_price DECIMAL(10,2) DEFAULT 0;

-- 5. Actualizar función de cálculo para tener en cuenta IVA y margen incluido
CREATE OR REPLACE FUNCTION calculate_trade_final_budget()
RETURNS TRIGGER AS $$
DECLARE
  v_base_budget DECIMAL(10,2);
  v_budget_with_margin DECIMAL(10,2);
  v_budget_without_vat DECIMAL(10,2);
  v_vat_amount DECIMAL(10,2);
  v_client_price DECIMAL(10,2);
BEGIN
  -- Si el presupuesto ya incluye el margen, no aplicamos más margen
  IF NEW.includes_margin THEN
    v_budget_with_margin := NEW.original_budget;
    NEW.final_budget := NEW.original_budget;
  ELSE
    -- Calcular presupuesto con margen
    IF NEW.margin_type = 'percentage' THEN
      v_budget_with_margin := NEW.original_budget * (1 + NEW.margin_value / 100);
    ELSE
      v_budget_with_margin := NEW.original_budget + NEW.margin_value;
    END IF;
    NEW.final_budget := v_budget_with_margin;
  END IF;
  
  -- Calcular IVA
  IF NEW.includes_vat THEN
    -- El presupuesto ya incluye IVA, calculamos base
    v_budget_without_vat := NEW.final_budget / (1 + COALESCE(NEW.vat_percentage, 21) / 100);
    v_vat_amount := NEW.final_budget - v_budget_without_vat;
    v_client_price := NEW.final_budget; -- Ya incluye todo
  ELSE
    -- El presupuesto NO incluye IVA, lo añadimos
    v_budget_without_vat := NEW.final_budget;
    v_vat_amount := NEW.final_budget * (COALESCE(NEW.vat_percentage, 21) / 100);
    v_client_price := NEW.final_budget + v_vat_amount;
  END IF;
  
  NEW.budget_without_vat := v_budget_without_vat;
  NEW.vat_amount := v_vat_amount;
  NEW.client_price := v_client_price;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear trigger
DROP TRIGGER IF EXISTS trigger_calculate_final_budget ON coordinator_project_trades;
CREATE TRIGGER trigger_calculate_final_budget
  BEFORE INSERT OR UPDATE OF original_budget, margin_type, margin_value, includes_margin, includes_vat, vat_percentage
  ON coordinator_project_trades
  FOR EACH ROW
  EXECUTE FUNCTION calculate_trade_final_budget();

-- 6. Actualizar función de totales del proyecto para usar client_price
CREATE OR REPLACE FUNCTION recalculate_coordinator_project_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_total_original DECIMAL(10,2);
  v_total_with_margins DECIMAL(10,2);
  v_total_client DECIMAL(10,2);
  v_coordination_fee DECIMAL(10,2);
  v_coordination_fee_type TEXT;
  v_total_final DECIMAL(10,2);
BEGIN
  -- Calcular sumas
  SELECT 
    COALESCE(SUM(original_budget), 0),
    COALESCE(SUM(final_budget), 0),
    COALESCE(SUM(client_price), 0)
  INTO v_total_original, v_total_with_margins, v_total_client
  FROM coordinator_project_trades
  WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);
  
  -- Obtener fee de coordinación
  SELECT coordination_fee, coordination_fee_type
  INTO v_coordination_fee, v_coordination_fee_type
  FROM coordinator_projects
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  -- Calcular total final (fee sobre el total para cliente)
  IF v_coordination_fee_type = 'percentage' THEN
    v_total_final := v_total_client * (1 + COALESCE(v_coordination_fee, 0) / 100);
  ELSE
    v_total_final := v_total_client + COALESCE(v_coordination_fee, 0);
  END IF;
  
  -- Actualizar proyecto
  UPDATE coordinator_projects
  SET 
    total_original = v_total_original,
    total_with_margins = v_total_with_margins,
    total_final = v_total_final
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario explicativo
COMMENT ON COLUMN coordinator_project_trades.includes_margin IS 'Si TRUE, el presupuesto del gremio ya incluye el margen del coordinador';
COMMENT ON COLUMN coordinator_project_trades.includes_vat IS 'Si TRUE, el presupuesto incluye IVA';
COMMENT ON COLUMN coordinator_project_trades.vat_percentage IS 'Porcentaje de IVA aplicable (por defecto 21%)';
COMMENT ON COLUMN coordinator_project_trades.budget_without_vat IS 'Presupuesto base sin IVA';
COMMENT ON COLUMN coordinator_project_trades.vat_amount IS 'Cantidad de IVA';
COMMENT ON COLUMN coordinator_project_trades.client_price IS 'Precio final para el cliente (con margen e IVA)';
