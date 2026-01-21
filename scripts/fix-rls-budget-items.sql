-- Fix RLS for budget_line_items and budgets
-- Ensure authenticated users can properly insert line items into budgets they own

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create budget line items" ON budget_line_items;
DROP POLICY IF EXISTS "Users can view their budget line items" ON budget_line_items;
DROP POLICY IF EXISTS "Users can update their budget line items" ON budget_line_items;
DROP POLICY IF EXISTS "Users can delete their budget line items" ON budget_line_items;

-- Re-create policies with more robust checks
-- SELECT: User can see items if they own the budget
CREATE POLICY "Users can view their budget line items"
  ON budget_line_items FOR SELECT
  TO authenticated
  USING (
    budget_id IN (
      SELECT id FROM budgets WHERE user_id = auth.uid()
    )
  );

-- INSERT: User can insert items if they own the budget
CREATE POLICY "Users can create budget line items"
  ON budget_line_items FOR INSERT
  TO authenticated
  WITH CHECK (
    budget_id IN (
      SELECT id FROM budgets WHERE user_id = auth.uid()
    )
  );

-- UPDATE: User can update items if they own the budget
CREATE POLICY "Users can update their budget line items"
  ON budget_line_items FOR UPDATE
  TO authenticated
  USING (
    budget_id IN (
      SELECT id FROM budgets WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    budget_id IN (
      SELECT id FROM budgets WHERE user_id = auth.uid()
    )
  );

-- DELETE: User can delete items if they own the budget
CREATE POLICY "Users can delete their budget line items"
  ON budget_line_items FOR DELETE
  TO authenticated
  USING (
    budget_id IN (
      SELECT id FROM budgets WHERE user_id = auth.uid()
    )
  );

-- Also ensure budgets table has correct RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can create budgets" ON budgets;
CREATE POLICY "Users can create budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Verify and fix price_master RLS if needed
DROP POLICY IF EXISTS "Usuarios pueden ver precios base y propios" ON price_master;
CREATE POLICY "Usuarios pueden ver precios base y propios"
  ON price_master FOR SELECT
  TO authenticated
  USING (
    is_custom = false OR 
    (is_custom = true AND user_id = auth.uid())
  );
