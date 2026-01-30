
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
    console.log("Checking profiles table for telegram_user_id column...");

    // Try to select the column. If it doesn't exist, Supabase/Postgres will throw an error.
    const { data, error } = await supabase
        .from('profiles')
        .select('telegram_user_id')
        .limit(1);

    if (error) {
        console.error("Error selecting column:", error.message);
        if (error.message.includes("does not exist")) {
            console.log("Column DOES NOT exist.");
        } else {
            console.log("Unknown error, maybe column doesn't exist or permissions.");
        }
    } else {
        console.log("Column EXISTS.");
    }
}

checkColumn();
