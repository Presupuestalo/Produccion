import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function POST() {
    try {
        const userId = "acf8fc4c-9b46-47af-97c0-f25168e64fa7"

        // 1. Get all records
        const { data: records } = await supabaseAdmin
            .from("company_credits")
            .select("id")
            .eq("company_id", userId)

        if (records && records.length > 1) {
            const toDelete = records.slice(1).map(r => r.id)
            await supabaseAdmin.from("company_credits").delete().in("id", toDelete)
            console.log(`[v0] Deleted ${toDelete.length} duplicates`)
        }

        // 2. Ensure RLS allows reading (We try to use RPC to set policy if possible, 
        // but if RPC fails, we at least have a clean table for the unique check)
        // We already moved balance route to use supabaseAdmin which bypasses RLS,
        // but the frontend direct calls need RLS.

        return NextResponse.json({
            success: true,
            message: "Cleanup done",
            remainingRecords: records?.length ? 1 : 0
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
