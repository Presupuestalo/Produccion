import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const tableName = searchParams.get("table") || "company_credits"

        const { data: policies, error } = await supabaseAdmin.rpc("exec_sql", {
            sql: `
        SELECT
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM
            pg_policies
        WHERE
            tablename = '${tableName}';
      `,
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            table: tableName,
            policies: policies || [],
            timestamp: new Date().toISOString()
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
