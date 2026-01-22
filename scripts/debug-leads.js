
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeads() {
    console.log("Checking lead_requests for user: 76030274-0308-4b66-94d3-e68d206bc7b9");

    const { data: leads, error } = await supabase
        .from("lead_requests")
        .select("id, homeowner_id, client_name, status, created_at")
        .eq("homeowner_id", "76030274-0308-4b66-94d3-e68d206bc7b9")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching leads:", error);
        return;
    }

    console.log(`Found ${leads.length} leads for this user:`);
    leads.forEach(l => {
        console.log(`- ID: ${l.id} | Status: ${l.status} | Created: ${l.created_at}`);
    });

    if (leads.length === 0) {
        console.log("\nChecking ALL recent leads to see if they belong to someone else:");
        const { data: allLeads } = await supabase
            .from("lead_requests")
            .select("id, homeowner_id, client_name, status, created_at")
            .order("created_at", { ascending: false })
            .limit(5);

        allLeads?.forEach(l => {
            console.log(`- ID: ${l.id} | Homeowner: ${l.homeowner_id} | Client: ${l.client_name}`);
        });
    }
}

checkLeads();
