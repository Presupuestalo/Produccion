import { createClient } from "@supabase/supabase-js"
import * as fs from 'fs'

async function inspectLeads() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"

    const supabase = createClient(supabaseUrl, supabaseKey)
    const results: any = {}

    console.log("Inspecting lead_requests table structure...")
    const { data: cols, error: colError } = await supabase.rpc('exec_sql', {
        sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'lead_requests' ORDER BY ordinal_position;"
    })

    results.columns = cols || { error: colError }

    console.log("Fetching recent leads sample...")
    const { data: leads, error: leadError } = await supabase
        .from('lead_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    results.leads = leads || { error: leadError }

    fs.writeFileSync('leads_debug.json', JSON.stringify(results, null, 2))
    console.log("Results written to leads_debug.json")

    process.exit(0)
}

inspectLeads()
