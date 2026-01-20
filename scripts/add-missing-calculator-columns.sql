-- Add missing columns to calculator_data table
ALTER TABLE public.calculator_data 
ADD COLUMN IF NOT EXISTS reform_config JSONB,
ADD COLUMN IF NOT EXISTS demolition_config JSONB,
ADD COLUMN IF NOT EXISTS partitions JSONB,
ADD COLUMN IF NOT EXISTS wall_linings JSONB;
