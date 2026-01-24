import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const { data: logs, error } = await supabaseAdmin
            .from("debug_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!logs || logs.length === 0) {
            return NextResponse.json({ message: "No persistent logs found." })
        }

        // Format logs as text for readability
        const text = logs
            .map((l) => `${l.created_at} - ${l.message} - ${JSON.stringify(l.data)}`)
            .join("\n")

        return new NextResponse(text, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
