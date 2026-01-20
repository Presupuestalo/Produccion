-- Script para arreglar la columna ID de price_master
-- Este script hace que el ID se genere automáticamente

-- Primero, verificar si la tabla existe y crear una secuencia si no existe
DO $$ 
BEGIN
  -- Crear secuencia si no existe
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'price_master_id_seq') THEN
    CREATE SEQUENCE price_master_id_seq;
  END IF;
END $$;

-- Modificar la columna id para que use la secuencia y tenga un valor por defecto
ALTER TABLE price_master 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Alternativamente, si prefieres usar una secuencia numérica en lugar de UUID:
-- ALTER TABLE price_master 
--   ALTER COLUMN id SET DEFAULT nextval('price_master_id_seq'::regclass);

-- Verificar que la columna id sea NOT NULL (debería serlo ya)
ALTER TABLE price_master 
  ALTER COLUMN id SET NOT NULL;

-- Asegurar que id sea la clave primaria
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'price_master_pkey' 
    AND conrelid = 'price_master'::regclass
  ) THEN
    ALTER TABLE price_master ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Verificar el resultado
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'price_master' 
  AND column_name = 'id';
