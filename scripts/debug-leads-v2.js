
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeads() {
    const targetUser = "76030274-0308-4b66-94d3-e68d206bc7b9";
    console.log("Checking lead_requests for user:", targetUser);

    const { data: leads, error } = await supabase
        .from("lead_requests")
        .select("*")
        .eq("homeowner_id", targetUser)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching leads:", error);
        return;
    }

    console.log(`Found ${leads.length} leads for this user:`);
    leads.forEach(l => {
        console.log(JSON.stringify(l, null, 2));
    });

    console.log("\nChecking ALL recent leads (limit 5):");
    const { data: allLeads } = await supabase
        .from("lead_requests")
        .select("id, homeowner_id, client_name, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

    allLeads?.forEach(l => {
        console.log(`- ID: ${l.id} | Homeowner: ${l.homeowner_id} | Client: ${l.client_name} | Status: ${l.status}`);
    });
}

checkLeads();
