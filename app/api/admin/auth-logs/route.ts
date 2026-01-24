import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const { data: logs, error } = await supabaseAdmin
            .from("debug_logs")
            .select("*")
            .ilike("message", "AUTH:%")
            .order("created_at", { ascending: false })
            .limit(100)

        if (error) throw error

        if (!logs || logs.length === 0) {
            return NextResponse.json({
                message: "No auth attempts recorded in DB yet.",
                hint: "Ensure you have run /api/debug/setup-db once."
            })
        }

        const text = logs
            .map(l => `${l.created_at} - ${l.message} - ${JSON.stringify(l.data)}`)
            .join("\n")

        return new NextResponse(text, {
            headers: { "Content-Type": "text/plain; charset=utf-8" }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
