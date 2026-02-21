import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function test() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
    SELECT constraint_name, constraint_type 
    FROM information_schema.table_constraints 
    WHERE table_name = 'project_floor_plans';
  `})
  console.log("FKs:", data, error)
}
test()
