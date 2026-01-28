
DO $$
BEGIN
    -- Drop the unique constraint on project_id if it exists to allow multiple variants per project
    -- We assume the name is 'project_floor_plans_project_id_key' or we try to find it dynamically if possible,
    -- but dynamic SQL in DO block is tricky without EXECUTE.
    -- We handle the most common default name.
    
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_floor_plans_project_id_key') THEN
        ALTER TABLE project_floor_plans DROP CONSTRAINT project_floor_plans_project_id_key;
    END IF;

    -- If there is a unique index that is NOT a constraint (created via CREATE UNIQUE INDEX), we should drop it too.
    -- Index name usually same as constraint or 'idx_...'? 
    -- We won't drop unknown indexes blindly.

    -- Add the new unique constraint on (project_id, variant)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_floor_plans_project_id_variant_key') THEN
        ALTER TABLE project_floor_plans ADD CONSTRAINT project_floor_plans_project_id_variant_key UNIQUE (project_id, variant);
    END IF;
END $$;
