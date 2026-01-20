-- Ejecuta este script en el Editor SQL de Supabase
ALTER TABLE public.calculator_data 
ADD COLUMN IF NOT EXISTS electrical_config JSONB DEFAULT '{}'::jsonb;
