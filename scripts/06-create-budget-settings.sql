-- Crear tabla para configuración de presupuestos
CREATE TABLE IF NOT EXISTS public.budget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Datos de la empresa
  company_name TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,
  company_logo_url TEXT,
  
  -- Textos personalizables
  introduction_text TEXT DEFAULT 'Nos permitimos hacerle entrega del presupuesto solicitado.

El presupuesto presentado es en base a la estimación del proyecto ya ideado por el cliente.

El cliente puede elegir materiales de distintas calidades y precios incrementando el presupuesto en función a los mismos.',
  
  additional_notes TEXT DEFAULT 'Consideraciones Adicionales:

- El presupuesto es orientativo y puede variar según las condiciones finales de la obra.
- Los materiales especificados pueden ser sustituidos por otros de calidad similar previa consulta.
- El plazo de ejecución se determinará una vez aceptado el presupuesto.',
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: un solo registro por proyecto
  UNIQUE(project_id)
);

-- Índice para búsquedas rápidas por proyecto
CREATE INDEX IF NOT EXISTS idx_budget_settings_project_id ON public.budget_settings(project_id);

-- RLS Policies
ALTER TABLE public.budget_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver la configuración de sus propios proyectos
CREATE POLICY "Users can view their own budget settings"
  ON public.budget_settings
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Policy: Los usuarios pueden insertar configuración para sus propios proyectos
CREATE POLICY "Users can insert budget settings for their projects"
  ON public.budget_settings
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Policy: Los usuarios pueden actualizar la configuración de sus propios proyectos
CREATE POLICY "Users can update their own budget settings"
  ON public.budget_settings
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Policy: Los usuarios pueden eliminar la configuración de sus propios proyectos
CREATE POLICY "Users can delete their own budget settings"
  ON public.budget_settings
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );
