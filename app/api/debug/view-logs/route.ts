import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get("userId") || searchParams.get("companyId")

        let query = supabaseAdmin
            .from("debug_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100)

        if (userId) {
            // Filter logs by userId in message or data
            query = query.or(`data->>userId.eq.${userId},data->>companyId.eq.${userId},message.ilike.%${userId}%`)
        }

        const { data: logs, error } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!logs || logs.length === 0) {
            return NextResponse.json({
                message: "No persistent logs found.",
                filters: userId ? { userId } : "none"
            })
        }

        // Format logs as text for readability
        const text = logs
            .map((l) => `${l.created_at} | ${l.message.padEnd(40)} | ${JSON.stringify(l.data)}`)
            .join("\n")

        return new NextResponse(text, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
