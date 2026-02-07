-- 1. Agregar columna user_id a budget_settings (que falta según el diagnóstico)
ALTER TABLE public.budget_settings 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Eliminar el constraint UNIQUE(project_id) si existe, ya que ahora 
--    cada profesional puede tener sus propios ajustes para el mismo proyecto
ALTER TABLE public.budget_settings DROP CONSTRAINT IF EXISTS budget_settings_project_id_key;

-- 3. Crear un nuevo constraint UNIQUE(project_id, user_id)
--    Esto permite que cada usuario (profesional o dueño) tenga sus propios ajustes por proyecto
ALTER TABLE public.budget_settings ADD CONSTRAINT budget_settings_project_user_unique UNIQUE(project_id, user_id);

-- 4. Actualizar las políticas RLS para budget_settings
DROP POLICY IF EXISTS "Users can view budget settings for accessible projects" ON public.budget_settings;
DROP POLICY IF EXISTS "Users can insert budget settings for accessible projects" ON public.budget_settings;
DROP POLICY IF EXISTS "Users can update budget settings for accessible projects" ON public.budget_settings;
DROP POLICY IF EXISTS "Users can delete budget settings for accessible projects" ON public.budget_settings;

-- SELECT Policy: Dueño del proyecto O profesional que accedió al lead O dueño de los ajustes
CREATE POLICY "budget_settings_select_policy"
  ON public.budget_settings
  FOR SELECT
  USING (
    user_id = auth.uid() -- Es el dueño de estos ajustes
    OR EXISTS ( -- O es el dueño del proyecto
      SELECT 1 FROM public.projects p
      WHERE p.id = budget_settings.project_id
      AND p.user_id = auth.uid()
    )
    OR EXISTS ( -- O es un profesional que ha accedido al lead de este proyecto
      SELECT 1 FROM public.lead_requests lr
      WHERE lr.project_id = budget_settings.project_id
      AND auth.uid() = ANY(lr.companies_accessed_ids)
    )
  );

-- INSERT Policy: Permitir si es el dueño del proyecto O profesional que accedió al lead
CREATE POLICY "budget_settings_insert_policy"
  ON public.budget_settings
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id -- Siempre debe ser el usuario actual
    AND (
      EXISTS ( -- Es el dueño del proyecto
        SELECT 1 FROM public.projects p
        WHERE p.id = budget_settings.project_id
        AND p.user_id = auth.uid()
      )
      OR EXISTS ( -- O es un profesional que ha accedido al lead
        SELECT 1 FROM public.lead_requests lr
        WHERE lr.project_id = budget_settings.project_id
        AND auth.uid() = ANY(lr.companies_accessed_ids)
      )
    )
  );

-- UPDATE Policy: Solo el dueño de los ajustes puede editarlos
CREATE POLICY "budget_settings_update_policy"
  ON public.budget_settings
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE Policy: Solo el dueño de los ajustes puede borrarlos
CREATE POLICY "budget_settings_delete_policy"
  ON public.budget_settings
  FOR DELETE
  USING (user_id = auth.uid());

-- 5. TAMBIÉN: Arreglar acceso a la tabla PROJECTS para profesionales
--    Actualmente es muy restrictiva (solo user_id = auth.uid())
DROP POLICY IF EXISTS "users_can_view_own_projects" ON public.projects;
CREATE POLICY "projects_select_professional_access"
  ON public.projects
  FOR SELECT
  USING (
    user_id = auth.uid() -- Dueño del proyecto
    OR EXISTS ( -- O profesional que accedió al lead
      SELECT 1 FROM public.lead_requests lr
      WHERE lr.project_id = projects.id
      AND auth.uid() = ANY(lr.companies_accessed_ids)
    )
  );

-- 6. TAMBIÉN: Arreglar acceso a la tabla BUDGETS para profesionales
--    Permitir que el dueño del proyecto vea los presupuestos de los profesionales
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
CREATE POLICY "budgets_select_shared_access"
  ON public.budgets
  FOR SELECT
  USING (
    user_id = auth.uid() -- El profesional ve sus propios presupuestos
    OR EXISTS ( -- El dueño del proyecto ve los presupuestos de su proyecto
      SELECT 1 FROM public.projects p
      WHERE p.id = budgets.project_id
      AND p.user_id = auth.uid()
    )
  );
