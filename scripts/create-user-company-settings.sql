-- Crear tabla para configuración de empresa del usuario
CREATE TABLE IF NOT EXISTS public.user_company_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Datos de la empresa
  company_name TEXT,
  company_address TEXT, -- Calle y número
  company_city TEXT,
  company_postal_code TEXT,
  company_province TEXT,
  company_country TEXT DEFAULT 'España',
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,
  company_logo_url TEXT, -- URL del logo almacenado en Vercel Blob
  
  -- Textos por defecto para presupuestos
  default_presentation_text TEXT DEFAULT 'Nos permitimos hacerle entrega del presupuesto solicitado.

El presupuesto presentado es en base a la estimación del proyecto ya ideado por el cliente.

El cliente puede elegir materiales de distintas calidades y precios incrementando el presupuesto en función a los mismos.

El presupuesto es de una reforma integral standard. La dirección de obra englobaría lo siguiente:

Elección de materiales:
- Coordinación con el cliente para la elección de materiales y acabados.
- Asesoramiento técnico sobre las mejores opciones según presupuesto y necesidades.

Gestión de permisos y licencias:
- Tramitación de licencias de obra necesarias.
- Coordinación con el ayuntamiento y organismos competentes.

Supervisión de obra:
- Visitas regulares a la obra para supervisar el avance y calidad.
- Resolución de imprevistos y toma de decisiones técnicas.

Coordinación de gremios:
- Organización y coordinación de todos los profesionales involucrados.
- Asegurar que cada fase se complete correctamente antes de iniciar la siguiente.

Control de calidad:
- Verificación de que todos los trabajos cumplan con los estándares de calidad.
- Inspección final antes de la entrega.',
  
  default_clarification_notes TEXT DEFAULT 'Consideraciones Adicionales:

Iluminación: Los focos están incluidos en el presupuesto inicial. Cada unidad de iluminación tiene un coste adicional de 39€ más IVA, incluyendo la instalación.

Sanitarios: El presupuesto cubre únicamente la provisión y colocación del plato de ducha y su válvula. Otros elementos del baño no están incluidos y deben ser considerados aparte.

Mobiliario: No se incluye mobiliario de ningún tipo, ya sea de cocina o armarios empotrados. Estos elementos deben ser presupuestados por separado si se desean.

Pintura: Se incluye únicamente el pintado de paredes y techos. El lacado de puertas, ventanas o cualquier otro elemento de carpintería no está incluido en este presupuesto.

Permisos: Los costes de licencias y permisos municipales no están incluidos en este presupuesto.

Imprevistos: Se recomienda considerar un margen adicional del 10-15% para posibles imprevistos que puedan surgir durante la obra.',
  
  -- Configuración de IVA
  show_vat BOOLEAN DEFAULT true,
  vat_percentage NUMERIC(5,2) DEFAULT 21.00,
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_user_company_settings_user_id 
  ON public.user_company_settings(user_id);

-- Habilitar Row Level Security
ALTER TABLE public.user_company_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo pueden ver su propia configuración
CREATE POLICY "Users can view their own company settings"
  ON public.user_company_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden insertar su propia configuración
CREATE POLICY "Users can insert their own company settings"
  ON public.user_company_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Los usuarios pueden actualizar su propia configuración
CREATE POLICY "Users can update their own company settings"
  ON public.user_company_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden eliminar su propia configuración
CREATE POLICY "Users can delete their own company settings"
  ON public.user_company_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_user_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_user_company_settings_updated_at
  BEFORE UPDATE ON public.user_company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_company_settings_updated_at();
