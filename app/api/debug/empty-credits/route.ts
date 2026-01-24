import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const userId = "d2552f2d-ce70-4a2e-a405-3f6119a763d4"

        const { data, error } = await supabaseAdmin
            .from("company_credits")
            .update({
                credits_balance: 0,
                updated_at: new Date().toISOString()
            })
            .eq("company_id", userId)
            .select()

        if (error) throw error

        return NextResponse.json({
            success: true,
            message: `Créditos vaciados para el usuario ${userId}`,
            data
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
