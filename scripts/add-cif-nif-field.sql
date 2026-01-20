-- Añadir campo CIF/NIF a la tabla de configuración de empresa
ALTER TABLE public.user_company_settings
ADD COLUMN IF NOT EXISTS company_tax_id TEXT;

-- Comentario para documentar el campo
COMMENT ON COLUMN public.user_company_settings.company_tax_id IS 'CIF/NIF de la empresa';
