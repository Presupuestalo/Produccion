-- Crear tabla para precios personalizados de usuarios
-- Esta tabla almacena precios modificados o importados por cada usuario
-- La tabla maestra (price_master) solo contiene precios base

CREATE TABLE IF NOT EXISTS public.user_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Referencia al precio base (si es una modificación de un precio maestro)
  base_price_id TEXT NULL,
  
  -- Información del precio
  code TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES public.price_categories(id),
  subcategory TEXT,
  description TEXT NOT NULL,
  long_description TEXT,
  unit TEXT NOT NULL DEFAULT 'm²',
  
  -- Costes desglosados
  labor_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  material_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  equipment_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  other_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Precios calculados
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  margin_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  final_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Metadatos
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_imported BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  
  -- Información adicional
  color TEXT,
  brand TEXT,
  model TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_user_prices_user ON public.user_prices(user_id);
CREATE INDEX idx_user_prices_category ON public.user_prices(category_id);
CREATE INDEX idx_user_prices_code ON public.user_prices(code);
CREATE INDEX idx_user_prices_base ON public.user_prices(base_price_id);
CREATE INDEX idx_user_prices_active ON public.user_prices(is_active);

-- Habilitar RLS
ALTER TABLE public.user_prices ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Los usuarios solo pueden ver y modificar sus propios precios
CREATE POLICY "Usuarios pueden ver sus precios"
ON public.user_prices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus precios"
ON public.user_prices FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus precios"
ON public.user_prices FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus precios"
ON public.user_prices FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_user_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_prices_updated_at
BEFORE UPDATE ON public.user_prices
FOR EACH ROW
EXECUTE FUNCTION update_user_prices_updated_at();

-- Crear tablas para otros países (copiar la misma estructura)
-- Perú
CREATE TABLE IF NOT EXISTS public.user_prices_peru (LIKE public.user_prices INCLUDING ALL);
ALTER TABLE public.user_prices_peru ENABLE ROW LEVEL SECURITY;

-- Bolivia
CREATE TABLE IF NOT EXISTS public.user_prices_bolivia (LIKE public.user_prices INCLUDING ALL);
ALTER TABLE public.user_prices_bolivia ENABLE ROW LEVEL SECURITY;

-- México
CREATE TABLE IF NOT EXISTS public.user_prices_mexico (LIKE public.user_prices INCLUDING ALL);
ALTER TABLE public.user_prices_mexico ENABLE ROW LEVEL SECURITY;

-- Colombia
CREATE TABLE IF NOT EXISTS public.user_prices_colombia (LIKE public.user_prices INCLUDING ALL);
ALTER TABLE public.user_prices_colombia ENABLE ROW LEVEL SECURITY;

-- Argentina
CREATE TABLE IF NOT EXISTS public.user_prices_argentina (LIKE public.user_prices INCLUDING ALL);
ALTER TABLE public.user_prices_argentina ENABLE ROW LEVEL SECURITY;

-- Chile
CREATE TABLE IF NOT EXISTS public.user_prices_chile (LIKE public.user_prices INCLUDING ALL);
ALTER TABLE public.user_prices_chile ENABLE ROW LEVEL SECURITY;

-- Ecuador
CREATE TABLE IF NOT EXISTS public.user_prices_ecuador (LIKE public.user_prices INCLUDING ALL);
ALTER TABLE public.user_prices_ecuador ENABLE ROW LEVEL SECURITY;

-- Venezuela
CREATE TABLE IF NOT EXISTS public.user_prices_venezuela (LIKE public.user_prices INCLUDING ALL);
ALTER TABLE public.user_prices_venezuela ENABLE ROW LEVEL SECURITY;

-- Aplicar las mismas políticas RLS a todas las tablas de países
DO $$
DECLARE
  country_table TEXT;
BEGIN
  FOR country_table IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE 'user_prices_%'
  LOOP
    EXECUTE format('
      CREATE POLICY "Usuarios pueden ver sus precios"
      ON public.%I FOR SELECT
      USING (auth.uid() = user_id);
      
      CREATE POLICY "Usuarios pueden crear sus precios"
      ON public.%I FOR INSERT
      WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Usuarios pueden actualizar sus precios"
      ON public.%I FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Usuarios pueden eliminar sus precios"
      ON public.%I FOR DELETE
      USING (auth.uid() = user_id);
    ', country_table, country_table, country_table, country_table);
  END LOOP;
END $$;
