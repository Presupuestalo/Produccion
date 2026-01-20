-- Tabla para configuración de presupuestos por proyecto
CREATE TABLE IF NOT EXISTS budget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Datos de la empresa
  company_name TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,
  company_logo_url TEXT,
  
  -- Texto de presentación (antes del presupuesto)
  introduction_text TEXT DEFAULT 'Nos permitimos hacerle entrega del presupuesto solicitado.

El presupuesto presentado es en base a la estimación del proyecto ya ideado por el cliente.

El cliente puede elegir materiales de distintas calidades y precios incrementando el presupuesto en función a los mismos.',
  
  -- Notas aclaratorias (al final del presupuesto)
  additional_notes TEXT DEFAULT '**Consideraciones Adicionales:**

**Iluminación:** Los focos no están incluidos en el presupuesto inicial. Cada unidad de iluminación tiene un costo adicional.

**Sanitarios:** El presupuesto cubre únicamente la provisión y colocación básica. Otros elementos deben ser considerados aparte.

**Mobiliario:** No se incluye mobiliario de ningún tipo. Estos serán planificados y presupuestados a petición del cliente tras la aceptación del presupuesto de reforma.',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un proyecto solo puede tener una configuración
  UNIQUE(project_id)
);

-- Índice para búsquedas rápidas por proyecto
CREATE INDEX IF NOT EXISTS idx_budget_settings_project ON budget_settings(project_id);

-- RLS policies
ALTER TABLE budget_settings ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver y editar la configuración de sus propios proyectos
CREATE POLICY "Users can view budget settings for their projects"
  ON budget_settings FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert budget settings for their projects"
  ON budget_settings FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update budget settings for their projects"
  ON budget_settings FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete budget settings for their projects"
  ON budget_settings FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
