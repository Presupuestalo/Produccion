import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase env vars")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const sql = `
DO $$
BEGIN
    UPDATE project_floor_plans 
    SET project_id = NULL 
    WHERE project_id IS NOT NULL 
    AND project_id NOT IN (SELECT id FROM projects);

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='project_floor_plans' AND constraint_name='project_floor_plans_project_id_fkey'
    ) THEN
        ALTER TABLE project_floor_plans 
            ADD CONSTRAINT project_floor_plans_project_id_fkey 
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;
  `
  const { data, error } = await supabase.rpc('exec_sql', { sql })
  console.log("Result:", data)
  console.log("Error:", error)
}

test()
