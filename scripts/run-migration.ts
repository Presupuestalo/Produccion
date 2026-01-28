
import { createClient } from "@supabase/supabase-js"
import fs from 'fs';
import path from 'path';

async function runMigration() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"

    const supabase = createClient(supabaseUrl, supabaseKey)

    const sqlFilePath = path.join(__dirname, 'fix-rls-floor-plans.sql');
    console.log(`Reading SQL file from: ${sqlFilePath}`);

    try {
        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('Executing migration...');

        // Split by semicolon to run statements individually if needed, 
        // but `exec_sql` RPC or raw query usually takes the whole block if supported.
        // However, standard supabase client doesn't run raw SQL easily without an RPC.
        // The `save-floor-plan` route uses an RPC `exec_sql`. Let's try to use that.

        const { error } = await supabase.rpc("exec_sql", { sql })

        if (error) {
            console.error("Error executing migration:", error)
            // Fallback: if exec_sql doesn't exist or fails, we might need another way or manual run.
            // But since the project uses it, it likely exists.
            if (error.message.includes("function exec_sql") && error.message.includes("does not exist")) {
                console.error("CRITICAL: exec_sql RPC does not exist. Cannot run raw SQL from client.");
            }
        } else {
            console.log("Migration executed successfully!");
        }

    } catch (err) {
        console.error("Error reading or processing file:", err);
    }

    process.exit(0)
}

runMigration()
