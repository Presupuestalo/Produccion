-- Add status column to budget_settings table
ALTER TABLE budget_settings 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'delivered', 'accepted', 'rejected'));

-- Add status column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'delivered', 'accepted', 'in_progress', 'rejected', 'completed'));

-- Reset any NULL status values to 'draft' to ensure clean state
UPDATE budget_settings SET status = 'draft' WHERE status IS NULL;
UPDATE projects SET status = 'draft' WHERE status IS NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_budget_settings_status ON budget_settings(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Add index for finding accepted budgets by project
CREATE INDEX IF NOT EXISTS idx_budget_settings_project_status ON budget_settings(project_id, status);
