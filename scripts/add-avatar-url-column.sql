-- Añadir columna avatar_url a la tabla profiles y actualizar con datos de Google OAuth

-- Paso 1: Añadir la columna avatar_url si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Paso 2: Actualizar el trigger para capturar avatar_url de Google OAuth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    -- Primero intenta 'name', luego 'full_name', por último usa la parte del email
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    -- Captura la foto de perfil de Google OAuth
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Paso 3: Actualizar perfiles existentes con la foto de Google OAuth si está disponible
UPDATE profiles p
SET avatar_url = (
  SELECT au.raw_user_meta_data->>'avatar_url'
  FROM auth.users au
  WHERE au.id = p.id
)
WHERE EXISTS (
  SELECT 1
  FROM auth.users au
  WHERE au.id = p.id
  AND au.raw_user_meta_data->>'avatar_url' IS NOT NULL
  AND au.raw_user_meta_data->>'avatar_url' != ''
)
AND (p.avatar_url IS NULL OR p.avatar_url = '');

-- Verificación: Mostrar cuántos perfiles se actualizaron
SELECT 
  COUNT(*) FILTER (WHERE avatar_url IS NOT NULL AND avatar_url != '') as perfiles_con_avatar,
  COUNT(*) FILTER (WHERE avatar_url IS NULL OR avatar_url = '') as perfiles_sin_avatar,
  COUNT(*) as total
FROM profiles;
