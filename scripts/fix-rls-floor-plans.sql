-- Enable RLS on the table
ALTER TABLE project_floor_plans ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT
-- Users can see floor plans if they own the project
CREATE POLICY "Users can view their own project floor plans" 
ON project_floor_plans FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_floor_plans.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Policy for INSERT
-- Users can insert floor plans if they own the project
CREATE POLICY "Users can insert their own project floor plans" 
ON project_floor_plans FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_floor_plans.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Policy for UPDATE
-- Users can update floor plans if they own the project
CREATE POLICY "Users can update their own project floor plans" 
ON project_floor_plans FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_floor_plans.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Policy for DELETE
-- Users can delete floor plans if they own the project
CREATE POLICY "Users can delete their own project floor plans" 
ON project_floor_plans FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_floor_plans.project_id 
    AND projects.user_id = auth.uid()
  )
);
