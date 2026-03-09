
-- 1. Asegurar que id es la Clave Primaria (Primary Key)
-- Esto permite que el editor de tablas de Supabase identifique cada fila para editarla.
ALTER TABLE public.price_master 
ADD CONSTRAINT price_master_pkey PRIMARY KEY (id);

-- 2. Asegurar que id tenga un generador de UUID por defecto
-- Esto permite insertar filas manualmente en el editor de tablas sin error de "ID nulo".
ALTER TABLE public.price_master 
ALTER COLUMN id SET DEFAULT gen_random_uuid();
