-- =====================================================
-- Sistema de Coordinador de Gremios
-- =====================================================
-- Este sistema permite a profesionales/empresas actuar como
-- coordinadores de reformas, gestionando múltiples gremios,
-- aplicando márgenes y generando presupuestos consolidados.
-- =====================================================

-- 1. Añadir campo is_coordinator a profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_coordinator BOOLEAN DEFAULT FALSE;

-- 2. Añadir campo work_mode para indicar modo de trabajo
-- 'executor' = ejecuta trabajos directamente
-- 'coordinator' = coordina proyectos con otros profesionales  
-- 'both' = ambos
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS work_mode TEXT DEFAULT 'executor' 
CHECK (work_mode IN ('executor', 'coordinator', 'both'));

-- 3. Tabla de proyectos de coordinación
CREATE TABLE IF NOT EXISTS coordinator_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Datos del cliente
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  
  -- Datos del proyecto
  project_name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  
  -- Financiero
  coordination_fee DECIMAL(10,2) DEFAULT 0, -- Fee de coordinación/gestión
  coordination_fee_type TEXT DEFAULT 'fixed' CHECK (coordination_fee_type IN ('fixed', 'percentage')),
  total_original DECIMAL(10,2) DEFAULT 0, -- Suma presupuestos gremios
  total_with_margins DECIMAL(10,2) DEFAULT 0, -- Con márgenes aplicados
  total_final DECIMAL(10,2) DEFAULT 0, -- Total final con fee coordinación
  
  -- Estado
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',        -- Borrador
    'quoting',      -- Recopilando presupuestos
    'quoted',       -- Presupuesto presentado al cliente
    'accepted',     -- Cliente ha aceptado
    'in_progress',  -- En ejecución
    'completed',    -- Finalizado
    'cancelled'     -- Cancelado
  )),
  
  -- Fechas
  quoted_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Notas internas
  internal_notes TEXT
);

-- 4. Tipos de gremios/oficios
CREATE TABLE IF NOT EXISTS trade_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- nombre del icono (lucide)
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Insertar gremios comunes
INSERT INTO trade_types (name, description, icon, sort_order) VALUES
  ('Albañilería', 'Obra civil, tabiques, enlucidos', 'brick-wall', 1),
  ('Electricidad', 'Instalaciones eléctricas', 'zap', 2),
  ('Fontanería', 'Instalaciones de agua y saneamiento', 'droplet', 3),
  ('Carpintería', 'Puertas, ventanas, muebles a medida', 'hammer', 4),
  ('Pintura', 'Pintura interior y exterior', 'paintbrush', 5),
  ('Climatización', 'Aire acondicionado, calefacción', 'thermometer', 6),
  ('Cristalería', 'Cristales, mamparas, espejos', 'square', 7),
  ('Cerrajería', 'Cerraduras, puertas metálicas', 'key', 8),
  ('Escayola/Pladur', 'Techos, molduras, tabiques', 'layers', 9),
  ('Suelos', 'Parquet, tarima, baldosas', 'grid-3x3', 10),
  ('Cocinas', 'Mobiliario y equipamiento de cocina', 'chef-hat', 11),
  ('Baños', 'Sanitarios, griferías, mobiliario', 'bath', 12),
  ('Domótica', 'Automatización del hogar', 'home', 13),
  ('Decoración', 'Interiorismo, mobiliario', 'palette', 14),
  ('Otros', 'Otros oficios', 'more-horizontal', 99)
ON CONFLICT (name) DO NOTHING;

