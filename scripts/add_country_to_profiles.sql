-- Añadir columna country a la tabla profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- Crear índice para mejorar el rendimiento de las consultas por país
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);

-- Mostrar confirmación
SELECT 'Columna country añadida a profiles' as status;
