
import { createClient } from "@supabase/supabase-js"

async function checkRLS() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("Checking RLS policies for lead_requests...")
    const { data: policies, error } = await supabase.rpc('get_policies_for_table', { table_name_input: 'lead_requests' })

    if (error) {
        console.log("Using fallback query for policies...")
        const { data: queryPolicies, error: queryError } = await supabase.from('pg_policies').select('*').eq('tablename', 'lead_requests')
        // Actually pg_policies is in information_schema or similar, might not be accessible via from()
        console.log("Query Error (expected):", queryError?.message)
    } else {
        console.log("Policies:", policies)
    }

    // Try to check if RLS is enabled
    console.log("Checking if RLS is enabled...")
    const { data: rlsCheck } = await supabase.rpc('is_rls_enabled', { table_name_input: 'lead_requests' })
    console.log("RLS Enabled:", rlsCheck)

    // Check table rows count with service role
    const { count } = await supabase.from('lead_requests').select('*', { count: 'exact', head: true })
    console.log("Total rows (Admin):", count)
}

checkRLS()
