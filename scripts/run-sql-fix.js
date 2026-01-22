
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL() {
    const sql = fs.readFileSync('scripts/rls-fix-lead-requests.sql', 'utf8');
    console.log("Executing SQL fix...");

    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
        console.error("Error executing SQL:", error);
    } else {
        console.log("SQL executed successfully:", data);
    }
    process.exit(0);
}

executeSQL();
