
import { createClient } from "@supabase/supabase-js"

async function checkRPCs() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"

    const supabase = createClient(supabaseUrl, supabaseKey)

    const rpcs = ['get_ai_daily_usage', 'increment_ai_usage']
    const userId = "4834226d-2f08-410a-9bc6-324da5233261" // Just for testing

    for (const rpc of rpcs) {
        console.log(`Checking RPC ${rpc}...`)
        const { data, error } = await supabase.rpc(rpc, { p_user_id: userId })
        if (error) {
            console.log(`❌ RPC ${rpc}: ERROR (${error.code}: ${error.message})`)
            if (error.message.includes("does not exist")) {
                console.log(`   HINT: The function ${rpc} is likely missing.`)
            }
        } else {
            console.log(`✅ RPC ${rpc}: EXISTS (returned ${JSON.stringify(data)})`)
        }
    }

    process.exit(0)
}

checkRPCs()
