import { createClient } from "@supabase/supabase-js"

async function checkTables() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("Checking tables via direct query...")

    const tablesToCheck = ['profiles', 'email_verification_codes', 'projects', 'budgets', 'price_master', 'room_photos', 'professional_works', 'calculator_data']

    for (const table of tablesToCheck) {
        try {
            const { count, error: tableError } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true })

            if (tableError) {
                if (tableError.code === '42P01') {
                    console.log(`❌ Table '${table}': DOES NOT EXIST`)
                } else {
                    console.log(`⚠️ Table '${table}': ERROR (${tableError.code}: ${tableError.message})`)
                }
            } else {
                console.log(`✅ Table '${table}': EXISTS (${count} rows)`)
            }
        } catch (e) {
            console.log(`❌ Table '${table}': EXCEPTION`)
        }
    }

    process.exit(0)
}

checkTables()
