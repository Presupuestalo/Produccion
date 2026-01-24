import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get("userId") || "d2552f2d-ce70-4a2e-a405-3f6119a763d4"

        // 1. Obtener estado actual
        const { data: current, error: fetchErr } = await supabaseAdmin
            .from("company_credits")
            .select("*")
            .eq("company_id", userId)
            .single()

        if (fetchErr) throw fetchErr

        if (current.credits_purchased_total > 0 && current.credits_balance === 0) {
            // Recovery logic: restore balance to match purchases
            const { data: updated, error: updateErr } = await supabaseAdmin
                .from("company_credits")
                .update({
                    credits_balance: current.credits_purchased_total,
                    updated_at: new Date().toISOString()
                })
                .eq("company_id", userId)
                .select()
                .single()

            if (updateErr) throw updateErr

            return NextResponse.json({
                success: true,
                message: "Créditos recuperados con éxito",
                before: current.credits_balance,
                after: updated.credits_balance,
                recovered: updated.credits_balance
            })
        }

        return NextResponse.json({
            success: false,
            message: "No se requiere recuperación o el saldo ya es distinto de 0",
            current_balance: current.credits_balance,
            purchased_total: current.credits_purchased_total
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
