-- Primero eliminar el trigger y función que dependen de las columnas de IVA
DROP TRIGGER IF EXISTS trigger_calculate_final_budget ON coordinator_project_trades;
DROP FUNCTION IF EXISTS calculate_final_budget();

-- Añadir columna margin_percentage_included si no existe
ALTER TABLE coordinator_project_trades 
ADD COLUMN IF NOT EXISTS margin_percentage_included NUMERIC(5,2) DEFAULT 0;

-- Añadir comentario a la columna
COMMENT ON COLUMN coordinator_project_trades.margin_percentage_included IS 'Porcentaje de margen que ya está incluido en el presupuesto del gremio';

-- Ahora podemos eliminar las columnas de IVA de forma segura
ALTER TABLE coordinator_project_trades 
DROP COLUMN IF EXISTS includes_vat,
DROP COLUMN IF EXISTS vat_percentage,
DROP COLUMN IF EXISTS budget_without_vat,
DROP COLUMN IF EXISTS vat_amount,
DROP COLUMN IF EXISTS client_price;

-- Actualizar registros existentes para que margin_percentage_included tenga valor 0 si es null
UPDATE coordinator_project_trades 
SET margin_percentage_included = 0 
WHERE margin_percentage_included IS NULL;

-- Recrear la función de cálculo SIN IVA (simplificada)
CREATE OR REPLACE FUNCTION calculate_final_budget()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el margen ya está incluido, el final_budget = original_budget
  -- Si no, calculamos el margen y lo sumamos
  IF NEW.includes_margin = true THEN
    NEW.final_budget := NEW.original_budget;
  ELSE
    IF NEW.margin_type = 'percentage' THEN
      NEW.final_budget := NEW.original_budget * (1 + COALESCE(NEW.margin_value, 0) / 100);
    ELSE
      NEW.final_budget := NEW.original_budget + COALESCE(NEW.margin_value, 0);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
CREATE TRIGGER trigger_calculate_final_budget
  BEFORE INSERT OR UPDATE ON coordinator_project_trades
  FOR EACH ROW
  EXECUTE FUNCTION calculate_final_budget();
