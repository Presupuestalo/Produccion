import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get("search")

        let query = supabaseAdmin
            .from("debug_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100)

        if (search) {
            query = query.ilike("message", `%${search}%`)
        }

        const { data: logs, error } = await query

        if (error) throw error

        if (!logs || logs.length === 0) {
            return NextResponse.json({ message: "No logs recorded in DB yet." })
        }

        const text = logs
            .map(l => `${l.created_at} | ${l.message} | ${JSON.stringify(l.data)}`)
            .join("\n")

        return new NextResponse(text, {
            headers: { "Content-Type": "text/plain; charset=utf-8" }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
