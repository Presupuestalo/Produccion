-- FINAL FIX: RLS policies for budget_settings to allow professional access
-- This script expands access beyond just project owners to include professionals
-- who have been granted access to the project (via lead_requests or company assignment).

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view budget settings for their projects" ON public.budget_settings;
DROP POLICY IF EXISTS "Users can insert budget settings for their projects" ON public.budget_settings;
DROP POLICY IF EXISTS "Users can update budget settings for their projects" ON public.budget_settings;
DROP POLICY IF EXISTS "Users can delete budget settings for their projects" ON public.budget_settings;

-- 2. Create expanded policies
-- These check if the user is the owner OR a professional with an interaction/lead request

-- SELECT Policy
CREATE POLICY "Users can view budget settings for accessible projects"
  ON public.budget_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = budget_settings.project_id
      AND (
        p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.lead_requests lr
          JOIN public.profiles prof ON lr.selected_company = prof.company_profile_id
          WHERE lr.project_id = p.id AND prof.id = auth.uid()
        )
      )
    )
  );

-- INSERT Policy
CREATE POLICY "Users can insert budget settings for accessible projects"
  ON public.budget_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = budget_settings.project_id
      AND (
        p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.lead_requests lr
          JOIN public.profiles prof ON lr.selected_company = prof.company_profile_id
          WHERE lr.project_id = p.id AND prof.id = auth.uid()
        )
      )
    )
  );

-- UPDATE Policy
CREATE POLICY "Users can update budget settings for accessible projects"
  ON public.budget_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = budget_settings.project_id
      AND (
        p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.lead_requests lr
          JOIN public.profiles prof ON lr.selected_company = prof.company_profile_id
          WHERE lr.project_id = p.id AND prof.id = auth.uid()
        )
      )
    )
  );

-- DELETE Policy
CREATE POLICY "Users can delete budget settings for accessible projects"
  ON public.budget_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = budget_settings.project_id
      AND (
        p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.lead_requests lr
          JOIN public.profiles prof ON lr.selected_company = prof.company_profile_id
          WHERE lr.project_id = p.id AND prof.id = auth.uid()
        )
      )
    )
  );
