import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function POST() {
    try {
        console.log("[v0] ADMIN: Starting total credits data wipe...")

        // Clear transactions
        const { error: txError } = await supabaseAdmin
            .from("credit_transactions")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000")

        if (txError) throw txError
        console.log("[v0] ADMIN: credit_transactions wiped")

        // Clear balances
        const { error: creditsError } = await supabaseAdmin
            .from("company_credits")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000")

        if (creditsError) throw creditsError
        console.log("[v0] ADMIN: company_credits wiped")

        return NextResponse.json({
            success: true,
            message: "Todos los datos de créditos y transacciones han sido borrados."
        })
    } catch (error: any) {
        console.error("[v0] ADMIN: Wipe failed:", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