-- 5. Gremios/proveedores en cada proyecto
CREATE TABLE IF NOT EXISTS coordinator_project_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES coordinator_projects(id) ON DELETE CASCADE,
  
  -- Tipo de gremio
  trade_type_id UUID REFERENCES trade_types(id),
  trade_name TEXT, -- Nombre personalizado si no está en la lista
  
  -- Proveedor (puede ser de la plataforma o externo)
  supplier_id UUID REFERENCES profiles(id), -- Si está en Presupuéstalo
  supplier_name TEXT NOT NULL, -- Nombre del gremio/empresa
  supplier_phone TEXT,
  supplier_email TEXT,
  supplier_cif TEXT,
  
  -- Presupuesto
  original_budget DECIMAL(10,2) DEFAULT 0, -- Presupuesto que da el gremio
  margin_type TEXT DEFAULT 'percentage' CHECK (margin_type IN ('percentage', 'fixed')),
  margin_value DECIMAL(10,2) DEFAULT 0, -- % o cantidad fija
  final_budget DECIMAL(10,2) DEFAULT 0, -- Con margen aplicado
  
  -- Archivos
  budget_pdf_url TEXT, -- URL del presupuesto PDF subido
  
  -- Estado
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Esperando presupuesto
    'received',   -- Presupuesto recibido
    'approved',   -- Aprobado por coordinador
    'rejected'    -- Rechazado
  )),
  
  -- Notas
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Red de gremios de confianza del coordinador
CREATE TABLE IF NOT EXISTS coordinator_trusted_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Proveedor
  supplier_id UUID REFERENCES profiles(id), -- Si está en la plataforma
  supplier_name TEXT NOT NULL,
  supplier_phone TEXT,
  supplier_email TEXT,
  supplier_cif TEXT,
  
  -- Clasificación
  trade_type_id UUID REFERENCES trade_types(id),
  trade_name TEXT,
  
  -- Valoración interna
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  
  -- Estadísticas
  projects_together INTEGER DEFAULT 0,
  last_project_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usar índice único funcional en lugar de UNIQUE constraint con COALESCE
CREATE UNIQUE INDEX IF NOT EXISTS idx_coordinator_trusted_suppliers_unique 
  ON coordinator_trusted_suppliers(coordinator_id, supplier_name, COALESCE(trade_name, ''));

-- 7. Modificados de obra
CREATE TABLE IF NOT EXISTS coordinator_project_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_trade_id UUID NOT NULL REFERENCES coordinator_project_trades(id) ON DELETE CASCADE,
  
  description TEXT NOT NULL,
  amount_original DECIMAL(10,2) DEFAULT 0, -- Cambio en presupuesto original
  amount_with_margin DECIMAL(10,2) DEFAULT 0, -- Cambio con margen aplicado
  
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',   -- Pendiente de aprobar
    'approved',  -- Aprobado
    'rejected'   -- Rechazado
  )),
  
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Índices para rendimiento
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_coordinator_projects_coordinator 
  ON coordinator_projects(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_coordinator_projects_status 
  ON coordinator_projects(status);
CREATE INDEX IF NOT EXISTS idx_coordinator_project_trades_project 
  ON coordinator_project_trades(project_id);
CREATE INDEX IF NOT EXISTS idx_coordinator_trusted_suppliers_coordinator 
  ON coordinator_trusted_suppliers(coordinator_id);

-- =====================================================
-- Políticas RLS
-- =====================================================

ALTER TABLE coordinator_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinator_project_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinator_trusted_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinator_project_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_types ENABLE ROW LEVEL SECURITY;

-- Trade types: todos pueden leer
CREATE POLICY "trade_types_select_all" ON trade_types 
  FOR SELECT USING (true);

-- Coordinator projects: solo el coordinador puede ver/editar sus proyectos
CREATE POLICY "coordinator_projects_select" ON coordinator_projects 
  FOR SELECT USING (coordinator_id = auth.uid());

CREATE POLICY "coordinator_projects_insert" ON coordinator_projects 
  FOR INSERT WITH CHECK (coordinator_id = auth.uid());

CREATE POLICY "coordinator_projects_update" ON coordinator_projects 
  FOR UPDATE USING (coordinator_id = auth.uid());

CREATE POLICY "coordinator_projects_delete" ON coordinator_projects 
  FOR DELETE USING (coordinator_id = auth.uid());

-- Project trades: acceso a través del proyecto
CREATE POLICY "coordinator_project_trades_select" ON coordinator_project_trades 
  FOR SELECT USING (
    project_id IN (SELECT id FROM coordinator_projects WHERE coordinator_id = auth.uid())
  );

CREATE POLICY "coordinator_project_trades_insert" ON coordinator_project_trades 
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM coordinator_projects WHERE coordinator_id = auth.uid())
  );

CREATE POLICY "coordinator_project_trades_update" ON coordinator_project_trades 
  FOR UPDATE USING (
    project_id IN (SELECT id FROM coordinator_projects WHERE coordinator_id = auth.uid())
  );

