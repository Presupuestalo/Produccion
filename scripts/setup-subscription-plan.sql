-- Añadir columna subscription_plan a la tabla profiles si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN subscription_plan TEXT DEFAULT 'free' NOT NULL;
    
    -- Crear índice para mejorar el rendimiento de las consultas
    CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan 
    ON profiles(subscription_plan);
    
    RAISE NOTICE 'Columna subscription_plan añadida correctamente';
  ELSE
    RAISE NOTICE 'La columna subscription_plan ya existe';
  END IF;
END $$;

-- Verificar que todos los usuarios existentes tengan un plan asignado
UPDATE profiles 
SET subscription_plan = 'free' 
WHERE subscription_plan IS NULL;

-- Mostrar resumen
SELECT 
  subscription_plan,
  COUNT(*) as total_usuarios
FROM profiles
GROUP BY subscription_plan
ORDER BY subscription_plan;
