
import { createClient } from "@supabase/supabase-js"

async function checkSchema() {
    const supabaseUrl = "https://zjzvyhpgiknkhrbnkrbo.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZ5aHBnaWtua2hyYm5rcmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTM2OCwiZXhwIjoyMDg0NTA1MzY4fQ.H8gq-w4Ij-92xdkXtSYCyafCL6cP_LAGiu38P-2ii5w"
    const supabase = createClient(supabaseUrl, supabaseKey)

    // In many Supabase setups, 'id' might be 'text' or 'uuid' but missing the PK constraint if imported from CSV
    const sql = `
        SELECT 
            cols.column_name, 
            cols.data_type,
            (SELECT count(*) FROM pg_constraint con 
             WHERE con.conrelid = (SELECT oid FROM pg_class WHERE relname = cols.table_name) 
             AND con.contype = 'p') as has_pk
        FROM information_schema.columns cols
        WHERE table_name IN ('price_categories', 'subscription_plans', 'trade_types')
        AND column_name = 'id'
    `;

    // Since exec_sql is VOID, let's try to infer from data
    const { data: cat } = await supabase.from('price_categories').select('*').limit(1);
    console.log("price_categories sample:", cat);

    const { data: plans } = await supabase.from('subscription_plans').select('*').limit(1);
    console.log("subscription_plans sample:", plans);

    process.exit(0)
}
checkSchema()
