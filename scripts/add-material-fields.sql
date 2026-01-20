-- Script para añadir campos de color, marca y modelo a la tabla price_master
-- Estos campos permitirán especificar detalles de los materiales

-- Añadir columnas para color, marca y modelo
ALTER TABLE public.price_master 
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS model TEXT;

-- Crear índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_price_master_color ON public.price_master(color);
CREATE INDEX IF NOT EXISTS idx_price_master_brand ON public.price_master(brand);
CREATE INDEX IF NOT EXISTS idx_price_master_model ON public.price_master(model);

-- Comentarios para documentar las columnas
COMMENT ON COLUMN public.price_master.color IS 'Color del material (ej: Blanco, Negro, Gris)';
COMMENT ON COLUMN public.price_master.brand IS 'Marca del material (ej: Roca, Grohe, Leroy Merlin)';
COMMENT ON COLUMN public.price_master.model IS 'Modelo específico del material';
