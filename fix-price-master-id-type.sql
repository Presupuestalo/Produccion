-- Arreglar el tipo de la columna ID en price_master
-- Este script convierte la columna id de text a uuid y asegura que funcione correctamente

-- Paso 1: Eliminar el default actual
ALTER TABLE public.price_master 
ALTER COLUMN id DROP DEFAULT;

-- Paso 2: Convertir la columna a tipo uuid
-- Si hay datos existentes, primero los convertimos
ALTER TABLE public.price_master 
ALTER COLUMN id TYPE uuid USING id::uuid;

-- Paso 3: Establecer el default correcto para generar UUIDs automáticamente
ALTER TABLE public.price_master 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Paso 4: Asegurar que la columna no permita nulos
ALTER TABLE public.price_master 
ALTER COLUMN id SET NOT NULL;

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
