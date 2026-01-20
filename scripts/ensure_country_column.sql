-- Asegurar que la columna country existe en profiles y actualizar el usuario master
DO $$
BEGIN
  -- Añadir columna country si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'country'
  ) THEN
    ALTER TABLE profiles ADD COLUMN country TEXT DEFAULT 'ES';
    RAISE NOTICE 'Columna country añadida a profiles';
  ELSE
    RAISE NOTICE 'Columna country ya existe en profiles';
  END IF;

  -- Crear índice si no existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'profiles' AND indexname = 'idx_profiles_country'
  ) THEN
    CREATE INDEX idx_profiles_country ON profiles(country);
    RAISE NOTICE 'Índice idx_profiles_country creado';
  END IF;

  -- Actualizar el usuario master para asegurar que tiene país ES por defecto
  UPDATE profiles 
  SET country = 'ES' 
  WHERE country IS NULL OR country = '';
  
  RAISE NOTICE 'Perfiles actualizados con país por defecto';
END $$;

-- Mostrar estado
SELECT 
  'Columna country configurada correctamente' as status,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN country IS NOT NULL THEN 1 END) as profiles_with_country
FROM profiles;
