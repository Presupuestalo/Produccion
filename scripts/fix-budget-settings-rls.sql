-- Script para debuggear y potencialmente arreglar RLS de budget_settings

-- PASO 1: Verificar que las políticas RLS existen
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'budget_settings';

-- PASO 2: Opcional - Eliminar políticas antiguas y recrearlas
-- Descomenta solo si es necesario

-- DROP POLICY IF EXISTS "Users can view their own budget settings" ON public.budget_settings;
-- DROP POLICY IF EXISTS "Users can insert budget settings for their projects" ON public.budget_settings;
-- DROP POLICY IF EXISTS "Users can update their own budget settings" ON public.budget_settings;
-- DROP POLICY IF EXISTS "Users can delete their own budget settings" ON public.budget_settings;

-- PASO 3: Recrear políticas con mejor manejo
-- Descomenta solo si eliminaste las anteriores

-- CREATE POLICY "Users can view their own budget settings"
--   ON public.budget_settings
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.projects 
--       WHERE projects.id = budget_settings.project_id 
--       AND projects.user_id = auth.uid()
--     )
--   );

-- CREATE POLICY "Users can insert budget settings for their projects"
--   ON public.budget_settings
--   FOR INSERT
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM public.projects 
--       WHERE projects.id = budget_settings.project_id 
--       AND projects.user_id = auth.uid()
--     )
--   );

-- CREATE POLICY "Users can update their own budget settings"
--   ON public.budget_settings
--   FOR UPDATE
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.projects 
--       WHERE projects.id = budget_settings.project_id 
--       AND projects.user_id = auth.uid()
--     )
--   );

-- CREATE POLICY "Users can delete their own budget settings"
--   ON public.budget_settings
--   FOR DELETE
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.projects 
--       WHERE projects.id = budget_settings.project_id 
--       AND projects.user_id = auth.uid()
--     )
--   );
