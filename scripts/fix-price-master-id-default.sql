-- Corregir la generación automática del ID en price_master
-- Este script asegura que el campo id se genere automáticamente como UUID

-- Habilitar la extensión uuid-ossp si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Asegurar que el campo id tenga DEFAULT gen_random_uuid()
ALTER TABLE public.price_master 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Verificar que todo está correcto
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'price_master' 
  AND column_name IN ('id', 'created_at', 'updated_at')
ORDER BY column_name;
