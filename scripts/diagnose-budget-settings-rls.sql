-- Query de diagnóstico para verificar el problema RLS
-- Copia tu project_id del error y reemplaza 'TU-PROJECT-ID-AQUI'

-- 1. Verificar que el proyecto existe y pertenece al usuario autenticado
SELECT 
  p.id as project_id,
  p.user_id as project_owner,
  auth.uid() as current_user,
  CASE 
    WHEN p.user_id = auth.uid() THEN 'MATCH ✓'
    ELSE 'NO MATCH ✗'
  END as user_match
FROM projects p
WHERE p.id = 'TU-PROJECT-ID-AQUI';

-- 2. Si el resultado anterior muestra 'NO MATCH', el problema es que el usuario actual
--    no es el dueño del proyecto. Esto puede pasar si:
--    - Compartiste el proyecto con otro usuario
--    - Estás usando un usuario diferente
--    - El proyecto fue creado por otro usuario

-- 3. SOLUCIÓN TEMPORAL: Permitir que cualquier profesional/usuario autenticado
--    pueda crear budget_settings para proyectos accesibles
-- (Ejecuta esto solo si necesitas una solución rápida)

-- DROP POLICY IF EXISTS "Users can insert budget settings for their projects" ON public.budget_settings;

-- CREATE POLICY "Users can insert budget settings for accessible projects"
--   ON public.budget_settings
--   FOR INSERT
--   WITH CHECK (
--     -- Permitir si es el dueño del proyecto
--     EXISTS (
--       SELECT 1 FROM public.projects 
--       WHERE projects.id = budget_settings.project_id 
--       AND projects.user_id = auth.uid()
--     )
--     -- O si existe alguna relación con el proyecto (ej: lead_requests, proposals, etc)
--     -- Descomenta si necesitas permitir profesionales
--     -- OR EXISTS (
--     --   SELECT 1 FROM public.lead_requests lr
--     --   WHERE lr.project_id = budget_settings.project_id
--     --   AND lr.selected_company = (
--     --     SELECT company_profile_id FROM public.profiles WHERE user_id = auth.uid()
--     --   )
--     -- )
--   );
