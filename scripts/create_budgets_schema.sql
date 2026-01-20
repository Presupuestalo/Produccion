-- Tabla principal de presupuestos
DROP TABLE IF EXISTS budgets CASCADE;
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  description TEXT,
  is_original BOOLEAN DEFAULT false,
  parent_budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected')),
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 21.00,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, version_number)
);

-- Tabla de partidas/líneas del presupuesto
DROP TABLE IF EXISTS budget_line_items CASCADE;
CREATE TABLE budget_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  concept_code TEXT,
  concept TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_custom BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_budgets_project_id ON budgets(project_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_parent_budget_id ON budgets(parent_budget_id);
CREATE INDEX idx_budget_line_items_budget_id ON budget_line_items(budget_id);
CREATE INDEX idx_budget_line_items_category ON budget_line_items(category);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_line_items_updated_at ON budget_line_items;
CREATE TRIGGER update_budget_line_items_updated_at
  BEFORE UPDATE ON budget_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para recalcular totales del presupuesto
CREATE OR REPLACE FUNCTION recalculate_budget_totals()
RETURNS TRIGGER AS $$
DECLARE
  budget_subtotal DECIMAL(10,2);
  budget_tax_rate DECIMAL(5,2);
  budget_tax_amount DECIMAL(10,2);
  budget_total DECIMAL(10,2);
BEGIN
  -- Obtener el subtotal sumando todas las líneas
  SELECT COALESCE(SUM(total_price), 0)
  INTO budget_subtotal
  FROM budget_line_items
  WHERE budget_id = COALESCE(NEW.budget_id, OLD.budget_id);
  
  -- Obtener la tasa de impuesto del presupuesto
  SELECT tax_rate
  INTO budget_tax_rate
  FROM budgets
  WHERE id = COALESCE(NEW.budget_id, OLD.budget_id);
  
  -- Calcular impuestos y total
  budget_tax_amount := budget_subtotal * (budget_tax_rate / 100);
  budget_total := budget_subtotal + budget_tax_amount;
  
  -- Actualizar el presupuesto
  UPDATE budgets
  SET 
    subtotal = budget_subtotal,
    tax_amount = budget_tax_amount,
    total = budget_total,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.budget_id, OLD.budget_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para recalcular totales cuando cambian las líneas
DROP TRIGGER IF EXISTS recalculate_on_line_item_insert ON budget_line_items;
CREATE TRIGGER recalculate_on_line_item_insert
  AFTER INSERT ON budget_line_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_budget_totals();

DROP TRIGGER IF EXISTS recalculate_on_line_item_update ON budget_line_items;
CREATE TRIGGER recalculate_on_line_item_update
  AFTER UPDATE ON budget_line_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_budget_totals();

DROP TRIGGER IF EXISTS recalculate_on_line_item_delete ON budget_line_items;
CREATE TRIGGER recalculate_on_line_item_delete
  AFTER DELETE ON budget_line_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_budget_totals();

-- Añadiendo políticas RLS para seguridad
-- Habilitar RLS en las tablas
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_line_items ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla budgets
-- Los usuarios pueden ver sus propios presupuestos
CREATE POLICY "Users can view their own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden crear presupuestos
CREATE POLICY "Users can create budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propios presupuestos
CREATE POLICY "Users can update their own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propios presupuestos
CREATE POLICY "Users can delete their own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para la tabla budget_line_items
-- Los usuarios pueden ver las líneas de sus presupuestos
CREATE POLICY "Users can view their budget line items"
  ON budget_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_line_items.budget_id
      AND budgets.user_id = auth.uid()
    )
  );

-- Los usuarios pueden crear líneas en sus presupuestos
CREATE POLICY "Users can create budget line items"
  ON budget_line_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_line_items.budget_id
      AND budgets.user_id = auth.uid()
    )
  );

-- Los usuarios pueden actualizar líneas de sus presupuestos
CREATE POLICY "Users can update their budget line items"
  ON budget_line_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_line_items.budget_id
      AND budgets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_line_items.budget_id
      AND budgets.user_id = auth.uid()
    )
  );

-- Los usuarios pueden eliminar líneas de sus presupuestos
CREATE POLICY "Users can delete their budget line items"
  ON budget_line_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM budgets
      WHERE budgets.id = budget_line_items.budget_id
      AND budgets.user_id = auth.uid()
    )
  );
