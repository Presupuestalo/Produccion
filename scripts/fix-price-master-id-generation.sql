-- Modificar la tabla price_master para que el campo id se genere automáticamente
-- Esto soluciona el error "null value in column id"

-- Primero, verificar si hay registros con id NULL y eliminarlos
DELETE FROM public.price_master WHERE id IS NULL;

-- Cambiar el tipo de id a UUID y añadir generación automática
ALTER TABLE public.price_master 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Si el campo id es TEXT en lugar de UUID, necesitamos convertirlo
-- Primero verificamos el tipo actual
DO $$ 
BEGIN
  -- Si id es TEXT, lo convertimos a UUID
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'price_master' 
    AND column_name = 'id' 
    AND data_type = 'text'
  ) THEN
    -- Crear una nueva columna temporal UUID
    ALTER TABLE public.price_master ADD COLUMN id_new UUID DEFAULT gen_random_uuid();
    
    -- Copiar los datos existentes (convertir TEXT a UUID)
    UPDATE public.price_master SET id_new = id::uuid WHERE id IS NOT NULL;
    
    -- Eliminar la columna antigua
    ALTER TABLE public.price_master DROP COLUMN id;
    
    -- Renombrar la nueva columna
    ALTER TABLE public.price_master RENAME COLUMN id_new TO id;
    
    -- Establecer como PRIMARY KEY
    ALTER TABLE public.price_master ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Asegurar que el campo id tenga DEFAULT gen_random_uuid()
ALTER TABLE public.price_master 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Verificar que todo está correcto
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'price_master' AND column_name = 'id';
