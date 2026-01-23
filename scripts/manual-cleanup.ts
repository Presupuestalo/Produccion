import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanup() {
    const userId = "acf8fc4c-9b46-47af-97c0-f25168e64fa7"
    console.log(`Starting cleanup for user: ${userId}`)

    // 1. Fetch all records for this user
    const { data: records, error: fetchErr } = await supabase
        .from("company_credits")
        .select("*")
        .eq("company_id", userId)

    if (fetchErr) {
        console.error("Error fetching records:", fetchErr)
        return
    }

    console.log(`Found ${records?.length} records`)

    if (records && records.length > 1) {
        // Keep the one with highest balance or the first one
        const toKeep = records[0].id
        const toDelete = records.slice(1).map(r => r.id)

        console.log(`Keeping ${toKeep}, deleting ${toDelete.length} records...`)

        const { error: delErr } = await supabase
            .from("company_credits")
            .delete()
            .in("id", toDelete)

        if (delErr) {
            console.error("Error deleting duplicates:", delErr)
        } else {
            console.log("Deleted duplicates successfully")
        }
    }

    // 2. Try to add RLS policy via RPC if possible, or just log status
    console.log("Database state for user after cleanup:")
    const { data: final } = await supabase
        .from("company_credits")
        .select("*")
        .eq("company_id", userId)
    console.log(final)
}

cleanup()
