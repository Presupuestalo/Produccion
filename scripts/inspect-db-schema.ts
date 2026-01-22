
import { createClient } from "@supabase/supabase-js"

async function inspectSchema() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"

    const supabase = createClient(supabaseUrl, supabaseKey)

    const tableToCols = {
        'quote_requests': ['user_id', 'homeowner_id'],
        'quote_offers': ['user_id', 'professional_id'],
        'professional_portfolio': ['user_id', 'professional_id'],
        'calculator_data': ['user_id', 'project_id'],
        'project_floor_plans': ['user_id', 'project_id'],
        'budget_settings': ['user_id', 'project_id'],
        'room_photos': ['user_id', 'project_id']
    }

    for (const [table, cols] of Object.entries(tableToCols)) {
        process.stdout.write(`Testing columns for ${table}: `)
        for (const col of cols) {
            const { error } = await supabase.from(table).select(col).limit(0)
            if (!error) {
                process.stdout.write(`${col} (OK) `)
            } else {
                process.stdout.write(`${col} (FAIL: ${error.code}) `)
            }
        }
        console.log('')
    }

    process.exit(0)
}

inspectSchema()
