
import { createClient } from "@supabase/supabase-js"

async function inspectTable() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Row sample:', data)
        if (data.length === 0) console.log("Table is empty, cannot infer columns from data.")
    }

    // Also try to get definition via error message trick or similar if empty? 
    // Or just try to select 'id' explicitly.
    const { data: idData, error: idError } = await supabase.from('projects').select('id').limit(1);
    if (idError) console.log("Has ID column: NO (" + idError.message + ")");
    else console.log("Has ID column: YES");

    const { data: nameData, error: nameError } = await supabase.from('projects').select('name').limit(1);
    if (nameError) console.log("Has name column: NO (" + nameError.message + ")");
    else console.log("Has name column: YES");

    const { data: statusData, error: statusError } = await supabase.from('projects').select('status').limit(1);
    if (statusError) console.log("Has status column: NO (" + statusError.message + ")");
    else console.log("Has status column: YES");
}

inspectTable()
