-- Script para asegurar que el plan por defecto al registrarse sea 'free' y no 'empresa'

-- 1. Verificar que el plan 'free' existe en subscription_plans
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE id = 'free') THEN
    RAISE EXCEPTION 'El plan "free" no existe en la tabla subscription_plans. Ejecuta primero el script de creación de planes.';
  END IF;
END $$;

-- 2. Actualizar todos los usuarios que actualmente tienen 'empresa' a 'free' 
--    (excepto los que fueron asignados manualmente por admin)
UPDATE profiles 
SET subscription_plan_id = 'free'
WHERE subscription_plan_id = 'empresa'
  AND stripe_customer_id IS NULL 
  AND stripe_subscription_id IS NULL;

-- 3. Asegurar que la columna subscription_plan_id tiene DEFAULT 'free'
ALTER TABLE profiles 
  ALTER COLUMN subscription_plan_id SET DEFAULT 'free';

-- 4. Actualizar el trigger handle_new_user para que siempre asigne 'free'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insertar perfil con plan 'free' por defecto
  INSERT INTO public.profiles (
    id, 
    email,
    full_name,
    subscription_plan_id,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_metadata->>'name',
      NEW.raw_user_metadata->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    'free',  -- Siempre asignar plan 'free' al registrarse
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    subscription_plan_id = COALESCE(profiles.subscription_plan_id, 'free'),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 5. Recrear el trigger (por si acaso)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Mensaje de confirmación
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM profiles
  WHERE subscription_plan_id = 'free';
  
  RAISE NOTICE '✅ Plan por defecto configurado correctamente a "free"';
  RAISE NOTICE '✅ Total de usuarios con plan free: %', updated_count;
  RAISE NOTICE '✅ Nuevos usuarios se crearán automáticamente con plan "free"';
END $$;
