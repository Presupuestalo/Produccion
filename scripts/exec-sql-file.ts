
import { createClient } from "@supabase/supabase-js"
import fs from 'fs';
import path from 'path';

async function runMigration() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"

    const supabase = createClient(supabaseUrl, supabaseKey)

    const fileName = process.argv[2];
    if (!fileName) {
        console.error("Please provide a SQL file path as an argument.");
        process.exit(1);
    }

    const sqlFilePath = path.resolve(process.cwd(), fileName);
    console.log(`Reading SQL file from: ${sqlFilePath}`);

    try {
        if (!fs.existsSync(sqlFilePath)) {
            console.error(`File not found: ${sqlFilePath}`);
            process.exit(1);
        }

        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('Executing SQL...');

        const { data, error } = await supabase.rpc("exec_sql", { sql })

        if (error) {
            console.error("Error executing SQL:", error)
        } else {
            console.log("SQL executed successfully!");
            if (data) console.log("Result:", JSON.stringify(data, null, 2));
        }

    } catch (err) {
        console.error("Error reading or processing file:", err);
    }

    process.exit(0)
}

runMigration()
