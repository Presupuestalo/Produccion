import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function POST() {
    try {
        const sql = `
      -- 1. Create table if not exists with all columns
      CREATE TABLE IF NOT EXISTS company_credits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        credits_balance INTEGER DEFAULT 0,
        credits_purchased_total INTEGER DEFAULT 0,
        credits_spent_total INTEGER DEFAULT 0,
        last_purchase_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      -- 2. Add Unique constraint if missing
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conname = 'company_credits_company_id_key'
          ) THEN
              ALTER TABLE company_credits ADD CONSTRAINT company_credits_company_id_key UNIQUE (company_id);
          END IF;
      END $$;
    `

        console.log("[v0] Applying SQL schema fix...")
        const { error: sqlErr } = await supabaseAdmin.rpc('exec_sql', { sql })

        if (sqlErr) {
            console.error("[v0] SQL Error:", sqlErr)
            return NextResponse.json({ error: sqlErr.message, code: sqlErr.code }, { status: 500 })
        }

        // Test upsert for the current user
        const testUserId = "d2552f2d-ce70-4a2e-a405-3f6119a763d4" // presupuestaloficial@gmail.com
        const { data: testData, error: upsertErr } = await supabaseAdmin
            .from("company_credits")
            .upsert({
                company_id: testUserId,
                credits_balance: 0,
                credits_purchased_total: 0,
                credits_spent_total: 0
            }, { onConflict: 'company_id' })
            .select()
            .single()

        if (upsertErr) {
            console.error("[v0] Upsert Test Error:", upsertErr)
            return NextResponse.json({ error: "Upsert test failed", details: upsertErr }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: "Database schema fixed and tested",
            data: testData
        })
    } catch (error: any) {
        console.error("[v0] Fatal Error in fix route:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