CREATE POLICY "coordinator_project_trades_delete" ON coordinator_project_trades 
  FOR DELETE USING (
    project_id IN (SELECT id FROM coordinator_projects WHERE coordinator_id = auth.uid())
  );

-- Trusted suppliers: solo el coordinador
CREATE POLICY "coordinator_trusted_suppliers_select" ON coordinator_trusted_suppliers 
  FOR SELECT USING (coordinator_id = auth.uid());

CREATE POLICY "coordinator_trusted_suppliers_insert" ON coordinator_trusted_suppliers 
  FOR INSERT WITH CHECK (coordinator_id = auth.uid());

CREATE POLICY "coordinator_trusted_suppliers_update" ON coordinator_trusted_suppliers 
  FOR UPDATE USING (coordinator_id = auth.uid());

CREATE POLICY "coordinator_trusted_suppliers_delete" ON coordinator_trusted_suppliers 
  FOR DELETE USING (coordinator_id = auth.uid());

-- Modifications: acceso a través del trade y proyecto
CREATE POLICY "coordinator_project_modifications_select" ON coordinator_project_modifications 
  FOR SELECT USING (
    project_trade_id IN (
      SELECT cpt.id FROM coordinator_project_trades cpt
      JOIN coordinator_projects cp ON cpt.project_id = cp.id
      WHERE cp.coordinator_id = auth.uid()
    )
  );

CREATE POLICY "coordinator_project_modifications_insert" ON coordinator_project_modifications 
  FOR INSERT WITH CHECK (
    project_trade_id IN (
      SELECT cpt.id FROM coordinator_project_trades cpt
      JOIN coordinator_projects cp ON cpt.project_id = cp.id
      WHERE cp.coordinator_id = auth.uid()
    )
  );

CREATE POLICY "coordinator_project_modifications_update" ON coordinator_project_modifications 
  FOR UPDATE USING (
    project_trade_id IN (
      SELECT cpt.id FROM coordinator_project_trades cpt
      JOIN coordinator_projects cp ON cpt.project_id = cp.id
      WHERE cp.coordinator_id = auth.uid()
    )
  );

-- =====================================================
-- Función para recalcular totales del proyecto
-- =====================================================

CREATE OR REPLACE FUNCTION recalculate_coordinator_project_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_total_original DECIMAL(10,2);
  v_total_with_margins DECIMAL(10,2);
  v_coordination_fee DECIMAL(10,2);
  v_coordination_fee_type TEXT;
  v_total_final DECIMAL(10,2);
BEGIN
  -- Calcular suma de presupuestos originales y con márgenes
  SELECT 
    COALESCE(SUM(original_budget), 0),
    COALESCE(SUM(final_budget), 0)
  INTO v_total_original, v_total_with_margins
  FROM coordinator_project_trades
  WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);
  
  -- Obtener fee de coordinación
  SELECT coordination_fee, coordination_fee_type
  INTO v_coordination_fee, v_coordination_fee_type
  FROM coordinator_projects
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  -- Calcular total final
  IF v_coordination_fee_type = 'percentage' THEN
    v_total_final := v_total_with_margins * (1 + v_coordination_fee / 100);
  ELSE
    v_total_final := v_total_with_margins + v_coordination_fee;
  END IF;
  
  -- Actualizar proyecto
  UPDATE coordinator_projects
  SET 
    total_original = v_total_original,
    total_with_margins = v_total_with_margins,
    total_final = v_total_final
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para recalcular al modificar trades
DROP TRIGGER IF EXISTS trigger_recalculate_project_totals ON coordinator_project_trades;
CREATE TRIGGER trigger_recalculate_project_totals
  AFTER INSERT OR UPDATE OR DELETE ON coordinator_project_trades
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_coordinator_project_totals();

-- =====================================================
-- Función para calcular presupuesto final con margen
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_trade_final_budget()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.margin_type = 'percentage' THEN
    NEW.final_budget := NEW.original_budget * (1 + NEW.margin_value / 100);
  ELSE
    NEW.final_budget := NEW.original_budget + NEW.margin_value;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_final_budget ON coordinator_project_trades;
CREATE TRIGGER trigger_calculate_final_budget
  BEFORE INSERT OR UPDATE OF original_budget, margin_type, margin_value ON coordinator_project_trades
  FOR EACH ROW
  EXECUTE FUNCTION calculate_trade_final_budget();
