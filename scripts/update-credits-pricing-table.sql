-- Actualizar función de cálculo de créditos según nueva tabla de precios
-- Incluye soporte para planes: FREE, BASIC (-15%), PRO (-30%), BUSINESS (~50%)

CREATE OR REPLACE FUNCTION calculate_lead_credits_cost(budget DECIMAL, plan_type TEXT DEFAULT 'FREE')
RETURNS INTEGER AS $$
DECLARE
  base_credits INTEGER;
  discount_multiplier DECIMAL;
BEGIN
  -- Determinar créditos base según presupuesto
  IF budget < 1000 THEN
    base_credits := 50;  -- Micro
  ELSIF budget < 5000 THEN
    base_credits := 150; -- Pequeña
  ELSIF budget < 20000 THEN
    base_credits := 350; -- Media
  ELSIF budget < 50000 THEN
    base_credits := 650; -- Grande
  ELSE
    base_credits := 990; -- Premium
  END IF;
  
  -- Aplicar descuento según plan
  CASE plan_type
    WHEN 'BASIC' THEN
      discount_multiplier := 0.85; -- -15%
    WHEN 'PRO' THEN
      discount_multiplier := 0.70; -- -30%
    WHEN 'BUSINESS' THEN
      discount_multiplier := 0.50; -- -50%
    ELSE -- FREE
      discount_multiplier := 1.0;
  END CASE;
  
  RETURN ROUND(base_credits * discount_multiplier);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Añadir columna de plan a profiles si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'subscription_plan') THEN
    ALTER TABLE profiles ADD COLUMN subscription_plan TEXT DEFAULT 'FREE' 
      CHECK (subscription_plan IN ('FREE', 'BASIC', 'PRO', 'BUSINESS'));
  END IF;
END $$;

-- Verificación
SELECT 
  calculate_lead_credits_cost(500, 'FREE') as micro_free,
  calculate_lead_credits_cost(500, 'BUSINESS') as micro_business,
  calculate_lead_credits_cost(3000, 'FREE') as pequena_free,
  calculate_lead_credits_cost(13000, 'FREE') as media_free,
  calculate_lead_credits_cost(35000, 'FREE') as grande_free,
  calculate_lead_credits_cost(60000, 'FREE') as premium_free;
