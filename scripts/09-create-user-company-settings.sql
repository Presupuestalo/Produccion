-- Crear tabla para configuración global de empresa del usuario
CREATE TABLE IF NOT EXISTS public.user_company_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Datos de la empresa
  company_name TEXT,
  company_address TEXT,
  -- Añadiendo campos de dirección completa
  company_city TEXT,
  company_province TEXT,
  company_country TEXT DEFAULT 'España',
  company_postal_code TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,
  company_logo_url TEXT,
  
  -- Textos por defecto para presupuestos
  default_presentation_text TEXT DEFAULT 'Nos permitimos hacerle entrega del presupuesto solicitado.

El presupuesto presentado es en base a la estimación del proyecto ya ideado por el cliente.

El cliente puede elegir materiales de distintas calidades y precios incrementando el presupuesto en función a los mismos.',
  
  default_clarification_notes TEXT DEFAULT 'Consideraciones Adicionales:

- El presupuesto es orientativo y puede variar según las condiciones finales de la obra.
- Los materiales especificados pueden ser sustituidos por otros de calidad similar previa consulta.
- El plazo de ejecución se determinará una vez aceptado el presupuesto.',
  
  -- Configuración de IVA
  show_vat BOOLEAN DEFAULT FALSE,
  vat_percentage NUMERIC(5,2) DEFAULT 21.00,
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_user_company_settings_user_id ON public.user_company_settings(user_id);

-- RLS Policies
ALTER TABLE public.user_company_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo pueden ver su propia configuración
CREATE POLICY "Users can view their own company settings"
  ON public.user_company_settings
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Los usuarios pueden insertar su propia configuración
CREATE POLICY "Users can insert their own company settings"
  ON public.user_company_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Los usuarios pueden actualizar su propia configuración
CREATE POLICY "Users can update their own company settings"
  ON public.user_company_settings
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Los usuarios pueden eliminar su propia configuración
CREATE POLICY "Users can delete their own company settings"
  ON public.user_company_settings
  FOR DELETE
  USING (user_id = auth.uid());
