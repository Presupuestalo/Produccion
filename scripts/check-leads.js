
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeads() {
    console.log("Checking lead_requests...");

    const { data: leads, error } = await supabase
        .from("lead_requests")
        .select("id, homeowner_id, client_name, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error fetching leads:", error);
        return;
    }

    console.log(`Found ${leads.length} recent leads:`);
    leads.forEach(l => {
        console.log(`- ID: ${l.id} | Homeowner: ${l.homeowner_id} | Client: ${l.client_name} | Status: ${l.status} | Created: ${l.created_at}`);
    });
}

checkLeads();
