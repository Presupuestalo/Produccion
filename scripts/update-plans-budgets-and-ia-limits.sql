-- Script para actualizar los límites de presupuestos y IA por plan
-- Free: 1 proyecto, 1 presupuesto, 3 usos IA/día
-- Basic: proyectos ilimitados, 3 presupuestos, 5 usos IA/día
-- Pro: proyectos ilimitados, 5 presupuestos, 10 usos IA/día (ilimitado)

-- 1. Actualizar los valores de los planes existentes
UPDATE subscription_plans
SET 
  max_projects = 1,
  max_budgets_per_project = 1,
  ai_tools_daily_limit = 3,
  max_rooms_per_project = NULL -- Habitaciones ilimitadas
WHERE id = 'free';

UPDATE subscription_plans
SET 
  max_projects = NULL, -- Ilimitado
  max_budgets_per_project = 3,
  ai_tools_daily_limit = 5,
  max_rooms_per_project = NULL -- Habitaciones ilimitadas
WHERE id = 'basic';

UPDATE subscription_plans
SET 
  max_projects = NULL, -- Ilimitado
  max_budgets_per_project = 5,
  ai_tools_daily_limit = NULL, -- Ilimitado para Pro
  max_rooms_per_project = NULL -- Habitaciones ilimitadas
WHERE id = 'pro';

-- 2. Crear tabla para trackear uso diario de herramientas IA
CREATE TABLE IF NOT EXISTS ai_usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_tool_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un registro por usuario por día
  UNIQUE(user_id, usage_date)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_ai_usage_daily_user_date ON ai_usage_daily(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_daily_date ON ai_usage_daily(usage_date);

-- Habilitar RLS
ALTER TABLE ai_usage_daily ENABLE ROW LEVEL SECURITY;

-- Política: usuarios pueden ver su propio uso
DROP POLICY IF EXISTS "Users can view own ai usage" ON ai_usage_daily;
CREATE POLICY "Users can view own ai usage"
ON ai_usage_daily FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política: usuarios pueden insertar su propio uso
DROP POLICY IF EXISTS "Users can insert own ai usage" ON ai_usage_daily;
CREATE POLICY "Users can insert own ai usage"
ON ai_usage_daily FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política: usuarios pueden actualizar su propio uso
DROP POLICY IF EXISTS "Users can update own ai usage" ON ai_usage_daily;
CREATE POLICY "Users can update own ai usage"
ON ai_usage_daily FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Función para incrementar el uso de IA y verificar límites
CREATE OR REPLACE FUNCTION increment_ai_usage(p_user_id UUID, p_tool_name TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_daily_limit INTEGER;
  v_current_usage INTEGER;
  v_plan_name TEXT;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Obtener el plan del usuario y su límite diario
  SELECT sp.ai_tools_daily_limit, sp.name
  INTO v_daily_limit, v_plan_name
  FROM profiles p
  LEFT JOIN subscription_plans sp ON sp.id = p.subscription_plan
  WHERE p.id = p_user_id;

  -- Si el límite es NULL, es ilimitado
  IF v_daily_limit IS NULL THEN
    -- Insertar o actualizar el registro de uso (solo para tracking)
    INSERT INTO ai_usage_daily (user_id, usage_date, usage_count, last_tool_used)
    VALUES (p_user_id, v_today, 1, p_tool_name)
    ON CONFLICT (user_id, usage_date) 
    DO UPDATE SET 
      usage_count = ai_usage_daily.usage_count + 1,
      last_tool_used = COALESCE(p_tool_name, ai_usage_daily.last_tool_used),
      updated_at = NOW();
    
    RETURN json_build_object(
      'allowed', true,
      'unlimited', true,
      'plan', v_plan_name
    );
  END IF;

  -- Obtener uso actual del día
  SELECT COALESCE(usage_count, 0) INTO v_current_usage
  FROM ai_usage_daily
  WHERE user_id = p_user_id AND usage_date = v_today;

  IF v_current_usage IS NULL THEN
    v_current_usage := 0;
  END IF;

  -- Verificar si se excede el límite
  IF v_current_usage >= v_daily_limit THEN
    RETURN json_build_object(
      'allowed', false,
      'current_usage', v_current_usage,
      'daily_limit', v_daily_limit,
      'plan', v_plan_name,
      'message', 'Has alcanzado el límite diario de herramientas IA de tu plan'
    );
  END IF;

  -- Incrementar el uso
  INSERT INTO ai_usage_daily (user_id, usage_date, usage_count, last_tool_used)
  VALUES (p_user_id, v_today, 1, p_tool_name)
  ON CONFLICT (user_id, usage_date) 
  DO UPDATE SET 
    usage_count = ai_usage_daily.usage_count + 1,
    last_tool_used = COALESCE(p_tool_name, ai_usage_daily.last_tool_used),
    updated_at = NOW();

  RETURN json_build_object(
    'allowed', true,
    'current_usage', v_current_usage + 1,
    'daily_limit', v_daily_limit,
    'remaining', v_daily_limit - v_current_usage - 1,
    'plan', v_plan_name
  );
END;
$$;

-- 4. Función para obtener el uso diario actual
CREATE OR REPLACE FUNCTION get_ai_daily_usage(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_daily_limit INTEGER;
  v_current_usage INTEGER;
  v_plan_name TEXT;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Obtener el plan del usuario y su límite diario
  SELECT sp.ai_tools_daily_limit, sp.name
  INTO v_daily_limit, v_plan_name
  FROM profiles p
  LEFT JOIN subscription_plans sp ON sp.id = p.subscription_plan
  WHERE p.id = p_user_id;

  -- Obtener uso actual del día
  SELECT COALESCE(usage_count, 0) INTO v_current_usage
  FROM ai_usage_daily
  WHERE user_id = p_user_id AND usage_date = v_today;

  IF v_current_usage IS NULL THEN
    v_current_usage := 0;
  END IF;

  RETURN json_build_object(
    'current_usage', v_current_usage,
    'daily_limit', v_daily_limit,
    'unlimited', v_daily_limit IS NULL,
    'remaining', CASE WHEN v_daily_limit IS NULL THEN NULL ELSE v_daily_limit - v_current_usage END,
    'plan', v_plan_name
  );
END;
$$;

-- 5. Verificar los cambios
SELECT id, name, display_name, max_projects, max_budgets_per_project, ai_tools_daily_limit
FROM subscription_plans
ORDER BY sort_order;

-- Comentarios
COMMENT ON TABLE ai_usage_daily IS 'Trackeo de uso diario de herramientas IA por usuario';
COMMENT ON FUNCTION increment_ai_usage IS 'Incrementa el contador de uso de IA y verifica límites del plan';
COMMENT ON FUNCTION get_ai_daily_usage IS 'Obtiene el uso actual de IA del día para un usuario';
