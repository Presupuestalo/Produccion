-- Create budget_adjustments table to store adjustments and extras for accepted budgets
CREATE TABLE IF NOT EXISTS budget_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('addition', 'subtraction')),
  category TEXT NOT NULL,
  concept_code TEXT,
  concept TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'ud',
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  adjustment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_budget_adjustments_budget_id ON budget_adjustments(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_adjustments_type ON budget_adjustments(type);

-- Add RLS policies
ALTER TABLE budget_adjustments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view adjustments for budgets in their projects
CREATE POLICY "Users can view budget adjustments"
  ON budget_adjustments
  FOR SELECT
  USING (
    budget_id IN (
      SELECT b.id FROM budgets b
      INNER JOIN projects p ON b.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Policy: Users can insert adjustments for budgets in their projects
CREATE POLICY "Users can insert budget adjustments"
  ON budget_adjustments
  FOR INSERT
  WITH CHECK (
    budget_id IN (
      SELECT b.id FROM budgets b
      INNER JOIN projects p ON b.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Policy: Users can update adjustments for budgets in their projects
CREATE POLICY "Users can update budget adjustments"
  ON budget_adjustments
  FOR UPDATE
  USING (
    budget_id IN (
      SELECT b.id FROM budgets b
      INNER JOIN projects p ON b.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Policy: Users can delete adjustments for budgets in their projects
CREATE POLICY "Users can delete budget adjustments"
  ON budget_adjustments
  FOR DELETE
  USING (
    budget_id IN (
      SELECT b.id FROM budgets b
      INNER JOIN projects p ON b.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
