
-- Update project_floor_plans table to support the new editor features

-- 1. Add 'data' column to store the full JSON state of the editor (walls, rooms, etc.)
ALTER TABLE project_floor_plans 
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- 2. Add 'name' column for user-defined names (e.g., "Propuesta Cocina Abierta")
ALTER TABLE project_floor_plans 
ADD COLUMN IF NOT EXISTS name TEXT;

-- 3. Add 'variant' column to distinguish between the original state and proposals
-- We use a check constraint to ensure only valid values
ALTER TABLE project_floor_plans 
ADD COLUMN IF NOT EXISTS variant TEXT DEFAULT 'proposal' CHECK (variant IN ('current', 'proposal'));

-- 4. Add 'description' column for extra notes
ALTER TABLE project_floor_plans 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 5. Create an index on project_id and variant for faster queries
CREATE INDEX IF NOT EXISTS idx_floor_plans_project_variant 
ON project_floor_plans(project_id, variant);

-- 6. Comment on columns for documentation
COMMENT ON COLUMN project_floor_plans.data IS 'Stores the full JSON state of the 2D editor (walls, rooms, items)';
COMMENT ON COLUMN project_floor_plans.variant IS 'Distinguishes between "current" (Estado Actual) and "proposal" (Reformado)';
