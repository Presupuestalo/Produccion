-- Paso 1: Crear función para sincronizar email de auth.users a profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    updated_at = now();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paso 2: Crear trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Paso 3: Rellenar emails de usuarios existentes
UPDATE public.profiles p
SET 
  email = au.email,
  full_name = COALESCE(p.full_name, au.raw_user_meta_data->>'full_name', au.email),
  updated_at = now()
FROM auth.users au
WHERE p.id = au.id
AND p.email IS NULL;

-- Paso 4: Verificar que subscription_plan_id existe, si no, crearla
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'subscription_plan_id'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN subscription_plan_id UUID REFERENCES subscription_plans(id);
  END IF;
END $$;

-- Paso 5: Asignar plan gratuito a todos los usuarios que no tienen plan
UPDATE profiles
SET subscription_plan_id = (
  SELECT id FROM subscription_plans WHERE name = 'free' LIMIT 1
)
WHERE subscription_plan_id IS NULL;

-- Paso 6: Verificar resultados
SELECT 
  p.id,
  p.email,
  p.full_name,
  sp.name as plan_name,
  sp.display_name
FROM profiles p
LEFT JOIN subscription_plans sp ON p.subscription_plan_id = sp.id
ORDER BY p.created_at DESC
LIMIT 10;
