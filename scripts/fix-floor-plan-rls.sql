-- Enable RLS on project_floor_plans
ALTER TABLE project_floor_plans ENABLE ROW LEVEL SECURITY;

-- 1. Schema Updates for V2 Editor & Decoupling
-- Add 'data' column to store the full JSON state of the editor
ALTER TABLE project_floor_plans ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
-- Add 'name' column for user-defined names
ALTER TABLE project_floor_plans ADD COLUMN IF NOT EXISTS name TEXT;
-- Add 'variant' column to distinguish between states
ALTER TABLE project_floor_plans ADD COLUMN IF NOT EXISTS variant TEXT DEFAULT 'proposal' CHECK (variant IN ('current', 'proposal'));
-- Add 'description' column
ALTER TABLE project_floor_plans ADD COLUMN IF NOT EXISTS description TEXT;

-- DECOUPLING START: Add user_id and make project_id nullable
ALTER TABLE project_floor_plans ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE project_floor_plans ALTER COLUMN project_id DROP NOT NULL;
-- Sync user_id for existing rows based on project ownership (if any)
UPDATE project_floor_plans 
SET user_id = projects.user_id 
FROM projects 
WHERE project_floor_plans.project_id = projects.id 
AND project_floor_plans.user_id IS NULL;
-- DECOUPLING END

-- 2. Fix Unique Constraint for Upsert
-- We need a constraint that handles both cases. 
-- For standalone plans (project_id IS NULL), we might want a unique name per user? 
-- Or just rely on ID?
-- The previous constraint was (project_id, variant). 
-- If project_id is NULL, this unique constraint allows multiple NULLs unless we index carefully.
-- However, the Save API will likely use the primary key (id) for updates, or we need a new way to identify.
-- Let's keep the (project_id, variant) for project-linked plans.
-- For standalone plans, we might not enforce a unique constraint other than ID for now, 
-- or `(user_id, name)`? Let's keep it simple and just ensure technical constraints don't crash.

DO $$
BEGIN
    -- Drop old single-project constraint if exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_floor_plans_project_id_key') THEN
        ALTER TABLE project_floor_plans DROP CONSTRAINT project_floor_plans_project_id_key;
    END IF;

    -- Add composite constraint required by the API upsert for PROJECT linked plans
    -- This will only enforce uniqueness when project_id is NOT NULL.
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_floor_plans_project_id_variant_key') THEN
        ALTER TABLE project_floor_plans ADD CONSTRAINT project_floor_plans_project_id_variant_key UNIQUE (project_id, variant);
    END IF;
END $$;

-- 3. RLS Policies
-- Drop existing policies to ensure we start fresh
DROP POLICY IF EXISTS "Users can view plans of their projects" ON project_floor_plans;
DROP POLICY IF EXISTS "Users can insert plans to their projects" ON project_floor_plans;
DROP POLICY IF EXISTS "Users can update plans of their projects" ON project_floor_plans;
DROP POLICY IF EXISTS "Users can delete plans of their projects" ON project_floor_plans;

-- Re-create policies with Dual Access Logic (Direct Owner OR Project Owner)

CREATE POLICY "Users can view their plans" 
ON project_floor_plans FOR SELECT 
USING (
  (user_id = auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_floor_plans.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their plans" 
ON project_floor_plans FOR INSERT 
WITH CHECK (
  (user_id = auth.uid()) OR 
  (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_floor_plans.project_id 
    AND projects.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can update their plans" 
ON project_floor_plans FOR UPDATE 
USING (
  (user_id = auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_floor_plans.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their plans" 
ON project_floor_plans FOR DELETE 
USING (
  (user_id = auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_floor_plans.project_id 
    AND projects.user_id = auth.uid()
  )
);
