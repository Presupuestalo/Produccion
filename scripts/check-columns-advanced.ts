
import { createClient } from "@supabase/supabase-js"

async function checkColumns() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Try to get one row even if empty to see columns via better way
    // Actually, can't easily get schema via JS client without rows or RPC
    // Let's try to insert a garbage row and see what errors we get about missing columns
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'lead_requests' })
    if (error) {
        console.log("RPC Error (expected if not exists):", error.message)
        // Fallback: Check projects table again but focus on what we have
        const { data: projData } = await supabase.from('projects').select('*').limit(1)
        if (projData && projData.length > 0) {
            console.log("Projects Columns:", Object.keys(projData[0]))
        }
    } else {
        console.log("Lead Requests Columns:", data)
    }
}

checkColumns()
