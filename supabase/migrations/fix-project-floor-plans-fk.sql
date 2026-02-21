-- This script ensures the 'project_floor_plans' table has a foreign key 
-- constraint pointing to the 'projects' table, so Supabase joins work.

DO $$
BEGIN
    -- Clean up invalid data that violates the constraint (if any orphan plans exist)
    UPDATE project_floor_plans 
    SET project_id = NULL 
    WHERE project_id IS NOT NULL 
    AND project_id NOT IN (SELECT id FROM projects);

    -- Create the foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='project_floor_plans' AND constraint_name='project_floor_plans_project_id_fkey'
    ) THEN
        ALTER TABLE project_floor_plans 
            ADD CONSTRAINT project_floor_plans_project_id_fkey 
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;
