
-- Mejorar las políticas RLS para budget_line_items
-- Permitir que tanto el creador del presupuesto como el dueño del proyecto puedan gestionar las partidas

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Users can view their budget line items" ON public.budget_line_items;
DROP POLICY IF EXISTS "Users can create budget line items" ON public.budget_line_items;
DROP POLICY IF EXISTS "Users can update their budget line items" ON public.budget_line_items;
DROP POLICY IF EXISTS "Users can delete their budget line items" ON public.budget_line_items;

-- Nueva política de SELECT: Propietario del presupuesto O Propietario del proyecto
CREATE POLICY "Anyone with project access can view line items"
  ON public.budget_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.budgets b
      JOIN public.projects p ON p.id = b.project_id
      WHERE b.id = budget_line_items.budget_id
      AND (b.user_id = auth.uid() OR p.user_id = auth.uid())
    )
  );

-- Nueva política de INSERT: Propietario del presupuesto O Propietario del proyecto
CREATE POLICY "Anyone with project access can insert line items"
  ON public.budget_line_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.budgets b
      JOIN public.projects p ON p.id = b.project_id
      WHERE b.id = budget_line_items.budget_id
      AND (b.user_id = auth.uid() OR p.user_id = auth.uid())
    )
  );

-- Nueva política de UPDATE: Propietario del presupuesto O Propietario del proyecto
CREATE POLICY "Anyone with project access can update line items"
  ON public.budget_line_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.budgets b
      JOIN public.projects p ON p.id = b.project_id
      WHERE b.id = budget_line_items.budget_id
      AND (b.user_id = auth.uid() OR p.user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.budgets b
      JOIN public.projects p ON p.id = b.project_id
      WHERE b.id = budget_line_items.budget_id
      AND (b.user_id = auth.uid() OR p.user_id = auth.uid())
    )
  );

-- Nueva política de DELETE: Propietario del presupuesto O Propietario del proyecto
CREATE POLICY "Anyone with project access can delete line items"
  ON public.budget_line_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.budgets b
      JOIN public.projects p ON p.id = b.project_id
      WHERE b.id = budget_line_items.budget_id
      AND (b.user_id = auth.uid() OR p.user_id = auth.uid())
    )
  );
