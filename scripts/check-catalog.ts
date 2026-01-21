
import { createClient } from "@supabase/supabase-js"

async function checkCatalogTables() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("Checking catalog tables...")

    const tablesToCheck = ['price_master', 'price_categories', 'user_prices']

    for (const table of tablesToCheck) {
        try {
            const { count, error: tableError } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true })

            if (tableError) {
                console.log(`❌ Table '${table}': ERROR (${tableError.code}: ${tableError.message})`)
            } else {
                console.log(`✅ Table '${table}': EXISTS (${count} rows)`)

                if (table === 'price_master') {
                    // Check columns
                    const { data, error: colError } = await supabase.from(table).select('*').limit(1)
                    if (data && data.length > 0) {
                        console.log(`Columns in ${table}: ${Object.keys(data[0]).join(', ')}`)
                    }
                }
            }
        } catch (e) {
            console.log(`❌ Table '${table}': EXCEPTION`)
        }
    }

    process.exit(0)
}

checkCatalogTables()
