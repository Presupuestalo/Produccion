-- This script ensures the 'appointments' table has a 'project_id' column 
-- and a foreign key constraint pointing to the 'projects' table.

DO $$
BEGIN
    -- 1. Create the column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='appointments' AND column_name='project_id'
    ) THEN
        ALTER TABLE appointments ADD COLUMN project_id UUID;
    END IF;

    -- 2. Create the foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='appointments' AND constraint_name='appointments_project_id_fkey'
    ) THEN
        ALTER TABLE appointments 
            ADD CONSTRAINT appointments_project_id_fkey 
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Also let's optionally check if there are other missing relationships 
-- that the UI might need later, like users.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='appointments' AND constraint_name='appointments_user_id_fkey'
    ) THEN
        ALTER TABLE appointments 
            ADD CONSTRAINT appointments_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;
